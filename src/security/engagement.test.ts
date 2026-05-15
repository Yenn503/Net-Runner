import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  assessPlannedAction,
  formatEngagementContextForPrompt,
  initializeNetRunnerProject,
  readEngagementManifest,
} from './engagement.ts'
import { getEngagementManifestPath, getRunStatePath } from './paths.ts'

test('initializing an engagement creates the Net-Runner project envelope', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-engagement-'))
  const manifest = await initializeNetRunnerProject({
    cwd,
    workflowId: 'api-testing',
    targets: ['https://api.target.lab'],
    authorizedBy: 'qa-team',
  })

  const loaded = await readEngagementManifest(cwd)

  assert.equal(manifest.workflowId, 'api-testing')
  assert.equal(loaded?.authorization.authorizedBy, 'qa-team')
  assert.deepEqual(loaded?.targets, ['https://api.target.lab'])
  assert.match(getEngagementManifestPath(cwd), /[\\/]\.netrunner[\\/]engagement\.json$/)
  const runState = JSON.parse(await readFile(getRunStatePath(cwd), 'utf8')) as {
    workflowId: string
  }
  assert.equal(runState.workflowId, 'api-testing')
})

test('engagement guardrail decisions respect the manifest impact boundary', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-guard-'))
  const manifest = await initializeNetRunnerProject({
    cwd,
    workflowId: 'web-app-testing',
    maxImpact: 'read-only',
  })

  const decision = assessPlannedAction(
    manifest,
    'create a new cron job for persistence',
  )

  assert.equal(decision.action, 'block')
  assert.equal(decision.tripwireTriggered, true)
})

test('default engagement naming avoids legacy workspace labels', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'netrunner-workspace-'))
  const manifest = await initializeNetRunnerProject({
    cwd,
    workflowId: 'web-app-testing',
  })

  assert.equal(manifest.name, 'net-runner-workspace')
})

test('re-initializing an active engagement throws an idempotence error', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-idempotent-'))
  await initializeNetRunnerProject({ cwd, workflowId: 'web-app-testing' })
  await assert.rejects(
    () => initializeNetRunnerProject({ cwd, workflowId: 'web-app-testing' }),
    /Engagement already active at [\\/]?\.netrunner[\\/]engagement\.json\. Pause or close it before re-init\./,
  )
})

test('runtime prompt context includes scope envelope and impact defaults', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-context-'))
  const manifest = await initializeNetRunnerProject({
    cwd,
    workflowId: 'api-testing',
    targets: ['api.target.lab'],
    authorizationStatus: 'confirmed',
    maxImpact: 'limited',
  })

  const contextBlock = formatEngagementContextForPrompt(manifest)
  assert.match(contextBlock, /\[Net-Runner engagement context\]/)
  assert.doesNotMatch(contextBlock, /authorization_status=confirmed/)
  assert.match(contextBlock, /scope_summary=/)
  assert.match(contextBlock, /max_impact=limited/)
  assert.match(contextBlock, /execution_model=skills-and-tools/)
  assert.match(
    contextBlock,
    /core_runtime_agents=general-purpose, Explore, Plan, verification/,
  )
  assert.match(
    contextBlock,
    /specialist_agents=engagement-lead, recon-specialist/,
  )
  assert.match(
    contextBlock,
    /routing_guidance=Prefer skills and direct local tools before MCP when the local path is sufficient\./,
  )
  assert.match(
    contextBlock,
    /default_behavior=Proceed inside scope with controlled validation; require guardrail review before high-impact or persistence actions\./,
  )
})
