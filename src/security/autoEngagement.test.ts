import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { readEvidenceEntries } from './evidence.ts'
import { readEngagementManifest } from './engagement.ts'
import {
  maybeAutoBootstrapEngagement,
  maybeAutoSyncEngagementContext,
} from './autoEngagement.ts'

test('auto bootstrap initializes engagement for direct assessment prompt with URL target', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-auto-engagement-web-'))
  const result = await maybeAutoBootstrapEngagement(
    cwd,
    'Start assessment against https://example.com and run recon first.',
  )

  assert.equal(result.initialized, true)
  assert.equal(result.reason, 'initialized')
  assert.equal(result.target, 'https://example.com')

  const manifest = await readEngagementManifest(cwd)
  assert.equal(manifest?.workflowId, 'web-app-testing')
  assert.deepEqual(manifest?.targets, ['https://example.com'])
  assert.equal(manifest?.authorization.status, 'confirmed')
  assert.equal(manifest?.authorization.maxImpact, 'limited')

  const entries = await readEvidenceEntries(cwd)
  assert.equal(entries.filter(entry => entry.type === 'session_start').length, 1)
  assert.equal(entries.filter(entry => entry.type === 'note').length, 1)
})

test('auto bootstrap infers api workflow from endpoint-oriented prompt', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-auto-engagement-api-'))
  const result = await maybeAutoBootstrapEngagement(
    cwd,
    'Pentest the API target api.example.com and map endpoints.',
  )

  assert.equal(result.initialized, true)
  assert.equal(result.reason, 'initialized')

  const manifest = await readEngagementManifest(cwd)
  assert.equal(manifest?.workflowId, 'api-testing')
  assert.deepEqual(manifest?.targets, ['api.example.com'])
  assert.equal(manifest?.authorization.status, 'confirmed')
  assert.equal(manifest?.authorization.maxImpact, 'limited')
})

test('auto bootstrap requires assessment intent and explicit target', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-auto-engagement-none-'))
  const noIntent = await maybeAutoBootstrapEngagement(
    cwd,
    "Can you summarize today's work?",
  )
  assert.equal(noIntent.initialized, false)
  assert.equal(noIntent.reason, 'no-assessment-intent')

  const noTarget = await maybeAutoBootstrapEngagement(
    cwd,
    'Start a security assessment and run recon.',
  )
  assert.equal(noTarget.initialized, false)
  assert.equal(noTarget.reason, 'no-target')
})

test('auto bootstrap does not reinitialize when engagement already exists', async () => {
  const cwd = await mkdtemp(
    join(tmpdir(), 'net-runner-auto-engagement-existing-'),
  )
  const first = await maybeAutoBootstrapEngagement(
    cwd,
    'Run red team assessment against 10.10.10.10',
  )
  assert.equal(first.initialized, true)

  const second = await maybeAutoBootstrapEngagement(
    cwd,
    'Attack target https://second.example',
  )
  assert.equal(second.initialized, false)
  assert.equal(second.reason, 'already-initialized')

  const manifest = await readEngagementManifest(cwd)
  assert.deepEqual(manifest?.targets, ['10.10.10.10'])
})

test('auto sync upgrades engagement impact when the operator requests a higher-impact phase', async () => {
  const cwd = await mkdtemp(
    join(tmpdir(), 'net-runner-auto-engagement-confirm-'),
  )
  await maybeAutoBootstrapEngagement(
    cwd,
    'Run red team assessment against https://target.example',
  )

  const confirmation = await maybeAutoSyncEngagementContext(
    cwd,
    'Move into intrusive validation and try controlled exploitation.',
  )

  assert.equal(confirmation.updated, true)
  assert.equal(confirmation.reason, 'updated')
  assert.equal(confirmation.manifest?.authorization.status, 'confirmed')
  assert.equal(confirmation.manifest?.authorization.maxImpact, 'intrusive')

  const entries = await readEvidenceEntries(cwd)
  const confirmationNotes = entries.filter(
    entry =>
      entry.type === 'note' &&
      typeof entry.note === 'string' &&
      entry.note.includes('operator_intent_sync=true'),
  )
  assert.equal(confirmationNotes.length, 1)
})

test('auto sync does not update engagement when no explicit impact change is requested', async () => {
  const cwd = await mkdtemp(
    join(tmpdir(), 'net-runner-auto-engagement-no-confirm-'),
  )
  await maybeAutoBootstrapEngagement(
    cwd,
    'Start assessment against https://target.example',
  )

  const confirmation = await maybeAutoSyncEngagementContext(
    cwd,
    'Continue recon and map HTTP routes.',
  )

  assert.equal(confirmation.updated, false)
  assert.equal(confirmation.reason, 'no-impact-signal')
  assert.equal(confirmation.manifest?.authorization.status, 'confirmed')
  assert.equal(confirmation.manifest?.authorization.maxImpact, 'limited')
})
