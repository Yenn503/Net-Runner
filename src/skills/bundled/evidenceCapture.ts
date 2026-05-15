import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerEvidenceCaptureSkill(): void {
  const definition = getNetRunnerSkillDefinition('evidence-capture')
  if (!definition) throw new Error('Missing Net-Runner skill definition: evidence-capture')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Bash'],
    argumentHint: '[finding context]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Evidence Capture — LEDGER ONLY

Move artifacts into \`.netrunner/evidence/\` via the ledger API. No standalone summary documents.

Context:
${args || '(none — review current engagement state for unsaved artifacts.)'}

Required actions:
1. \`nr_list_evidence\` — see what is already saved. Avoid duplicates.
2. For each unsaved artifact:
   - \`nr_save_finding\` if it is a candidate vulnerability (status defaults to Unvalidated).
   - \`nr_save_note\` if it is supporting context (not a finding on its own).
3. \`nr_verify_evidence\` to confirm SHA-256 chain integrity.

Output discipline:
- Never write artifacts to \`/tmp/\` or repo root. Ledger path only.
- Reply with: count saved, count duplicates, count verification failures. One line.`,
        },
      ]
    },
  })
}
