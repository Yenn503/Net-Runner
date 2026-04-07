import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { call as engagementCall } from '../src/commands/engagement/engagement.ts'
import { call as evidenceCall } from '../src/commands/evidence/evidence.ts'
import { call as reportCall } from '../src/commands/report/report.ts'
import type { LocalJSXCommandContext } from '../src/types/command.ts'
import { runWithCwdOverride } from '../src/utils/cwd.ts'

function getTextValue(value: unknown): string {
  if (
    value &&
    typeof value === 'object' &&
    'type' in value &&
    'value' in value &&
    (value as { type: unknown }).type === 'text' &&
    typeof (value as { value: unknown }).value === 'string'
  ) {
    return (value as { value: string }).value
  }
  throw new Error('Unexpected non-text command result in red-team smoke')
}

const COMMAND_CONTEXT = {} as LocalJSXCommandContext

const workspace = await mkdtemp(join(tmpdir(), 'net-runner-command-smoke-'))
try {
  const output = await runWithCwdOverride(workspace, async () => {
    const init = await engagementCall(
      'init web-app-testing https://example.test',
      COMMAND_CONTEXT,
    )
    const status = await engagementCall('status', COMMAND_CONTEXT)
    const capabilities = await engagementCall(
      'capabilities web-app-testing',
      COMMAND_CONTEXT,
    )
    const alignment = await engagementCall('alignment', COMMAND_CONTEXT)
    const guard = await engagementCall(
      'guard nmap -sS 10.0.0.5',
      COMMAND_CONTEXT,
    )
    const note = await evidenceCall(
      'note Baseline recon completed and triaged.',
      COMMAND_CONTEXT,
    )
    const finding = await evidenceCall(
      'finding medium SQLi in /api/search | Parameter q is injectable in scoped staging endpoint | Parameterize query inputs and add validation.',
      COMMAND_CONTEXT,
    )
    const artifact = await evidenceCall(
      'artifact Burp request sample | artifacts/burp/request-001.txt | Captured request used in reproduction.',
      COMMAND_CONTEXT,
    )
    const report = await reportCall('latest', COMMAND_CONTEXT)
    return { init, status, capabilities, alignment, guard, note, finding, artifact, report }
  })

  const init = getTextValue(output.init)
  const status = getTextValue(output.status)
  const capabilities = getTextValue(output.capabilities)
  const alignment = getTextValue(output.alignment)
  const guard = getTextValue(output.guard)
  const note = getTextValue(output.note)
  const finding = getTextValue(output.finding)
  const artifact = getTextValue(output.artifact)
  const report = getTextValue(output.report)

  assert.match(init, /Initialized Net-Runner engagement\./)
  assert.match(status, /name: net-runner-workspace/)
  assert.match(capabilities, /workflow: web-app-testing/)
  assert.match(alignment, /status: PASS/)
  assert.match(guard, /Guardrail decision:/)
  assert.match(note, /Added evidence note\./)
  assert.match(finding, /Added evidence finding\./)
  assert.match(artifact, /Added evidence artifact\./)
  assert.match(report, /Generated Net-Runner report at/)

  const engagementManifestPath = join(workspace, '.netrunner', 'engagement.json')
  const reportPath = join(workspace, '.netrunner', 'reports', 'latest.md')
  await access(engagementManifestPath)
  await access(reportPath)

  const reportContents = await readFile(reportPath, 'utf8')
  assert.match(reportContents, /Net-Runner Report/)
  assert.match(reportContents, /SQLi in \/api\/search/)
  assert.match(reportContents, /artifacts\/burp\/request-001.txt/)

  console.log('Red-team command smoke passed.')
  console.log(`Workspace: ${workspace}`)
} finally {
  await rm(workspace, { recursive: true, force: true })
}
