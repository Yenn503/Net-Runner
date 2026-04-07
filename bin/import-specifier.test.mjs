import assert from 'node:assert/strict'
import test from 'node:test'

import { getDistImportSpecifier } from './import-specifier.mjs'

test('builds a file URL import specifier for dist/cli.mjs', () => {
  const specifier = getDistImportSpecifier('C:\\repo\\bin')

  assert.equal(
    specifier,
    'file:///C:/repo/dist/cli.mjs',
  )
})

test('encodes Windows paths with spaces', () => {
  const specifier = getDistImportSpecifier('C:\\repo with space\\bin')

  assert.equal(
    specifier,
    'file:///C:/repo%20with%20space/dist/cli.mjs',
  )
})

test('encodes Windows paths with special characters', () => {
  const specifier = getDistImportSpecifier('C:\\repo#1\\bin')

  assert.equal(
    specifier,
    'file:///C:/repo%231/dist/cli.mjs',
  )
})
