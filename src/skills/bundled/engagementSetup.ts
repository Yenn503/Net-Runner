import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerEngagementSetupSkill(): void {
  const definition = getNetRunnerSkillDefinition('engagement-setup')
  if (!definition) throw new Error('Missing Net-Runner skill definition: engagement-setup')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read'],
    argumentHint: '[target and goal]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Engagement Setup — ACTION ONLY

Initialize a Net-Runner engagement. Tool calls, not prose.

Input:
${args || '(none — ask the operator for: target, workflow, authorization source, max impact)'}

Required actions (in order):
1. Call \`nr_engagement_init\` with { workflowId, targets[], authorizedBy, maxImpact }.
2. Call \`nr_scope_check\` to confirm targets are inside scope.
3. Call \`nr_engagement_status\` to verify state.

Output discipline:
- No markdown summaries. No "engagement brief" documents. No \`/tmp/*.md\` writes.
- All artifacts live under \`.netrunner/\`. Save notes via \`nr_save_note\`, findings via \`nr_save_finding\`.
- Reply to the operator with ≤3 lines: workflow, scope confirmation, next specialist to invoke.

If any required input is missing, ask one direct question and stop. Do not stub values.`,
        },
      ]
    },
  })
}
