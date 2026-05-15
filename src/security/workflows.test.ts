import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SECURITY_WORKFLOWS,
  WORKFLOW_CATEGORIES,
  WORKFLOW_IDS,
  findWorkflow,
  getCapabilityPack,
  getWorkflowsByCategory,
  isWorkflowId,
} from './workflows.ts'

test('workflow registry is skill-first and includes web + lab testing flows', () => {
  assert.ok(findWorkflow('web-app-testing'))
  assert.ok(findWorkflow('mobile-app-testing'))
  assert.ok(findWorkflow('lab-target-testing'))
  assert.ok(findWorkflow('ctf-mode'))
  assert.equal(
    getCapabilityPack('mobile')?.primaryExecutionModel,
    'skills-and-tools',
  )
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

test('every workflow has a category that exists in WORKFLOW_CATEGORIES', () => {
  const categoryIds = new Set(WORKFLOW_CATEGORIES.map(c => c.id))
  for (const workflow of SECURITY_WORKFLOWS) {
    assert.ok(
      categoryIds.has(workflow.category),
      `${workflow.id} has unknown category ${workflow.category}`,
    )
  }
})

test('every category has at least one workflow', () => {
  for (const category of WORKFLOW_CATEGORIES) {
    assert.ok(
      getWorkflowsByCategory(category.id).length > 0,
      `category ${category.id} has no workflows`,
    )
  }
})

test('WORKFLOW_IDS covers every workflow exactly once', () => {
  assert.equal(WORKFLOW_IDS.length, SECURITY_WORKFLOWS.length)
  assert.equal(new Set(WORKFLOW_IDS).size, WORKFLOW_IDS.length)
  for (const workflow of SECURITY_WORKFLOWS) {
    assert.ok(WORKFLOW_IDS.includes(workflow.id))
  }
})

test('isWorkflowId validates ids correctly', () => {
  assert.equal(isWorkflowId('web-app-testing'), true)
  assert.equal(isWorkflowId('ctf-mode'), true)
  assert.equal(isWorkflowId('not-a-workflow'), false)
  assert.equal(isWorkflowId(''), false)
})
