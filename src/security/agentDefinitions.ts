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
      'Discovery and enumeration specialist for targets, services, and attack surface mapping.',
  },
  {
    agentType: 'web-testing-specialist',
    workflowId: 'web-app-testing',
    description:
      'HTTP and web application testing specialist focused on evidence-backed validation.',
  },
  {
    agentType: 'api-testing-specialist',
    workflowId: 'api-testing',
    description:
      'API validation specialist for endpoint discovery, schema checks, and state-transition testing.',
  },
  {
    agentType: 'network-testing-specialist',
    workflowId: 'lab-target-testing',
    description:
      'Network and service assessment specialist for internal labs and scoped target infrastructure.',
  },
  {
    agentType: 'exploit-specialist',
    workflowId: 'ctf-mode',
    description:
      'Controlled exploitation specialist for validated attack paths and scoped proof-of-impact execution.',
  },
  {
    agentType: 'privilege-escalation-specialist',
    workflowId: 'lab-target-testing',
    description:
      'Privilege escalation specialist for post-access hardening gaps and privilege-boundary validation.',
  },
  {
    agentType: 'lateral-movement-specialist',
    workflowId: 'lab-target-testing',
    description:
      'Lateral movement specialist for segmented-network pivot simulation and credential path verification.',
  },
  {
    agentType: 'retest-specialist',
    workflowId: 'web-app-testing',
    description:
      'Validation and retest specialist focused on reproducing findings and reducing false positives.',
  },
  {
    agentType: 'evidence-specialist',
    workflowId: 'web-app-testing',
    description:
      'Evidence and reporting specialist that turns raw artifacts into report-ready findings.',
  },
  {
    agentType: 'reporting-specialist',
    workflowId: 'web-app-testing',
    description:
      'Reporting specialist for final finding narratives, severity framing, and export-ready assessment reports.',
  },
] as const

export function getNetRunnerAgentDefinition(
  agentType: NetRunnerAgentType,
): NetRunnerAgentDefinition | undefined {
  return NET_RUNNER_AGENT_DEFINITIONS.find(agent => agent.agentType === agentType)
}
