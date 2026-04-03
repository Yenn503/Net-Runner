import assert from 'node:assert/strict'
import test from 'node:test'

import { initBundledSkills } from '../skills/bundled/index.js'
import { clearBundledSkills, getBundledSkills } from '../skills/bundledSkills.js'
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
    'target-fingerprinting',
    'evidence-capture',
    'vuln-assessment',
    'exploit-validation',
    'post-exploitation-plan',
    'report-generation',
    'attack-path-analysis',
    'apt-simulation',
  ])
  assert.equal(
    getNetRunnerSkillDefinition('scope-guard')?.primaryExecutionModel,
    'skills-and-tools',
  )
  assert.equal(
    getNetRunnerSkillDefinition('target-fingerprinting')?.primaryExecutionModel,
    'skills-and-tools',
  )
})

test('workflow-declared Net-Runner skills are actually registered as bundled skills', () => {
  clearBundledSkills()
  initBundledSkills()

  const bundledSkillNames = new Set(getBundledSkills().map(skill => skill.name))

  for (const skill of NET_RUNNER_SKILL_DEFINITIONS) {
    assert.equal(
      bundledSkillNames.has(skill.name),
      true,
      `Missing bundled skill registration for ${skill.name}`,
    )
  }

  clearBundledSkills()
})
