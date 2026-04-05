import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatOobGuidanceForAgent,
  OobVerificationTracker,
} from './oobVerification.ts'

// ---------------------------------------------------------------------------
// OobVerificationTracker — payload generation
// ---------------------------------------------------------------------------

test('OobVerificationTracker generates blind-xxe payloads', () => {
  const tracker = new OobVerificationTracker()
  const set = tracker.generatePayloads('blind-xxe', 'http://target.com/api', 'xml')

  assert.equal(set.vulnType, 'blind-xxe')
  assert.ok(set.payloads.length >= 2)
  assert.ok(set.callbackId.length > 0)
  assert.ok(set.payloads.some(p => p.payload.includes('ENTITY')))
})

test('OobVerificationTracker generates blind-ssrf payloads', () => {
  const tracker = new OobVerificationTracker()
  const set = tracker.generatePayloads('blind-ssrf', 'http://target.com/fetch', 'url')

  assert.ok(set.payloads.length >= 2)
  assert.ok(set.payloads.some(p => p.name.includes('SSRF')))
})

test('OobVerificationTracker generates blind-rce payloads', () => {
  const tracker = new OobVerificationTracker()
  const set = tracker.generatePayloads('blind-rce', 'http://target.com/exec', 'cmd')

  assert.ok(set.payloads.length >= 3)
  assert.ok(set.payloads.some(p => p.payload.includes('curl')))
  assert.ok(set.payloads.some(p => p.payload.includes('nslookup')))
})

test('OobVerificationTracker generates blind-sqli payloads', () => {
  const tracker = new OobVerificationTracker()
  const set = tracker.generatePayloads('blind-sqli', 'http://target.com/search', 'q')

  assert.ok(set.payloads.length >= 3)
  assert.ok(set.payloads.some(p => p.name.includes('MySQL')))
  assert.ok(set.payloads.some(p => p.name.includes('MSSQL')))
})

test('OobVerificationTracker generates log4shell payloads', () => {
  const tracker = new OobVerificationTracker()
  const set = tracker.generatePayloads('log4shell', 'http://target.com/api', 'header')

  assert.ok(set.payloads.length >= 3)
  assert.ok(set.payloads.some(p => p.payload.includes('jndi')))
})

test('OobVerificationTracker generates valid nested Log4Shell payload syntax', () => {
  const tracker = new OobVerificationTracker()
  const set = tracker.generatePayloads('log4shell', 'http://target.com/api', 'header')
  const nested = set.payloads.find(p => p.name === 'Log4Shell nested')

  assert.ok(nested)
  assert.ok(nested.payload.includes('${${lower:j}ndi:ldap://'))
  assert.ok(!nested.payload.includes('${$\\{lower:j}'))
})

test('OobVerificationTracker generates unique callback IDs per call', () => {
  const tracker = new OobVerificationTracker()
  const set1 = tracker.generatePayloads('blind-xxe', 'http://t1.com', 'xml')
  const set2 = tracker.generatePayloads('blind-xxe', 'http://t2.com', 'xml')

  assert.notEqual(set1.callbackId, set2.callbackId)
})

// ---------------------------------------------------------------------------
// Verification tracking
// ---------------------------------------------------------------------------

test('OobVerificationTracker tracks pending verifications', () => {
  const tracker = new OobVerificationTracker()
  tracker.generatePayloads('blind-rce', 'http://target.com', 'cmd')

  const pending = tracker.getPending()
  assert.ok(pending.length > 0)
  assert.ok(pending.every(v => v.status === 'pending'))
})

test('OobVerificationTracker confirmVerification marks as confirmed', () => {
  const tracker = new OobVerificationTracker()
  const set = tracker.generatePayloads('blind-ssrf', 'http://target.com', 'url')

  const confirmed = tracker.confirmVerification(set.callbackId, 'HTTP callback received from 10.0.0.1')
  assert.ok(confirmed)
  assert.equal(confirmed.status, 'confirmed')
  assert.ok(confirmed.confirmedAt)
  assert.equal(confirmed.evidence, 'HTTP callback received from 10.0.0.1')
})

test('OobVerificationTracker confirmVerification returns null for unknown ID', () => {
  const tracker = new OobVerificationTracker()
  const result = tracker.confirmVerification('nonexistent-id')
  assert.equal(result, null)
})

test('OobVerificationTracker checkTimeouts marks expired verifications', async () => {
  const tracker = new OobVerificationTracker({ defaultTimeoutMs: 10 })
  tracker.generatePayloads('blind-xxe', 'http://target.com', 'xml')

  // Wait for timeout to expire
  await new Promise(resolve => setTimeout(resolve, 20))
  const timedOut = tracker.checkTimeouts()
  assert.ok(timedOut.length > 0)
  assert.ok(timedOut.every(v => v.status === 'timeout'))
})

test('OobVerificationTracker getConfirmed returns only confirmed', () => {
  const tracker = new OobVerificationTracker()
  const set = tracker.generatePayloads('blind-rce', 'http://target.com', 'cmd')
  tracker.confirmVerification(set.callbackId)

  const confirmed = tracker.getConfirmed()
  assert.ok(confirmed.length > 0)
  assert.ok(confirmed.every(v => v.status === 'confirmed'))
})

test('OobVerificationTracker getByCallbackId returns matching verifications', () => {
  const tracker = new OobVerificationTracker()
  const set = tracker.generatePayloads('blind-xxe', 'http://target.com', 'xml')

  const results = tracker.getByCallbackId(set.callbackId)
  assert.ok(results.length > 0)
  assert.ok(results.every(v => v.callbackId === set.callbackId))
})

test('OobVerificationTracker getStats returns correct counts', () => {
  const tracker = new OobVerificationTracker()
  const set = tracker.generatePayloads('blind-rce', 'http://target.com', 'cmd')
  tracker.confirmVerification(set.callbackId)

  const stats = tracker.getStats()
  assert.ok(stats.total > 0)
  assert.ok(stats.confirmed >= 1)
  assert.ok(stats.pending >= 0)
})

test('OobVerificationTracker clear removes all verifications', () => {
  const tracker = new OobVerificationTracker()
  tracker.generatePayloads('blind-xxe', 'http://target.com', 'xml')
  tracker.clear()

  assert.equal(tracker.getStats().total, 0)
})

// ---------------------------------------------------------------------------
// Agent guidance formatting
// ---------------------------------------------------------------------------

test('formatOobGuidanceForAgent produces structured instructions', () => {
  const tracker = new OobVerificationTracker()
  const set = tracker.generatePayloads('blind-xxe', 'http://target.com/api', 'xml')

  const guidance = formatOobGuidanceForAgent(set)
  assert.ok(guidance.includes('OOB Verification'))
  assert.ok(guidance.includes('blind-xxe'))
  assert.ok(guidance.includes('Callback ID'))
  assert.ok(guidance.includes('Available payloads'))
  assert.ok(guidance.includes('Instructions'))
  assert.ok(guidance.includes('interactsh'))
})
