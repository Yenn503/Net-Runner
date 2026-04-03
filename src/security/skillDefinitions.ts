export type NetRunnerSkillName =
  | 'engagement-setup'
  | 'scope-guard'
  | 'recon-plan'
  | 'evidence-capture'

export type NetRunnerSkillDefinition = {
  name: NetRunnerSkillName
  title: string
  description: string
  primaryExecutionModel: 'skills-and-tools'
}

export const NET_RUNNER_SKILL_DEFINITIONS: NetRunnerSkillDefinition[] = [
  {
    name: 'engagement-setup',
    title: 'Engagement Setup',
    description:
      'Collect scope, targets, goals, and testing constraints before work begins.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'scope-guard',
    title: 'Scope Guard',
    description:
      'Re-check authorization, impact, and engagement boundaries before risky actions.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'recon-plan',
    title: 'Recon Plan',
    description:
      'Build a phased reconnaissance and enumeration plan for the current target.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'evidence-capture',
    title: 'Evidence Capture',
    description:
      'Capture artifacts, findings, and operator notes in a report-friendly structure.',
    primaryExecutionModel: 'skills-and-tools',
  },
] as const

export function getNetRunnerSkillDefinition(
  name: NetRunnerSkillName,
): NetRunnerSkillDefinition | undefined {
  return NET_RUNNER_SKILL_DEFINITIONS.find(skill => skill.name === name)
}
