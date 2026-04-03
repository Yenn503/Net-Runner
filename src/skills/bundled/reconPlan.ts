import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerReconPlanSkill(): void {
  const definition = getNetRunnerSkillDefinition('recon-plan')
  if (!definition) throw new Error('Missing Net-Runner skill definition: recon-plan')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash', 'WebFetch', 'WebSearch', 'TodoWrite'],
    argumentHint: '[target or objective]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Recon Plan

Build a phased reconnaissance and enumeration plan for the current Net-Runner engagement.

Target context:
${args || 'No target details were supplied. Infer only what is safe, then ask for missing scope-critical details.'}

Instructions:
1. Start with passive and low-impact information gathering.
2. Break the work into phases: target profiling, surface mapping, validation, and next-step decision points.
3. Call out which steps need explicit approval before execution.
4. Prefer built-in shell, file, and web tooling plus reusable skills.
5. Only recommend MCP-backed actions when they provide a clear integration advantage.
6. End with a concise ordered checklist the operator or specialist subagent can execute.
`,
        },
      ]
    },
  })
}
