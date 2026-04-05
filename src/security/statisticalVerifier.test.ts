import assert from 'node:assert/strict'
import test from 'node:test'

import {
  confidenceInterval,
  mean,
  standardDeviation,
  variance,
  verifyResponseLengthDifferential,
  verifyTimeBased,
  welchTTest,
} from './statisticalVerifier.ts'

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

test('mean computes correctly', () => {
  assert.equal(mean([1, 2, 3, 4, 5]), 3)
  assert.equal(mean([10]), 10)
  assert.equal(mean([]), 0)
})

test('variance computes sample variance', () => {
  const v = variance([2, 4, 4, 4, 5, 5, 7, 9])
  assert.ok(Math.abs(v - 4.571) < 0.01)
})

test('variance returns 0 for single element', () => {
  assert.equal(variance([42]), 0)
})

test('standardDeviation is sqrt of variance', () => {
  const sd = standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])
  assert.ok(Math.abs(sd - Math.sqrt(4.571)) < 0.01)
})

// ---------------------------------------------------------------------------
// Welch's t-test
// ---------------------------------------------------------------------------

test('welchTTest returns significant result for clearly different distributions', () => {
  const baseline = [0.1, 0.12, 0.11, 0.13, 0.09, 0.1, 0.11, 0.12, 0.1, 0.11]
  const payload = [5.1, 5.2, 5.05, 5.15, 5.0, 5.1, 5.2, 5.05, 5.15, 5.1]

  const [tStat, pValue] = welchTTest(baseline, payload)
  assert.ok(tStat > 0, 'T-statistic should be positive (payload > baseline)')
  assert.ok(pValue < 0.001, `P-value should be very small, got ${pValue}`)
})

test('welchTTest returns non-significant result for similar distributions', () => {
  const a = [1.0, 1.1, 0.9, 1.05, 0.95]
  const b = [1.02, 1.08, 0.92, 1.03, 0.97]

  const [, pValue] = welchTTest(a, b)
  assert.ok(pValue > 0.05, `P-value should be large for similar distributions, got ${pValue}`)
})

test('welchTTest handles insufficient samples', () => {
  const [tStat, pValue] = welchTTest([1], [2])
  assert.equal(tStat, 0)
  assert.equal(pValue, 1)
})

test('welchTTest handles identical distributions', () => {
  const a = [1, 1, 1, 1, 1]
  const b = [1, 1, 1, 1, 1]
  const [, pValue] = welchTTest(a, b)
  assert.equal(pValue, 1)
})

// ---------------------------------------------------------------------------
// Confidence interval
// ---------------------------------------------------------------------------

test('confidenceInterval contains the true difference for clearly different groups', () => {
  const baseline = [0.1, 0.12, 0.11, 0.13, 0.09]
  const payload = [5.1, 5.2, 5.05, 5.15, 5.0]

  const [lower, upper] = confidenceInterval(baseline, payload, 0.95)
  assert.ok(lower > 4, `Lower bound should be >4, got ${lower}`)
  assert.ok(upper < 6, `Upper bound should be <6, got ${upper}`)
})

test('confidenceInterval returns [0,0] for insufficient samples', () => {
  const [lower, upper] = confidenceInterval([1], [2], 0.95)
  assert.equal(lower, 0)
  assert.equal(upper, 0)
})

// ---------------------------------------------------------------------------
// verifyTimeBased
// ---------------------------------------------------------------------------

test('verifyTimeBased confirms a clear time-based blind injection', () => {
  const baseline = [0.1, 0.12, 0.11, 0.13, 0.09, 0.1, 0.12, 0.11, 0.1, 0.11]
  const payload = [5.1, 5.2, 5.05, 5.15, 5.0, 5.1, 5.2, 5.05, 5.15, 5.1]

  const result = verifyTimeBased(
    'http://target.com/search',
    'q',
    "' AND SLEEP(5)--",
    baseline,
    payload,
    { expectedDelaySeconds: 5 },
  )

  assert.equal(result.isConfirmed, true)
  assert.ok(result.confidenceScore > 0.8)
  assert.ok(result.pValue < 0.05)
  assert.ok(result.recommendation.includes('CONFIRMED'))
  assert.equal(result.positiveCount, payload.length)
})

test('verifyTimeBased rejects when payload times are similar to baseline', () => {
  const baseline = [0.1, 0.12, 0.11, 0.13, 0.09]
  const payload = [0.11, 0.13, 0.1, 0.14, 0.12]

  const result = verifyTimeBased(
    'http://target.com/search',
    'q',
    "' AND SLEEP(5)--",
    baseline,
    payload,
    { expectedDelaySeconds: 5 },
  )

  assert.equal(result.isConfirmed, false)
  assert.ok(result.confidenceScore < 0.1)
  assert.ok(result.recommendation.includes('NOT CONFIRMED'))
})

test('verifyTimeBased handles insufficient baseline samples', () => {
  const result = verifyTimeBased(
    'http://target.com/search',
    'q',
    "' AND SLEEP(5)--",
    [0.1, 0.2],
    [5.0, 5.1, 5.2, 5.3],
  )

  assert.equal(result.isConfirmed, false)
  assert.ok(result.recommendation.includes('baseline samples'))
})

test('verifyTimeBased handles insufficient payload samples', () => {
  const result = verifyTimeBased(
    'http://target.com/search',
    'q',
    "' AND SLEEP(5)--",
    [0.1, 0.2, 0.3, 0.15],
    [5.0],
  )

  assert.equal(result.isConfirmed, false)
  assert.ok(result.recommendation.includes('payload samples'))
})

test('verifyTimeBased includes statistical details', () => {
  const baseline = [0.1, 0.12, 0.11, 0.13, 0.09]
  const payload = [5.1, 5.2, 5.05, 5.15, 5.0]

  const result = verifyTimeBased('http://x.com', 'q', 'test', baseline, payload)
  const detailLabels = result.details.map(d => d.label)
  assert.ok(detailLabels.includes('baseline_mean'))
  assert.ok(detailLabels.includes('p_value'))
  assert.ok(detailLabels.includes('t_statistic'))
  assert.ok(detailLabels.includes('ci_lower'))
  assert.ok(detailLabels.includes('positive_ratio'))
})

// ---------------------------------------------------------------------------
// verifyResponseLengthDifferential
// ---------------------------------------------------------------------------

test('verifyResponseLengthDifferential confirms when lengths differ significantly', () => {
  const baseline = [5000, 5010, 4990, 5005, 4995]
  const payload = [200, 210, 195, 205, 198]

  const result = verifyResponseLengthDifferential(
    'http://target.com/api',
    'id',
    "1 AND 1=2",
    baseline,
    payload,
  )

  assert.equal(result.isConfirmed, true)
  assert.ok(result.confidenceScore > 0.5)
  assert.ok(result.recommendation.includes('CONFIRMED'))
})

test('verifyResponseLengthDifferential rejects when lengths are similar', () => {
  const baseline = [5000, 5010, 4990, 5005, 4995]
  const payload = [5002, 5008, 4992, 5003, 4998]

  const result = verifyResponseLengthDifferential(
    'http://target.com/api',
    'id',
    "1 AND 1=2",
    baseline,
    payload,
  )

  assert.equal(result.isConfirmed, false)
  assert.ok(result.recommendation.includes('NOT CONFIRMED'))
})

test('verifyResponseLengthDifferential handles insufficient samples', () => {
  const result = verifyResponseLengthDifferential(
    'http://target.com/api',
    'id',
    'test',
    [100],
    [200, 210],
  )

  assert.equal(result.isConfirmed, false)
  assert.ok(result.recommendation.includes('Insufficient'))
})
