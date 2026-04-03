import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { readEvidenceEntries } from './evidence.ts'
import { initializeNetRunnerProject } from './engagement.ts'
import {
  evaluateEngagementGuardrail,
  evaluateSubagentGuardrail,
  recordSubagentExecution,
} from './runtimeIntegration.ts'

test('evaluateSubagentGuardrail returns null when no engagement is initialized', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-guardrail-none-'))
  const decision = await evaluateSubagentGuardrail(cwd, 'curl https://example.com')
  assert.equal(decision, null)
})

test('evaluateSubagentGuardrail records and returns block decisions', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-guardrail-block-'))
  await initializeNetRunnerProject({
    cwd,
    workflowId: 'lab-target-testing',
    maxImpact: 'read-only',
  })

  const decision = await evaluateSubagentGuardrail(cwd, 'rm -rf /tmp/lab-host')
  assert.equal(decision?.action, 'block')

  const entries = await readEvidenceEntries(cwd)
  assert.equal(entries.filter(entry => entry.type === 'guardrail').length, 1)
})

test('recordSubagentExecution appends runtime execution notes into evidence ledger', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-subagent-evidence-'))
  await initializeNetRunnerProject({ cwd, workflowId: 'web-app-testing' })

  await recordSubagentExecution({
    cwd,
    agentType: 'web-testing-specialist',
    status: 'completed',
    description: 'validate auth bypass path',
    prompt: 'Reproduce auth bypass with controlled requests.',
    outputFile: '.netrunner/tasks/task-001.md',
    totalDurationMs: 4200,
    totalToolUseCount: 5,
    summary: 'Reproduced missing authorization check on GET /admin endpoint.',
    model: 'gpt-4o',
  })

  const entries = await readEvidenceEntries(cwd)
  const runtimeNotes = entries.filter(entry => entry.type === 'note')
  const runtimeArtifacts = entries.filter(entry => entry.type === 'artifact')
  assert.equal(runtimeNotes.length, 1)
  assert.equal(runtimeArtifacts.length, 1)
  assert.match(runtimeNotes[0]?.note ?? '', /subagent=web-testing-specialist/)
  assert.match(runtimeNotes[0]?.note ?? '', /status=completed/)
  assert.match(
    runtimeArtifacts[0]?.label ?? '',
    /subagent-output:web-testing-specialist/,
  )
})

test('evaluateEngagementGuardrail flags out-of-scope direct actions', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-guardrail-scope-'))
  await initializeNetRunnerProject({
    cwd,
    workflowId: 'web-app-testing',
    authorizationStatus: 'confirmed',
    targets: ['target.example'],
  })

  const decision = await evaluateEngagementGuardrail(
    cwd,
    'curl https://api.outofscope.example',
  )
  assert.equal(decision?.action, 'review')
  assert.deepEqual(decision?.matchedPatterns, ['scope-mismatch'])

  const entries = await readEvidenceEntries(cwd)
  const guardrailEntries = entries.filter(entry => entry.type === 'guardrail')
  assert.equal(guardrailEntries.length, 1)
})
