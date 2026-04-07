import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { buildFeedbackLoopSkillContent } from './intelligenceSkillRuntime.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerFeedbackLoopSkill(): void {
  const definition = getNetRunnerSkillDefinition('feedback-loop')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: feedback-loop')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'WebFetch', 'TodoWrite'],
    argumentHint: '[failure context or HTTP response data]',
    async getPromptForCommand(args) {
      return [{ type: 'text', text: await buildFeedbackLoopSkillContent(args) }]
    },
  })
}
