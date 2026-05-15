import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerVulnAssessmentSkill(): void {
  const definition = getNetRunnerSkillDefinition('vuln-assessment')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: vuln-assessment')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Bash', 'Grep', 'WebFetch'],
    argumentHint: '[focus area]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Vulnerability Assessment — TOOL, SAVE, VALIDATE

Run probes. Save findings to ledger. Validate inline. No "assessment report" markdown.

Focus:
${args || '(none — start from highest-attack-surface fingerprint facts in the KG.)'}

Required actions:
1. \`nr_kg_query\` — list known fingerprint facts and existing findings. Skip duplicates.
2. \`nr_exec\` — run targeted probe per candidate weakness. Prefer minimum command per check.
3. For each positive signal: \`nr_save_finding\` (status=Unvalidated, attach cmd + output + CWE if known).
4. Where cheap to do so, immediately escalate via \`nr_validate_finding\` (command-replay) to flip Unvalidated→Validated.
5. \`nr_coverage_status\` — report MITRE ATT&CK coverage delta.

Output discipline:
- No findings in chat output. Findings live in the ledger only.
- Reply with: tests run, findings saved (Unvalidated count, Validated count), MITRE techniques touched count. One line.`,
        },
      ]
    },
  })
}
