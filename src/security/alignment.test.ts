import assert from 'node:assert/strict'
import test from 'node:test'

import {
  renderNetRunnerSecurityAlignment,
  validateNetRunnerSecurityAlignment,
} from './alignment.ts'

test('security alignment validates agent and capability coverage', () => {
  const report = validateNetRunnerSecurityAlignment()

  assert.equal(report.ok, true)
  assert.equal(
    report.issues.filter(issue => issue.level === 'error').length,
    0,
  )
  assert.ok(report.agentCoverage.every(agent => agent.totalCapabilities > 0))
  assert.ok(report.workflowCoverage.every(workflow => workflow.relevantCapabilities.length > 0))
})

test('alignment renderer reports pass status for a healthy matrix', () => {
  const rendered = renderNetRunnerSecurityAlignment()
  assert.match(rendered, /status: PASS/)
  assert.match(rendered, /agent capability coverage:/)
})

