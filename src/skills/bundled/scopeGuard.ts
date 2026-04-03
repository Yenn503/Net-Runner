import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerScopeGuardSkill(): void {
  const definition = getNetRunnerSkillDefinition('scope-guard')
  if (!definition) throw new Error('Missing Net-Runner skill definition: scope-guard')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'TodoWrite'],
    argumentHint: '[planned action]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Scope Guard

Review the next planned action against the current engagement boundary before execution.

Planned action:
${args || 'No planned action was supplied. Inspect the current plan and identify the next risky step.'}

Instructions:
1. State the target, engagement type, and allowed impact level as currently understood.
2. Determine whether the planned action is clearly in scope, unclear, or out of scope.
3. Flag destructive, disruptive, or persistence-related actions separately.
4. If the boundary is unclear, stop and ask for explicit operator confirmation.
5. If the action is acceptable, restate the guardrails that still apply.

Do not treat scope as implied. Prefer stopping over assuming authorization.`,
        },
      ]
    },
  })
}
