import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { buildOobVerificationSkillContent } from './intelligenceSkillRuntime.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerOobVerificationSkill(): void {
  const definition = getNetRunnerSkillDefinition('oob-verification')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: oob-verification')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'WebFetch', 'TodoWrite'],
    argumentHint: '[blind vulnerability type and target parameter]',
    async getPromptForCommand(args) {
      return [{ type: 'text', text: await buildOobVerificationSkillContent(args) }]
    },
  })
}
