import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { buildWafDetectionSkillContent } from './intelligenceSkillRuntime.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerWafDetectionSkill(): void {
  const definition = getNetRunnerSkillDefinition('waf-detection')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: waf-detection')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'WebFetch', 'TodoWrite'],
    argumentHint: '[target URL or HTTP response data]',
    async getPromptForCommand(args) {
      return [{ type: 'text', text: await buildWafDetectionSkillContent(args) }]
    },
  })
}
