import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getNetRunnerAgentDefinition,
  NET_RUNNER_AGENT_DEFINITIONS,
} from './agentDefinitions.ts'
import { NET_RUNNER_AGENT_TYPES } from './agentTypes.ts'
import { getNetRunnerAgentRolePolicy } from './agentRolePolicies.ts'

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
      'ad-specialist',
      'retest-specialist',
      'evidence-specialist',
      'reporting-specialist',
      'forensics-specialist',
      'code-audit-specialist',
      'wifi-specialist',
      'mobile-testing-specialist',
      'binary-specialist',
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

test('Net-Runner publishes role policies for every specialist agent', () => {
  for (const agentType of NET_RUNNER_AGENT_TYPES) {
    const policy = getNetRunnerAgentRolePolicy(agentType)
    assert.equal(policy.agentType, agentType)
    assert.ok(policy.mission.length > 0)
    assert.ok(policy.primarySkills.length > 0)
    assert.ok(policy.executionLoop.length > 0)
    assert.ok(policy.completionCriteria.length > 0)
    assert.ok(policy.handoffContract.length > 0)
    assert.ok(policy.evidenceRequirements.length > 0)
    assert.ok(policy.prohibitedActions.length > 0)
    assert.ok(policy.evalDimensions.includes('scope-compliance') || agentType === 'reporting-specialist')
  }
})
