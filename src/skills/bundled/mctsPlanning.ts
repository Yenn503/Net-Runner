import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { buildMctsPlanningSkillContent } from './intelligenceSkillRuntime.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerMctsPlanningSkill(): void {
  const definition = getNetRunnerSkillDefinition('mcts-planning')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: mcts-planning')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'WebFetch', 'TodoWrite'],
    argumentHint: '[current attack state or target info]',
    async getPromptForCommand(args) {
      return [{ type: 'text', text: await buildMctsPlanningSkillContent(args) }]
    },
  })
}
