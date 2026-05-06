export const NET_RUNNER_AGENT_TYPES = [
  'engagement-lead',
  'recon-specialist',
  'app-testing-specialist',
  'infra-specialist',
  'code-forensics-specialist',
  'evidence-reporting-specialist',
] as const

export type NetRunnerAgentType = (typeof NET_RUNNER_AGENT_TYPES)[number]
