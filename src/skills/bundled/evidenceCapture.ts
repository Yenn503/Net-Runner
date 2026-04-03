import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerEvidenceCaptureSkill(): void {
  const definition = getNetRunnerSkillDefinition('evidence-capture')
  if (!definition) throw new Error('Missing Net-Runner skill definition: evidence-capture')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'TodoWrite'],
    argumentHint: '[finding or artifact context]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Evidence Capture

Organize findings and artifacts so they can be used in a retest or final report.

Context:
${args || 'No finding summary was provided. Review the current session state and summarize what evidence needs to be preserved.'}

Instructions:
1. Identify the concrete artifact set: commands, outputs, requests, responses, files, and screenshots.
2. Distinguish observed facts from operator hypotheses.
3. Capture reproduction steps and environmental assumptions.
4. Summarize impact and confidence without overstating claims.
5. Produce a concise evidence index and a report-ready finding summary.
`,
        },
      ]
    },
  })
}
