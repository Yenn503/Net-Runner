import type { SecurityWorkflow } from './workflows.ts'
import type { NetRunnerAgentType } from './agentTypes.js'

export type NetRunnerAgentDefinition = {
  agentType: NetRunnerAgentType
  workflowId: SecurityWorkflow['id']
  description: string
}

export const NET_RUNNER_AGENT_DEFINITIONS: NetRunnerAgentDefinition[] = [
  {
    agentType: 'engagement-lead',
    workflowId: 'web-app-testing',
    description:
      'Primary security workflow coordinator for scoped testing engagements.',
  },
  {
    agentType: 'recon-specialist',
    workflowId: 'lab-target-testing',
    description:
      'Discovery and enumeration specialist for targets, services, attack surface mapping, and wireless assessments.',
  },
  {
    agentType: 'app-testing-specialist',
    workflowId: 'web-app-testing',
    description:
      'Web, API, and mobile application security specialist covering HTTP surfaces, auth, injection, and client-side testing.',
  },
  {
    agentType: 'infra-specialist',
    workflowId: 'lab-target-testing',
    description:
      'Infrastructure attacker covering network services, exploitation, privilege escalation, lateral movement, Active Directory, and binary analysis.',
  },
  {
    agentType: 'code-forensics-specialist',
    workflowId: 'code-audit-review',
    description:
      'Static code analysis and digital forensics specialist for source audits, secret scanning, dependency CVEs, IaC, and incident response triage.',
  },
  {
    agentType: 'evidence-reporting-specialist',
    workflowId: 'web-app-testing',
    description:
      'Evidence curation, finding retest, and polished reporting specialist that closes the assessment loop.',
  },
] as const

export function getNetRunnerAgentDefinition(
  agentType: NetRunnerAgentType,
): NetRunnerAgentDefinition | undefined {
  return NET_RUNNER_AGENT_DEFINITIONS.find(agent => agent.agentType === agentType)
}
