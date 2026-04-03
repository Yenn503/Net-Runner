import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { readEvidenceEntries } from './evidence.ts'
import { initializeNetRunnerProject } from './engagement.ts'
import {
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
    totalDurationMs: 4200,
    totalToolUseCount: 5,
    summary: 'Reproduced missing authorization check on GET /admin endpoint.',
    model: 'gpt-4o',
  })

  const entries = await readEvidenceEntries(cwd)
  const runtimeNotes = entries.filter(entry => entry.type === 'note')
  assert.equal(runtimeNotes.length, 1)
  assert.match(runtimeNotes[0]?.note ?? '', /subagent=web-testing-specialist/)
  assert.match(runtimeNotes[0]?.note ?? '', /status=completed/)
})
