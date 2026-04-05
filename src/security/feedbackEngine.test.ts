import assert from 'node:assert/strict'
import test from 'node:test'

import {
  analyzeFailure,
  encodePayload,
  FeedbackEngine,
  mutatePayload,
  pickUserAgent,
  selectStrategies,
  type FailureReason,
} from './feedbackEngine.ts'

// ---------------------------------------------------------------------------
// analyzeFailure
// ---------------------------------------------------------------------------

test('analyzeFailure detects Cloudflare WAF from response body', () => {
  const analysis = analyzeFailure(null, 'Attention Required! | Cloudflare', null, 403)
  assert.equal(analysis.reason, 'waf-blocked')
  assert.ok(analysis.confidence >= 0.8)
  assert.ok(analysis.description.includes('cloudflare'))
  assert.ok(analysis.suggestions.length > 0)
})

test('analyzeFailure detects ModSecurity WAF from response body', () => {
  const analysis = analyzeFailure(null, 'ModSecurity: Access denied with code 403', null, 403)
  assert.equal(analysis.reason, 'waf-blocked')
  assert.ok(analysis.description.includes('modsecurity'))
})

test('analyzeFailure detects rate limiting from HTTP 429', () => {
  const analysis = analyzeFailure(null, 'Too many requests', null, 429)
  assert.equal(analysis.reason, 'rate-limited')
  assert.ok(analysis.confidence >= 0.9)
})

test('analyzeFailure detects rate limiting from response headers', () => {
  const analysis = analyzeFailure(null, '', { 'X-RateLimit-Remaining': '0' }, 200)
  assert.equal(analysis.reason, 'rate-limited')
})

test('analyzeFailure detects CAPTCHA requirement', () => {
  const analysis = analyzeFailure(null, '<div class="g-recaptcha" data-sitekey="abc"></div>', null, 200)
  assert.equal(analysis.reason, 'captcha-required')
})

test('analyzeFailure detects auth required from 401', () => {
  const analysis = analyzeFailure(null, '', null, 401)
  assert.equal(analysis.reason, 'auth-required')
  assert.ok(analysis.confidence >= 0.9)
})

test('analyzeFailure detects auth required from 403', () => {
  const analysis = analyzeFailure(null, 'Please log in to continue', null, 403)
  assert.equal(analysis.reason, 'auth-required')
})

test('analyzeFailure detects server error from 500', () => {
  const analysis = analyzeFailure(null, 'Internal Server Error', null, 500)
  assert.equal(analysis.reason, 'server-error')
})

test('analyzeFailure detects not found from 404', () => {
  const analysis = analyzeFailure(null, 'Not Found', null, 404)
  assert.equal(analysis.reason, 'not-found')
})

test('analyzeFailure detects timeout from error message', () => {
  const analysis = analyzeFailure({ message: 'ETIMEDOUT: connection timed out' })
  assert.equal(analysis.reason, 'timeout')
})

test('analyzeFailure detects connection error from error message', () => {
  const analysis = analyzeFailure({ message: 'ECONNREFUSED: connection refused' })
  assert.equal(analysis.reason, 'connection-error')
})

test('analyzeFailure detects DNS error from error message', () => {
  const analysis = analyzeFailure({ message: 'ENOTFOUND: dns resolution failed' })
  assert.equal(analysis.reason, 'dns-error')
})

test('analyzeFailure returns unknown for unrecognized errors', () => {
  const analysis = analyzeFailure({ message: 'something weird happened' })
  assert.equal(analysis.reason, 'unknown')
})

// ---------------------------------------------------------------------------
// selectStrategies
// ---------------------------------------------------------------------------

test('selectStrategies returns WAF bypass strategies for waf-blocked', () => {
  const strategies = selectStrategies('waf-blocked')
  assert.ok(strategies.length > 0)
  assert.ok(strategies.every(s => s.applicableReasons.includes('waf-blocked')))
  // Should be sorted by priority descending
  for (let i = 1; i < strategies.length; i++) {
    assert.ok(strategies[i - 1]!.priority >= strategies[i]!.priority)
  }
})

test('selectStrategies returns delay strategies for rate-limited', () => {
  const strategies = selectStrategies('rate-limited')
  assert.ok(strategies.length > 0)
  assert.ok(strategies.some(s => s.type === 'delay'))
})

test('selectStrategies respects maxCount', () => {
  const strategies = selectStrategies('waf-blocked', 2)
  assert.ok(strategies.length <= 2)
})

test('selectStrategies returns empty for unknown with no applicable strategies', () => {
  const strategies = selectStrategies('dns-error')
  // dns-error has no specific strategies in the default set
  assert.equal(strategies.length, 0)
})

// ---------------------------------------------------------------------------
// mutatePayload
// ---------------------------------------------------------------------------

test('mutatePayload case-toggle changes casing', () => {
  const result = mutatePayload('SELECT * FROM users', 'case-toggle')
  assert.notEqual(result, result.toUpperCase())
  assert.equal(result.toLowerCase(), 'select * from users')
})

test('mutatePayload inline-comment inserts SQL comments', () => {
  const result = mutatePayload('UNION SELECT 1 FROM dual', 'inline-comment')
  assert.ok(result.includes('/**/'))
})

test('mutatePayload space-substitute replaces spaces', () => {
  const result = mutatePayload('a b c', 'space-substitute')
  assert.ok(!result.includes(' ') || result === 'a b c')
})

test('mutatePayload concat-break splits long strings', () => {
  const result = mutatePayload('administrator', 'concat-break')
  assert.ok(result.includes("'+'"))
})

test('mutatePayload returns original for unknown mutation', () => {
  const result = mutatePayload('test', 'nonexistent')
  assert.equal(result, 'test')
})

// ---------------------------------------------------------------------------
// encodePayload
// ---------------------------------------------------------------------------

test('encodePayload double-url encodes twice', () => {
  const result = encodePayload('test value', 'double-url')
  // Double encoding: space → %20 → %2520
  assert.ok(result.includes('%2520'), `Expected double-encoded space in: ${result}`)
  // Should not contain a bare space
  assert.ok(!result.includes(' '))
})

test('encodePayload unicode encodes special chars', () => {
  const result = encodePayload("'<>", 'unicode')
  assert.ok(result.includes('\\u'))
})

test('encodePayload hex encodes all chars', () => {
  const result = encodePayload('AB', 'hex')
  assert.equal(result, '%41%42')
})

test('encodePayload base64 encodes correctly', () => {
  const result = encodePayload('hello', 'base64')
  assert.equal(result, Buffer.from('hello').toString('base64'))
})

test('encodePayload returns original for unknown encoding', () => {
  const result = encodePayload('test', 'unknown')
  assert.equal(result, 'test')
})

// ---------------------------------------------------------------------------
// pickUserAgent
// ---------------------------------------------------------------------------

test('pickUserAgent returns a valid UA string', () => {
  const ua = pickUserAgent()
  assert.ok(ua.includes('Mozilla'))
})

// ---------------------------------------------------------------------------
// FeedbackEngine class
// ---------------------------------------------------------------------------

test('FeedbackEngine produces retry guidance for WAF block', () => {
  const engine = new FeedbackEngine({ maxRetries: 3 })
  const guidance = engine.produceRetryGuidance(
    0,
    "' OR 1=1--",
    null,
    'Attention Required! | Cloudflare',
    null,
    403,
  )

  assert.equal(guidance.shouldRetry, true)
  assert.equal(guidance.analysis.reason, 'waf-blocked')
  assert.ok(guidance.recommendedStrategies.length > 0)
  assert.ok(guidance.mutatedPayload !== null)
  assert.ok(guidance.agentInstruction.length > 0)
})

test('FeedbackEngine produces retry guidance with delay for rate limit', () => {
  const engine = new FeedbackEngine({ maxRetries: 3 })
  const guidance = engine.produceRetryGuidance(
    1,
    null,
    null,
    'Too many requests',
    null,
    429,
  )

  assert.equal(guidance.shouldRetry, true)
  assert.equal(guidance.analysis.reason, 'rate-limited')
  assert.ok(guidance.delayMs > 0)
})

test('FeedbackEngine stops retrying at max attempts', () => {
  const engine = new FeedbackEngine({ maxRetries: 2 })
  const guidance = engine.produceRetryGuidance(
    2,
    "' OR 1=1--",
    null,
    'blocked',
    null,
    403,
  )

  assert.equal(guidance.shouldRetry, false)
  assert.ok(guidance.agentInstruction.includes('Max retries'))
})

test('FeedbackEngine tracks strategy stats', () => {
  const engine = new FeedbackEngine()
  engine.recordAttempt('url-double-encode', true)
  engine.recordAttempt('url-double-encode', true)
  engine.recordAttempt('url-double-encode', false)
  engine.recordAttempt('mixed-case', false)

  const stats = engine.getStrategyStats()
  const doubleEncode = stats.find(s => s.name === 'url-double-encode')
  assert.ok(doubleEncode)
  assert.equal(doubleEncode.successes, 2)
  assert.equal(doubleEncode.failures, 1)
  assert.ok(doubleEncode.successRate > 0.6)
})

test('FeedbackEngine reset clears all stats', () => {
  const engine = new FeedbackEngine()
  engine.recordAttempt('test', true)
  engine.reset()
  assert.equal(engine.getStrategyStats().length, 0)
})

test('FeedbackEngine adds header overrides for IP-blocked failures', () => {
  const engine = new FeedbackEngine()
  const guidance = engine.produceRetryGuidance(
    0,
    null,
    { message: 'Your IP has been blocked' },
    'Access denied. Your IP address has been blocked.',
    null,
    403,
  )

  assert.equal(guidance.shouldRetry, true)
  assert.equal(guidance.analysis.reason, 'ip-blocked')
  assert.ok(Object.keys(guidance.headerOverrides).length > 0)
})
