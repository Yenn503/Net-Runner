import assert from 'node:assert/strict'
import test from 'node:test'

import {
  detectWaf,
  formatWafGuidanceForAgent,
  type WafDetectionResult,
} from './wafDetection.ts'

// ---------------------------------------------------------------------------
// detectWaf
// ---------------------------------------------------------------------------

test('detectWaf identifies Cloudflare from CF-Ray header', () => {
  const result = detectWaf(403, { 'CF-Ray': '1234abc', 'Server': 'cloudflare' }, '')
  assert.equal(result.detected, true)
  assert.equal(result.wafType, 'cloudflare')
  assert.ok(result.confidence > 0)
  assert.ok(result.bypassStrategies.length > 0)
})

test('detectWaf identifies Cloudflare from body pattern', () => {
  const result = detectWaf(403, {}, 'Attention Required! | Cloudflare Ray ID: abc123')
  assert.equal(result.detected, true)
  assert.equal(result.wafType, 'cloudflare')
})

test('detectWaf identifies ModSecurity from body', () => {
  const result = detectWaf(403, {}, 'ModSecurity: Access denied with code 403. OWASP CRS rule triggered.')
  assert.equal(result.detected, true)
  assert.equal(result.wafType, 'modsecurity')
  assert.ok(result.matchedSignatures.length > 0)
})

test('detectWaf identifies Imperva from cookies', () => {
  const result = detectWaf(403, { 'Set-Cookie': 'visid_incap_12345=abc; incap_ses_456=xyz' }, 'Request unsuccessful')
  assert.equal(result.detected, true)
  assert.equal(result.wafType, 'imperva')
})

test('detectWaf identifies AWS WAF', () => {
  const result = detectWaf(403, { 'x-amzn-RequestId': '123' }, 'Request blocked by AWS WAF')
  assert.equal(result.detected, true)
  assert.equal(result.wafType, 'aws-waf')
})

test('detectWaf identifies F5 BIG-IP from cookie', () => {
  const result = detectWaf(403, { 'Set-Cookie': 'tsabcdef1234=value; BIGipServerpool=rd123' }, 'The requested URL was rejected.')
  assert.equal(result.detected, true)
  assert.equal(result.wafType, 'f5-bigip')
})

test('detectWaf identifies Akamai from header', () => {
  const result = detectWaf(403, { 'Server': 'AkamaiGHost' }, '')
  assert.equal(result.detected, true)
  assert.equal(result.wafType, 'akamai')
})

test('detectWaf identifies Sucuri from body', () => {
  const result = detectWaf(403, { 'Server': 'Sucuri/Cloudproxy' }, 'Access Denied - Sucuri Website Firewall')
  assert.equal(result.detected, true)
  assert.equal(result.wafType, 'sucuri')
})

test('detectWaf identifies Fortinet from body', () => {
  const result = detectWaf(403, {}, 'FortiWeb blocked this request. FortiGate redirect.')
  assert.equal(result.detected, true)
  assert.equal(result.wafType, 'fortinet')
})

test('detectWaf returns none when no WAF detected', () => {
  const result = detectWaf(200, { 'Server': 'nginx' }, '<html>Hello world</html>')
  assert.equal(result.detected, false)
  assert.equal(result.wafType, 'none')
  assert.equal(result.bypassStrategies.length, 0)
})

test('detectWaf picks highest-scoring WAF when multiple signatures match', () => {
  const result = detectWaf(
    403,
    { 'CF-Ray': '123', 'Server': 'cloudflare', 'CF-Cache-Status': 'DYNAMIC' },
    'Attention Required! | Cloudflare. Checking your browser.',
  )
  assert.equal(result.wafType, 'cloudflare')
  assert.ok(result.confidence > 0.5)
})

// ---------------------------------------------------------------------------
// Bypass strategies
// ---------------------------------------------------------------------------

test('Cloudflare bypass strategies include chunked transfer and double-encode', () => {
  const result = detectWaf(403, { 'Server': 'cloudflare', 'CF-Ray': '123' }, '')
  const names = result.bypassStrategies.map(s => s.name)
  assert.ok(names.includes('Chunked transfer'))
  assert.ok(names.includes('Double URL-encode'))
})

test('ModSecurity bypass strategies include SQL comment nesting', () => {
  const result = detectWaf(403, {}, 'ModSecurity blocked')
  const names = result.bypassStrategies.map(s => s.name)
  assert.ok(names.includes('SQL comment nesting'))
})

test('bypass strategies are sorted by priority descending', () => {
  const result = detectWaf(403, { 'Server': 'cloudflare', 'CF-Ray': '123' }, '')
  for (let i = 1; i < result.bypassStrategies.length; i++) {
    assert.ok(
      result.bypassStrategies[i - 1]!.priority >= result.bypassStrategies[i]!.priority,
      'Strategies should be sorted by priority descending',
    )
  }
})

// ---------------------------------------------------------------------------
// formatWafGuidanceForAgent
// ---------------------------------------------------------------------------

test('formatWafGuidanceForAgent produces structured guidance for detected WAF', () => {
  const result = detectWaf(403, { 'Server': 'cloudflare', 'CF-Ray': '123' }, '')
  const guidance = formatWafGuidanceForAgent(result)

  assert.ok(guidance.includes('Cloudflare'))
  assert.ok(guidance.includes('confidence'))
  assert.ok(guidance.includes('Recommended bypass strategies'))
})

test('formatWafGuidanceForAgent produces simple message when no WAF', () => {
  const result: WafDetectionResult = {
    detected: false,
    wafType: 'none',
    wafName: 'None detected',
    confidence: 0,
    matchedSignatures: [],
    bypassStrategies: [],
  }
  const guidance = formatWafGuidanceForAgent(result)
  assert.ok(guidance.includes('No WAF detected'))
  assert.ok(guidance.includes('standard payloads'))
})
