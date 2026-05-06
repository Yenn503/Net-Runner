import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createDefaultEngagementManifest } from './engagement.ts'
import type { EvidenceEntry } from './evidence.ts'
import {
  generateHtmlReport,
  generateMarkdownReport,
  writeHtmlReport,
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
      evidenceSource: 'http-request-response',
      affectedAssets: ['https://target.lab/admin'],
      confidence: 'high',
      replayCommand: 'printf "GET /admin returned a 200 without authentication."',
      recommendation: 'Require authentication and retest.',
      cweIds: ['CWE-862'],
      cvss: {
        version: '3.1',
        vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N',
        baseScore: 9.1,
        baseSeverity: 'critical',
      },
      mitreAttack: [
        {
          techniqueId: 'T1190',
          techniqueName: 'Exploit Public-Facing Application',
          tacticName: 'Initial Access',
        },
      ],
      owaspCategory: ['A01:2021-Broken-Access-Control'],
      compliance: [
        {
          framework: 'NIST-800-53',
          controls: ['AC-3', 'AC-6'],
        },
      ],
    },
    {
      id: 'validation-1',
      createdAt: new Date().toISOString(),
      type: 'validation',
      findingId: '1',
      verdict: 'reproduces',
      method: 'replay',
      command: 'printf "GET /admin returned a 200 without authentication."',
      summary: 'Replay reproduced unauthenticated 200 response.',
      confidenceScore: 1,
    },
  ]

  const markdown = generateMarkdownReport(manifest, entries)
  const html = generateHtmlReport(manifest, entries)
  const reportPath = await writeMarkdownReport(cwd, manifest, entries)
  const htmlReportPath = await writeHtmlReport(cwd, manifest, entries)
  const persisted = await readFile(reportPath, 'utf8')
  const persistedHtml = await readFile(htmlReportPath, 'utf8')

  assert.match(markdown, /Net-Runner Report/)
  assert.match(markdown, /Missing auth on admin route/)
  assert.match(persisted, /GET \/admin returned a 200/)
  assert.match(markdown, /CVSS:3\.1\/AV:N\/AC:L\/PR:N\/UI:N\/S:U\/C:H\/I:H\/A:N/)
  assert.match(markdown, /CWE-862/)
  assert.match(markdown, /T1190/)
  assert.match(markdown, /A01:2021-Broken-Access-Control/)
  assert.match(markdown, /NIST-800-53: AC-3, AC-6/)
  assert.match(markdown, /Severity Dashboard/)
  assert.match(markdown, /Evidence Status/)
  assert.match(markdown, /Validated: replay; verdict reproduces/)
  assert.match(markdown, /Remediation Backlog/)
  assert.match(html, /Executive Dashboard/)
  assert.match(html, /Evidence Status/)
  assert.match(html, /MITRE ATT&amp;CK Coverage/)
  assert.match(persistedHtml, /Net-Runner Security Assessment/)
})
