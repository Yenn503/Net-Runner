import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCapabilitiesForAgent,
  getCapabilitiesForWorkflow,
  getCapabilityReadinessSnapshot,
  getNetRunnerCapabilities,
  summarizeWorkflowCapabilityReadiness,
} from './capabilities.ts'

test('capability registry covers full assessment pipeline stages', () => {
  const capabilityIds = getNetRunnerCapabilities().map(capability => capability.id)

  assert.ok(capabilityIds.includes('linux-command-execution'))
  assert.ok(capabilityIds.includes('filesystem-enumeration'))
  assert.ok(capabilityIds.includes('scripting-automation'))
  assert.ok(capabilityIds.includes('security-header-inspection'))
  assert.ok(capabilityIds.includes('google-search-intel'))
  assert.ok(capabilityIds.includes('retrieval-augmented-research'))
  assert.ok(capabilityIds.includes('exploitation-webshell-simulation'))
  assert.ok(capabilityIds.includes('privilege-escalation-validation'))
  assert.ok(capabilityIds.includes('lateral-movement-validation'))
  assert.ok(capabilityIds.includes('exfiltration-channel-review'))
  assert.ok(capabilityIds.includes('report-export-generation'))
  assert.ok(capabilityIds.includes('mcp-api-endpoint-integration'))
})

test('workflow and agent capability projections are populated', () => {
  assert.ok(getCapabilitiesForWorkflow('web-app-testing').length > 0)
  assert.ok(getCapabilitiesForWorkflow('lab-target-testing').length > 0)
  assert.ok(getCapabilitiesForWorkflow('ctf-mode').length > 0)
  assert.ok(getCapabilitiesForAgent('reporting-specialist').length > 0)
  assert.ok(getCapabilitiesForAgent('lateral-movement-specialist').length > 0)
})

test('readiness snapshot reports missing env vars and commands deterministically', async () => {
  const snapshot = await getCapabilityReadinessSnapshot({
    env: {},
    commandExists: async command => ['bash', 'curl', 'python3'].includes(command),
  })

  const summary = summarizeWorkflowCapabilityReadiness(
    'lab-target-testing',
    snapshot,
  )
  assert.ok(summary.total > 0)
  assert.ok(summary.missing > 0)
  assert.ok(summary.missingCapabilityIds.length > 0)
})
