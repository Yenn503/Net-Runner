import assert from 'node:assert/strict'
import test from 'node:test'

import {
  NET_RUNNER_BRAND,
  getPrimaryCliName,
  getSupportedCliAliases,
} from './product.ts'

test('Net-Runner brand metadata exposes the new primary CLI identity', () => {
  assert.equal(NET_RUNNER_BRAND.productName, 'Net-Runner')
  assert.equal(getPrimaryCliName(), 'net-runner')
  assert.deepEqual(getSupportedCliAliases(), ['net-runner'])
  assert.match(NET_RUNNER_BRAND.description, /security-first/i)
  assert.match(NET_RUNNER_BRAND.docsUrl, /net-runner|security/i)
})
