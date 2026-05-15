import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerAttackPathAnalysisSkill(): void {
  const definition = getNetRunnerSkillDefinition('attack-path-analysis')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: attack-path-analysis')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Bash', 'Grep'],
    argumentHint: '[objective or findings set]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Attack Path Analysis — KG QUERY, NOT NARRATIVE

Pull validated findings from the KG, compute chains, persist as graph entries.

Objective:
${args || '(none — derive from engagement objective field.)'}

Required actions:
1. \`nr_kg_query\` — fetch all Validated findings + assets + identity edges.
2. \`nr_exec\` — call MCTS planner: \`node scripts/redteam-pipeline.ts plan --target=<obj>\` (where supported). Otherwise compute candidates inline.
3. For each chain: \`nr_save_note\` category=attack-path with { path_id, hops[], mitre_techniques[], blockers[], validated_hops_count }.
4. Mark parallelizable hops (different targets, no shared prereq) with batch_id; sequential hops keep depends_on edges.
5. Hand off top-3 ranked paths to engagement-lead via send_message.

Output discipline:
- No path narrative in chat. No ASCII art chains.
- Reply with: paths computed, fully-validated chains count, top-3 path ids, batch hint counts. One line.`,
        },
      ]
    },
  })
}
