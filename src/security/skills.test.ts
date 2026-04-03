import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getNetRunnerSkillDefinition,
  NET_RUNNER_SKILL_DEFINITIONS,
} from './skillDefinitions.ts'

test('Net-Runner registers bundled security workflow skills', () => {
  const skillNames = NET_RUNNER_SKILL_DEFINITIONS.map(skill => skill.name)

  assert.deepEqual(skillNames, [
    'engagement-setup',
    'scope-guard',
    'recon-plan',
    'evidence-capture',
  ])
  assert.equal(
    getNetRunnerSkillDefinition('scope-guard')?.primaryExecutionModel,
    'skills-and-tools',
  )
})
