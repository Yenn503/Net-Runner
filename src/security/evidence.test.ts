import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  appendEvidenceEntry,
  countEvidenceEntriesByType,
  readEvidenceEntries,
} from './evidence.ts'

test('evidence ledger stores append-only findings and notes', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-evidence-'))

  await appendEvidenceEntry(cwd, {
    type: 'note',
    note: 'Captured initial recon scope.',
  })
  await appendEvidenceEntry(cwd, {
    type: 'finding',
    title: 'Exposed debug endpoint',
    severity: 'medium',
    evidence: 'GET /debug returned internal stack traces.',
    recommendation: 'Disable the endpoint outside internal environments.',
  })

  const entries = await readEvidenceEntries(cwd)
  const counts = countEvidenceEntriesByType(entries)

  assert.equal(entries.length, 2)
  assert.equal(counts.note, 1)
  assert.equal(counts.finding, 1)
})
