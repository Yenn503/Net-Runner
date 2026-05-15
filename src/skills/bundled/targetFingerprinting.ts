import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerTargetFingerprintingSkill(): void {
  const definition = getNetRunnerSkillDefinition('target-fingerprinting')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: target-fingerprinting')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Bash', 'WebFetch'],
    argumentHint: '[target]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Target Fingerprinting — ACTION ONLY

Run probes. Save facts to ledger. No prose fingerprint documents.

Target:
${args || '(none — derive from engagement scope. If empty, stop and ask.)'}

Required actions:
1. \`nr_kg_query\` — check existing knowledge for this target before re-probing.
2. \`nr_exec\` — run the minimum probe set needed: HTTP headers, TLS, banner grab, version endpoints. Stop probing once stack identified.
3. \`nr_save_note\` — store each confirmed fact as a structured note with category=fingerprint.
4. Hand off to engagement-lead via send_message with: stack identified, suggested specialist (recon / app-testing / infra).

Output discipline:
- No \`/tmp/*.md\`. No markdown summaries to stdout.
- ≤5 lines back to caller: stack, confidence, next specialist.
- All evidence goes through \`nr_save_note\` / \`nr_save_finding\`. Ledger is single source of truth.`,
        },
      ]
    },
  })
}
