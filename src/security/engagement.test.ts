import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  assessPlannedAction,
  formatEngagementContextForPrompt,
  initializeNetRunnerProject,
  readEngagementManifest,
} from './engagement.ts'
import { getEngagementManifestPath } from './paths.ts'

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
  assert.match(getEngagementManifestPath(cwd), /\.netrunner\/engagement\.json$/)
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

test('runtime prompt context includes authorization and impact defaults', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-context-'))
  const manifest = await initializeNetRunnerProject({
    cwd,
    workflowId: 'api-testing',
    targets: ['api.target.lab'],
    authorizationStatus: 'unconfirmed',
    maxImpact: 'read-only',
  })

  const contextBlock = formatEngagementContextForPrompt(manifest)
  assert.match(contextBlock, /\[Net-Runner engagement context\]/)
  assert.match(contextBlock, /authorization_status=unconfirmed/)
  assert.match(contextBlock, /max_impact=read-only/)
  assert.match(contextBlock, /default_behavior=Operate in read-only mode/)
})
