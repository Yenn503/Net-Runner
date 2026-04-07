import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { buildStatisticalVerificationSkillContent } from './intelligenceSkillRuntime.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerStatisticalVerificationSkill(): void {
  const definition = getNetRunnerSkillDefinition('statistical-verification')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: statistical-verification')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'WebFetch', 'TodoWrite'],
    argumentHint: '[baseline and payload response data]',
    async getPromptForCommand(args) {
      return [{ type: 'text', text: await buildStatisticalVerificationSkillContent(args) }]
    },
  })
}
