import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  appendSecurityExecutionStep,
  createDefaultSecurityRunState,
  queuePendingSecurityReview,
  readSecurityRunState,
  resolvePendingSecurityReview,
  writeSecurityRunState,
} from './runState.ts'

test('run state stores execution steps', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-run-state-steps-'))
  await writeSecurityRunState(cwd, createDefaultSecurityRunState({ workflowId: 'api-testing' }))

  await appendSecurityExecutionStep(cwd, {
    agentType: 'recon-specialist',
    status: 'completed',
    description: 'Run recon baseline',
    prompt: 'Collect baseline recon signals.',
    totalToolUseCount: 3,
    totalDurationMs: 1200,
    summary: 'Discovered target host and open ports.',
  })

  const state = await readSecurityRunState(cwd)
  assert.equal(state?.executionSteps.length, 1)
  assert.equal(state?.executionSteps[0]?.agentType, 'recon-specialist')
})

test('run state queues and resolves pending reviews', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-run-state-reviews-'))
  await writeSecurityRunState(
    cwd,
    createDefaultSecurityRunState({ workflowId: 'web-app-testing' }),
  )

  const pending = await queuePendingSecurityReview(cwd, {
    plannedAction: 'rm -rf /tmp/test',
    reason: 'High impact action requires explicit operator review.',
    matchedPatterns: ['destructive-delete'],
  })

  const resolved = await resolvePendingSecurityReview(
    cwd,
    pending.id,
    'approved',
    'qa-operator',
  )

  assert.equal(resolved?.status, 'approved')
  assert.equal(resolved?.decidedBy, 'qa-operator')
})
