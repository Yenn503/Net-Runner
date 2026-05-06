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
    allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'TodoWrite'],
    argumentHint: '[findings set or objective]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Attack Path Analysis

Map the current Net-Runner engagement into explicit attack chains.

Analysis scope:
${args || 'No explicit objective was supplied. Start from the strongest validated findings and current engagement objectives.'}

Instructions:
1. Build a step-by-step path from initial access or exposure to the operator objective.
2. For each step, record the prerequisite, validating evidence, impact level, and dependent follow-up steps.
3. Identify where a path branches, where it fails, and which missing evidence blocks the next move.
4. Separate validated chains from hypothetical chains.
5. Return a compact graph-ready representation that can be reused in reporting and retesting.

Output format:
- Validated attack paths
- Partial or blocked paths
- Critical dependencies and choke points
- Recommended next action per path
- Evidence references for each hop
- **Parallel execution batches**: group next actions where tasks operate on disjoint targets/services or different attack classes with no shared prerequisite. Label each batch (Batch 1, Batch 2, ...) and list which specialist agent handles each action. The engagement lead spawns all agents within a batch simultaneously, awaits all results, then proceeds to the next batch. Clearly mark actions that MUST be sequential (B depends on A's confirmed output).`,
        },
      ]
    },
  })
}
