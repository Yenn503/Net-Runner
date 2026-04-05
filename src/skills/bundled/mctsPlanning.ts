import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
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
      return [
        {
          type: 'text',
          text: `# MCTS Attack Path Planning

Use Monte Carlo Tree Search to discover and rank optimal attack paths for the current engagement.

Context:
${args || 'No explicit state supplied. Build the attack state from current engagement evidence: discovered ports, services, vulnerabilities, credentials, and access level.'}

Instructions:
1. Construct the current attack state from engagement evidence:
   - Target IP/domain and type
   - Open ports and identified services
   - Discovered vulnerabilities (with severity)
   - Harvested credentials
   - Current access level (none/user/root)
   - Completed actions
2. Run MCTS planning with appropriate iteration count (higher for complex states).
3. Present ranked action recommendations with:
   - Action name and tool
   - Assigned specialist agent
   - Expected reward and confidence percentage
   - Risk score
4. Show the optimal attack path from current state toward objective.
5. Identify whether terminal state (root/admin access) is reachable in simulated paths.

Output:
- Current state summary
- Top 5 ranked next actions with agent assignments
- Optimal path sequence
- Terminal state reachability assessment
- Recommendation for engagement-lead routing`,
        },
      ]
    },
  })
}
