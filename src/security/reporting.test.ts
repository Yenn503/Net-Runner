import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createDefaultEngagementManifest } from './engagement.ts'
import type { EvidenceEntry } from './evidence.ts'
import {
  generateMarkdownReport,
  writeMarkdownReport,
} from './reporting.ts'

test('report generation includes engagement metadata and findings', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-report-'))
  const manifest = createDefaultEngagementManifest({
    cwd,
    workflowId: 'web-app-testing',
    targets: ['https://target.lab'],
  })
  const entries: EvidenceEntry[] = [
    {
      id: '1',
      createdAt: new Date().toISOString(),
      type: 'finding',
      title: 'Missing auth on admin route',
      severity: 'high',
      evidence: 'GET /admin returned a 200 without authentication.',
      recommendation: 'Require authentication and retest.',
    },
  ]

  const markdown = generateMarkdownReport(manifest, entries)
  const reportPath = await writeMarkdownReport(cwd, manifest, entries)
  const persisted = await readFile(reportPath, 'utf8')

  assert.match(markdown, /Net-Runner Report/)
  assert.match(markdown, /Missing auth on admin route/)
  assert.match(persisted, /GET \/admin returned a 200/)
})
