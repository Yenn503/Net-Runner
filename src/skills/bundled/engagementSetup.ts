import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerEngagementSetupSkill(): void {
  const definition = getNetRunnerSkillDefinition('engagement-setup')
  if (!definition) throw new Error('Missing Net-Runner skill definition: engagement-setup')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Task', 'TodoWrite'],
    argumentHint: '[engagement summary]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Engagement Setup

You are initializing a Net-Runner security testing engagement.

User context:
${args || 'No engagement summary was provided. Ask for the target, objective, authorization boundary, and any required constraints before continuing.'}

Instructions:
1. Identify the target, testing goal, engagement type, and allowed impact level.
2. Confirm scope boundaries, exclusions, and whether the target is a lab, research, or customer-authorized environment.
3. Determine which workflow best fits the task: web-app-testing, api-testing, lab-target-testing, or ctf-mode.
4. Record missing prerequisites, credentials, or infrastructure dependencies.
5. Produce a short operator-ready engagement brief before moving into recon or validation work.

Favor skill-driven planning and direct tool execution. Use MCP only when an external integration materially helps.`,
        },
      ]
    },
  })
}
