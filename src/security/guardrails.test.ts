import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assessActionAgainstImpact,
  wrapUntrustedData,
} from './guardrails.ts'

test('guardrails block destructive actions outside intrusive engagements', () => {
  const decision = assessActionAgainstImpact(
    'systemctl stop nginx',
    'limited',
    'confirmed',
  )

  assert.equal(decision.action, 'block')
  assert.equal(decision.tripwireTriggered, true)
  assert.deepEqual(decision.matchedPatterns, ['service-disruption'])
})

test('guardrails review state changes inside read-only engagements', () => {
  const decision = assessActionAgainstImpact(
    'modify the target config to validate a fix',
    'read-only',
    'confirmed',
  )

  assert.equal(decision.action, 'review')
  assert.equal(decision.tripwireTriggered, true)
})

test('untrusted data wrapper is explicit and bounded', () => {
  const wrapped = wrapUntrustedData('payload')

  assert.match(wrapped, /^BEGIN UNTRUSTED DATA/m)
  assert.match(wrapped, /payload/)
  assert.match(wrapped, /END UNTRUSTED DATA$/m)
})
