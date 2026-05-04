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
  assert.ok(capabilityIds.includes('maigret-digital-footprint'))
  assert.ok(capabilityIds.includes('retrieval-augmented-research'))
  assert.ok(capabilityIds.includes('exploitation-webshell-simulation'))
  assert.ok(capabilityIds.includes('privilege-escalation-validation'))
  assert.ok(capabilityIds.includes('lateral-movement-validation'))
  assert.ok(capabilityIds.includes('exfiltration-channel-review'))
  assert.ok(capabilityIds.includes('report-export-generation'))
  assert.ok(capabilityIds.includes('mcp-api-endpoint-integration'))
  assert.ok(capabilityIds.includes('kali-katana'))
  assert.ok(capabilityIds.includes('kali-netexec'))
  assert.ok(capabilityIds.includes('kali-sliver-c2'))
  assert.ok(capabilityIds.includes('kali-mythic-c2'))
  assert.ok(capabilityIds.includes('kali-cloud-enum'))
  assert.ok(capabilityIds.includes('kali-ghunt'))
  assert.ok(capabilityIds.includes('kali-holehe'))
  assert.ok(capabilityIds.includes('kali-haklistgen'))
  assert.ok(capabilityIds.includes('kali-adb'))
  assert.ok(capabilityIds.includes('kali-apktool'))
  assert.ok(capabilityIds.includes('kali-jadx'))
  assert.ok(capabilityIds.includes('kali-frida'))
  assert.ok(capabilityIds.includes('kali-objection'))
  assert.ok(capabilityIds.includes('kali-mobsf'))
  assert.ok(capabilityIds.includes('kali-drozer'))
  assert.ok(capabilityIds.includes('kali-apkleaks'))
})

test('workflow and agent capability projections are populated', () => {
  assert.ok(getCapabilitiesForWorkflow('web-app-testing').length > 0)
  assert.ok(getCapabilitiesForWorkflow('mobile-app-testing').length > 0)
  assert.ok(getCapabilitiesForWorkflow('lab-target-testing').length > 0)
  assert.ok(getCapabilitiesForWorkflow('ctf-mode').length > 0)
  assert.ok(getCapabilitiesForAgent('reporting-specialist').length > 0)
  assert.ok(getCapabilitiesForAgent('lateral-movement-specialist').length > 0)
  assert.ok(
    getCapabilitiesForAgent('recon-specialist').some(
      capability => capability.id === 'maigret-digital-footprint',
    ),
  )
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
  assert.ok(summary.missingCapabilityIds.includes('maigret-digital-footprint'))
})
