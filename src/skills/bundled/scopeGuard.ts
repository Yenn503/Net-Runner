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

Code-side guardrail (assessActionAgainstImpact) already runs on every Bash command. Use this skill only when planning a high-impact step ahead of execution.

Planned action:
${args || '(none — inspect current plan)'}

Steps:
1. Run \`nr_scope_check\` MCP tool with the planned action.
2. If decision = allow: proceed silently.
3. If decision = review: surface reason to operator with one-line recommendation.
4. If decision = block: stop and report reason.

Do not re-extract scope or re-ask authorization. Manifest is authoritative.`,
        },
      ]
    },
  })
}
