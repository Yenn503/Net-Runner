import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { call as engagementCall } from '../src/commands/engagement/engagement.ts'
import { call as reportCall } from '../src/commands/report/report.ts'
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

const workspace = await mkdtemp(join(tmpdir(), 'net-runner-command-smoke-'))
try {
  const output = await runWithCwdOverride(workspace, async () => {
    const init = await engagementCall('init web-app-testing https://example.test')
    const status = await engagementCall('status')
    const capabilities = await engagementCall('capabilities web-app-testing')
    const alignment = await engagementCall('alignment')
    const guard = await engagementCall('guard nmap -sS 10.0.0.5')
    const report = await reportCall('latest')
    return { init, status, capabilities, alignment, guard, report }
  })

  const init = getTextValue(output.init)
  const status = getTextValue(output.status)
  const capabilities = getTextValue(output.capabilities)
  const alignment = getTextValue(output.alignment)
  const guard = getTextValue(output.guard)
  const report = getTextValue(output.report)

  assert.match(init, /Initialized Net-Runner engagement\./)
  assert.match(status, /name: net-runner-workspace/)
  assert.match(capabilities, /workflow: web-app-testing/)
  assert.match(alignment, /status: PASS/)
  assert.match(guard, /Guardrail decision:/)
  assert.match(report, /Generated Net-Runner report at/)

  const engagementManifestPath = join(workspace, '.netrunner', 'engagement.json')
  const reportPath = join(workspace, '.netrunner', 'reports', 'latest.md')
  await access(engagementManifestPath)
  await access(reportPath)

  const reportContents = await readFile(reportPath, 'utf8')
  assert.match(reportContents, /Net-Runner Report/)

  console.log('Red-team command smoke passed.')
  console.log(`Workspace: ${workspace}`)
} finally {
  await rm(workspace, { recursive: true, force: true })
}

