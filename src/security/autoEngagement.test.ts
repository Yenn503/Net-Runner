import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { readEvidenceEntries } from './evidence.ts'
import { readEngagementManifest } from './engagement.ts'
import {
  maybeAutoBootstrapEngagement,
  maybeAutoConfirmEngagementAuthorization,
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
  assert.equal(manifest?.authorization.status, 'unconfirmed')
  assert.equal(manifest?.authorization.maxImpact, 'read-only')

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
  assert.equal(manifest?.authorization.status, 'unconfirmed')
  assert.equal(manifest?.authorization.maxImpact, 'read-only')
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

test('auto confirmation upgrades unconfirmed engagement when operator confirms authorization', async () => {
  const cwd = await mkdtemp(
    join(tmpdir(), 'net-runner-auto-engagement-confirm-'),
  )
  await maybeAutoBootstrapEngagement(
    cwd,
    'Run red team assessment against https://target.example',
  )

  const confirmation = await maybeAutoConfirmEngagementAuthorization(
    cwd,
    'I confirm authorization for this engagement. Keep impact limited.',
  )

  assert.equal(confirmation.updated, true)
  assert.equal(confirmation.reason, 'updated')
  assert.equal(confirmation.manifest?.authorization.status, 'confirmed')
  assert.equal(confirmation.manifest?.authorization.maxImpact, 'limited')

  const entries = await readEvidenceEntries(cwd)
  const confirmationNotes = entries.filter(
    entry =>
      entry.type === 'note' &&
      typeof entry.note === 'string' &&
      entry.note.includes('authorization_confirmed=true'),
  )
  assert.equal(confirmationNotes.length, 1)
})

test('auto confirmation does not update engagement when no explicit confirmation signal is present', async () => {
  const cwd = await mkdtemp(
    join(tmpdir(), 'net-runner-auto-engagement-no-confirm-'),
  )
  await maybeAutoBootstrapEngagement(
    cwd,
    'Start assessment against https://target.example',
  )

  const confirmation = await maybeAutoConfirmEngagementAuthorization(
    cwd,
    'Continue recon and map HTTP routes.',
  )

  assert.equal(confirmation.updated, false)
  assert.equal(confirmation.reason, 'no-confirmation-signal')
  assert.equal(confirmation.manifest?.authorization.status, 'unconfirmed')
})
