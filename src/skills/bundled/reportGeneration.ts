import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerReportGenerationSkill(): void {
  const definition = getNetRunnerSkillDefinition('report-generation')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: report-generation')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Bash'],
    argumentHint: '[format and audience]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Report Generation — EXPORT, DO NOT AUTHOR

Reports are rendered from the ledger by \`nr_export_report\`. Do not hand-write report markdown. Do not paraphrase findings.

Context:
${args || '(default — markdown + html for technical audience.)'}

Required actions:
1. \`nr_verify_evidence\` — confirm chain integrity before exporting. Abort if mismatch.
2. \`nr_coverage_status\` — pull final MITRE ATT&CK coverage figures (Validated only).
3. \`nr_export_report\` with the requested format. Supported: markdown, html, sarif, stix, misp.
4. If audience=executive, pass --audience=executive so the exporter selects the appropriate template.

Output discipline:
- No prose summaries of the report in chat. The report is the artifact.
- Reply with: export path(s), finding counts by status, coverage %. One line.`,
        },
      ]
    },
  })
}
