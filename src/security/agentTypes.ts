export const NET_RUNNER_AGENT_TYPES = [
  'engagement-lead',
  'recon-specialist',
  'web-testing-specialist',
  'api-testing-specialist',
  'network-testing-specialist',
  'exploit-specialist',
  'privilege-escalation-specialist',
  'lateral-movement-specialist',
  'retest-specialist',
  'evidence-specialist',
  'reporting-specialist',
] as const

export type NetRunnerAgentType = (typeof NET_RUNNER_AGENT_TYPES)[number]
