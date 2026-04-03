import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SECURITY_WORKFLOWS,
  findWorkflow,
  getCapabilityPack,
} from './workflows.ts'

test('workflow registry is skill-first and includes web + lab testing flows', () => {
  assert.ok(findWorkflow('web-app-testing'))
  assert.ok(findWorkflow('lab-target-testing'))
  assert.ok(findWorkflow('ctf-mode'))
  assert.equal(getCapabilityPack('web')?.primaryExecutionModel, 'skills-and-tools')
  assert.equal(
    getCapabilityPack('exploitation')?.primaryExecutionModel,
    'skills-and-tools',
  )
  assert.ok(
    SECURITY_WORKFLOWS.every(workflow => workflow.defaultSkills.length > 0),
  )
  assert.ok(
    SECURITY_WORKFLOWS.every(workflow => workflow.specialistAgents.length > 0),
  )
})
