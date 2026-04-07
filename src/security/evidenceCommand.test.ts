import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { call as evidenceCommand } from '../commands/evidence/evidence.js'
import { initializeNetRunnerProject } from './engagement.ts'
import { readEvidenceEntries } from './evidence.ts'
import type { LocalJSXCommandContext } from '../types/command.js'
import { runWithCwdOverride } from '../utils/cwd.js'

test('evidence command records finding classification metadata into the ledger', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-evidence-command-'))
  await initializeNetRunnerProject({
    cwd,
    workflowId: 'web-app-testing',
    targets: ['https://target.lab'],
  })

  const result = await runWithCwdOverride(cwd, () =>
    evidenceCommand(
      `finding high Missing auth on admin route | GET /admin returned 200 without authentication. | Require authentication. | {"cweIds":["CWE-862"],"cvss":{"vector":"CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N","baseScore":9.1},"mitreAttack":["T1190"],"compliance":[{"framework":"NIST-800-53","controls":["AC-3","AC-6"]}]}`,
      {} as LocalJSXCommandContext,
    ),
  )

  assert.equal(result.type, 'text')
  assert.match(result.value, /Added evidence finding/)

  const entries = await readEvidenceEntries(cwd)
  const finding = entries.find(entry => entry.type === 'finding')
  assert.ok(finding)
  assert.deepEqual(finding.cweIds, ['CWE-862'])
  assert.equal(finding.cvss?.baseScore, 9.1)
  assert.equal(finding.cvss?.baseSeverity, 'critical')
  assert.equal(finding.mitreAttack?.[0]?.techniqueId, 'T1190')
  assert.deepEqual(finding.owaspCategory, ['A01:2021-Broken-Access-Control'])
  assert.deepEqual(finding.compliance, [
    {
      framework: 'NIST-800-53',
      controls: ['AC-3', 'AC-6'],
    },
  ])
})
