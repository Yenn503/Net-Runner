import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AttackState,
  formatMCTSResultForAgent,
  generateActions,
  MCTSPlanner,
  simulateAction,
} from './mctsPlanner.ts'

// ---------------------------------------------------------------------------
// AttackState
// ---------------------------------------------------------------------------

test('AttackState initializes with correct defaults', () => {
  const state = new AttackState('192.168.1.1', 'ip')
  assert.equal(state.target, '192.168.1.1')
  assert.equal(state.targetType, 'ip')
  assert.equal(state.accessLevel, 0)
  assert.equal(state.openPorts.size, 0)
  assert.equal(state.isTerminal(), false)
})

test('AttackState.reward increases with discoveries', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  const baseReward = state.reward()

  state.addOpenPort(80, 'http')
  state.addOpenPort(443, 'https')
  assert.ok(state.reward() > baseReward)

  state.addVulnerability({ id: 'V1', severity: 'critical', type: 'sqli' })
  assert.ok(state.reward() > baseReward + 0.1)
})

test('AttackState.isTerminal returns true at access level 2', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  assert.equal(state.isTerminal(), false)
  state.accessLevel = 1
  assert.equal(state.isTerminal(), false)
  state.accessLevel = 2
  assert.equal(state.isTerminal(), true)
})

test('AttackState.clone produces independent copy', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  state.addOpenPort(80, 'http')
  state.addVulnerability({ id: 'V1', severity: 'high', type: 'xss' })

  const cloned = state.clone()
  cloned.addOpenPort(22, 'ssh')
  cloned.accessLevel = 2

  assert.equal(state.openPorts.size, 1)
  assert.equal(cloned.openPorts.size, 2)
  assert.equal(state.accessLevel, 0)
  assert.equal(cloned.accessLevel, 2)
})

test('AttackState.stateHash is deterministic and caches', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  state.addOpenPort(80, 'http')

  const hash1 = state.stateHash()
  const hash2 = state.stateHash()
  assert.equal(hash1, hash2)
  assert.equal(hash1.length, 12)
})

test('AttackState.stateHash changes when state changes', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  const hash1 = state.stateHash()

  state.addOpenPort(80, 'http')
  const hash2 = state.stateHash()

  assert.notEqual(hash1, hash2)
})

// ---------------------------------------------------------------------------
// generateActions
// ---------------------------------------------------------------------------

test('generateActions suggests port-scan for fresh state', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  const actions = generateActions(state)

  assert.ok(actions.length > 0)
  assert.ok(actions.some(a => a.type === 'port-scan'))
})

test('generateActions suggests web-scan when web ports are open', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  state.addOpenPort(80, 'http')
  state.addOpenPort(443, 'https')

  const actions = generateActions(state)
  assert.ok(actions.some(a => a.type === 'web-scan'))
  assert.ok(actions.some(a => a.type === 'vuln-scan'))
})

test('generateActions suggests exploit when vulns exist', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  state.addOpenPort(80, 'http')
  state.addVulnerability({ id: 'CVE-2024-1234', severity: 'critical', type: 'rce' })

  const actions = generateActions(state)
  assert.ok(actions.some(a => a.type === 'exploit'))
})

test('generateActions suggests privesc when access level is 1', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  state.accessLevel = 1

  const actions = generateActions(state)
  assert.ok(actions.some(a => a.type === 'privesc'))
  assert.ok(actions.some(a => a.type === 'credential-dump'))
})

test('generateActions suggests AD attack when AD ports are open', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  state.addOpenPort(88, 'kerberos')
  state.addOpenPort(389, 'ldap')

  const actions = generateActions(state)
  assert.ok(actions.some(a => a.type === 'ad-attack'))
})

test('generateActions does not suggest completed actions', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  state.markActionComplete('port-scan')

  const actions = generateActions(state)
  assert.ok(!actions.some(a => a.type === 'port-scan'))
})

test('generateActions maps actions to correct agents', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  state.addOpenPort(80, 'http')
  state.accessLevel = 1

  const actions = generateActions(state)
  const webScan = actions.find(a => a.type === 'web-scan')
  const privesc = actions.find(a => a.type === 'privesc')

  assert.ok(webScan)
  assert.equal(webScan.agent, 'web-testing-specialist')
  assert.ok(privesc)
  assert.equal(privesc.agent, 'privilege-escalation-specialist')
})

// ---------------------------------------------------------------------------
// simulateAction
// ---------------------------------------------------------------------------

test('simulateAction port-scan discovers ports', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  const action = generateActions(state).find(a => a.type === 'port-scan')!

  // Run multiple simulations (probabilistic)
  let anyPortsFound = false
  for (let i = 0; i < 20; i++) {
    const result = simulateAction(state, action)
    if (result.openPorts.size > 0) {
      anyPortsFound = true
      break
    }
  }
  assert.ok(anyPortsFound, 'Port scan should discover at least one port in 20 attempts')
})

test('simulateAction marks action as completed', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  const action = generateActions(state).find(a => a.type === 'port-scan')!

  const result = simulateAction(state, action)
  assert.ok(result.completedActions.size > 0)
})

test('simulateAction uses completion keys that suppress repeat web scan actions', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  state.addOpenPort(80, 'http')

  const action = generateActions(state).find(a => a.type === 'web-scan')!
  const result = simulateAction(state, action)
  const nextActions = generateActions(result)

  assert.ok(!nextActions.some(a => a.type === 'web-scan'))
})

test('simulateAction uses completion keys that suppress repeat nuclei scans', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  state.addOpenPort(80, 'http')

  const action = generateActions(state).find(a => a.type === 'vuln-scan')!
  const result = simulateAction(state, action)
  const nextActions = generateActions(result)

  assert.ok(!nextActions.some(a => a.type === 'vuln-scan'))
})

test('simulateAction does not modify original state', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  const action = generateActions(state).find(a => a.type === 'port-scan')!

  simulateAction(state, action)
  assert.equal(state.completedActions.size, 0)
  assert.equal(state.openPorts.size, 0)
})

// ---------------------------------------------------------------------------
// MCTSPlanner
// ---------------------------------------------------------------------------

test('MCTSPlanner.plan returns a valid result', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  const planner = new MCTSPlanner({ maxIterations: 50 })

  const result = planner.plan(state)

  assert.ok(result.iterations === 50)
  assert.ok(result.totalSimulations > 0)
  assert.ok(result.actionRankings.length > 0)
  assert.ok(result.recommendation.length > 0)
})

test('MCTSPlanner ranks actions by visits', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  const planner = new MCTSPlanner({ maxIterations: 100 })

  const result = planner.plan(state)

  for (let i = 1; i < result.actionRankings.length; i++) {
    assert.ok(
      result.actionRankings[i - 1]!.visits >= result.actionRankings[i]!.visits,
      'Rankings should be sorted by visits descending',
    )
  }
})

test('MCTSPlanner produces different rankings for different states', () => {
  const planner = new MCTSPlanner({ maxIterations: 100 })

  const state1 = new AttackState('10.0.0.1', 'ip')
  const result1 = planner.plan(state1)
  planner.reset()

  const state2 = new AttackState('10.0.0.1', 'ip')
  state2.addOpenPort(80, 'http')
  state2.addOpenPort(443, 'https')
  state2.addVulnerability({ id: 'CVE-2024-1234', severity: 'critical', type: 'rce' })
  state2.markActionComplete('port-scan')
  const result2 = planner.plan(state2)

  // State2 should have exploit as a top action
  const state2TopTypes = result2.actionRankings.slice(0, 3).map(r => r.action.type)
  assert.ok(
    !state2TopTypes.includes('port-scan'),
    'State with completed port-scan should not recommend port-scan',
  )
})

test('MCTSPlanner extracts a best path', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  const planner = new MCTSPlanner({ maxIterations: 100 })

  const result = planner.plan(state)
  assert.ok(result.bestPath.length > 0)
  assert.ok(result.bestPath[0]!.agent.length > 0)
})

test('MCTSPlanner.reset clears transposition table', () => {
  const planner = new MCTSPlanner({ maxIterations: 20 })
  const state = new AttackState('10.0.0.1', 'ip')

  planner.plan(state)
  planner.reset()

  // Should still work after reset
  const result = planner.plan(state)
  assert.ok(result.actionRankings.length > 0)
})

// ---------------------------------------------------------------------------
// formatMCTSResultForAgent
// ---------------------------------------------------------------------------

test('formatMCTSResultForAgent produces structured output', () => {
  const state = new AttackState('10.0.0.1', 'ip')
  const planner = new MCTSPlanner({ maxIterations: 50 })
  const result = planner.plan(state)

  const output = formatMCTSResultForAgent(result)
  assert.ok(output.includes('Attack Path Analysis'))
  assert.ok(output.includes('Ranked next actions'))
  assert.ok(output.includes('Recommended'))
})
