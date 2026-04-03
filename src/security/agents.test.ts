import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getNetRunnerAgentDefinition,
  NET_RUNNER_AGENT_DEFINITIONS,
} from './agentDefinitions.ts'

test('Net-Runner publishes security specialist agent definitions', () => {
  assert.deepEqual(
    NET_RUNNER_AGENT_DEFINITIONS.map(agent => agent.agentType),
    [
      'engagement-lead',
      'recon-specialist',
      'web-testing-specialist',
      'api-testing-specialist',
      'network-testing-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
      'retest-specialist',
      'evidence-specialist',
      'reporting-specialist',
    ],
  )
  assert.equal(
    getNetRunnerAgentDefinition('engagement-lead')?.workflowId,
    'web-app-testing',
  )
  assert.equal(
    getNetRunnerAgentDefinition('api-testing-specialist')?.workflowId,
    'api-testing',
  )
  assert.equal(
    getNetRunnerAgentDefinition('privilege-escalation-specialist')?.workflowId,
    'lab-target-testing',
  )
})
