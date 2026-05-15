import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerReconPlanSkill(): void {
  const definition = getNetRunnerSkillDefinition('recon-plan')
  if (!definition) throw new Error('Missing Net-Runner skill definition: recon-plan')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Bash', 'WebFetch'],
    argumentHint: '[target or objective]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Recon Plan — RUN, NOT WRITE

Execute recon. Save evidence. Do not author plan documents.

Target / objective:
${args || '(none — derive from engagement scope. Stop and ask if scope unclear.)'}

Required actions:
1. \`nr_kg_query\` — pull anything already known about the target. Avoid re-probing.
2. Passive layer first: \`nr_exec\` for DNS, WHOIS, cert transparency. Save results via \`nr_save_note\` category=recon.
3. Active surface map second (only if maxImpact permits): subdomain enum, port scan, HTTP fingerprinting. Save artifacts.
4. \`nr_scope_check\` before any active probe that touches a new host or path.
5. Hand off via send_message to app-testing-specialist or infra-specialist with: surface count, top-3 candidates.

Output discipline:
- No "phased plan" markdown. The plan IS the tool sequence above.
- Reply with: passive facts saved, active probes run, candidates handed off. One line.`,
        },
      ]
    },
  })
}
