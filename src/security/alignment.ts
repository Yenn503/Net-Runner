import {
  getCapabilitiesForAgent,
  getCapabilitiesForWorkflow,
  getNetRunnerCapabilities,
  type NetRunnerCapabilityId,
  type NetRunnerCapabilityDefinition,
} from './capabilities.js'
import {
  NET_RUNNER_AGENT_DEFINITIONS,
  type NetRunnerAgentDefinition,
} from './agentDefinitions.js'
import {
  NET_RUNNER_AGENT_TYPES,
  type NetRunnerAgentType,
} from './agentTypes.js'
import { SECURITY_WORKFLOWS, type SecurityWorkflow } from './workflows.js'

export type AlignmentIssue = {
  level: 'error' | 'warning'
  code: string
  message: string
}

export type AgentCapabilityCoverage = {
  agentType: NetRunnerAgentType
  definition: NetRunnerAgentDefinition | undefined
  capabilities: NetRunnerCapabilityDefinition[]
  totalCapabilities: number
}

export type WorkflowAgentCoverage = {
  workflowId: SecurityWorkflow['id']
  agentType: NetRunnerAgentType
  relevantCapabilities: NetRunnerCapabilityDefinition[]
}

export type NetRunnerSecurityAlignmentReport = {
  ok: boolean
  issues: AlignmentIssue[]
  agentCoverage: AgentCapabilityCoverage[]
  workflowCoverage: WorkflowAgentCoverage[]
  baselineCapabilitiesPresent: NetRunnerCapabilityId[]
}

const MIN_AGENT_CAPABILITY_COVERAGE: Record<NetRunnerAgentType, number> = {
  'engagement-lead': 8,
  'recon-specialist': 10,
  'web-testing-specialist': 8,
  'api-testing-specialist': 8,
  'network-testing-specialist': 10,
  'exploit-specialist': 5,
  'privilege-escalation-specialist': 5,
  'lateral-movement-specialist': 5,
  'retest-specialist': 8,
  'evidence-specialist': 8,
  'reporting-specialist': 5,
}

const NET_RUNNER_BASELINE_CAPABILITIES: NetRunnerCapabilityId[] = [
  'linux-command-execution',
  'code-execution',
  'filesystem-enumeration',
  'scripting-automation',
  'http-curl',
  'http-wget',
  'nmap-enumeration',
  'nuclei-template-scanning',
  'ffuf-fuzzing',
  'nikto-web-scanning',
  'sqlmap-injection-testing',
  'gobuster-enumeration',
  'amass-enumeration',
  'subfinder-enumeration',
  'dnsrecon-enumeration',
  'whatweb-fingerprinting',
  'netcat-probing',
  'netstat-enumeration',
  'hydra-credential-auditing',
  'john-password-cracking',
  'hashcat-password-cracking',
  'metasploit-framework',
  'smb-enumeration',
  'impacket-operations',
  'shodan-search',
  'shodan-host-info',
  'security-header-inspection',
  'js-surface-mapping',
  'web-search-intel',
  'google-search-intel',
  'network-traffic-capture',
  'exploitation-webshell-simulation',
  'privilege-escalation-validation',
  'lateral-movement-validation',
  'exfiltration-channel-review',
  'crypto-enumeration',
  'structured-reasoning-log',
  'retrieval-augmented-research',
  'command-and-control-session',
  'mcp-api-endpoint-integration',
  'report-export-generation',
]

export function validateNetRunnerSecurityAlignment(): NetRunnerSecurityAlignmentReport {
  const allCapabilities = getNetRunnerCapabilities()
  const issues: AlignmentIssue[] = []

  const capabilityIds = new Set(allCapabilities.map(capability => capability.id))
  const baselineCapabilitiesPresent = NET_RUNNER_BASELINE_CAPABILITIES.filter(id =>
    capabilityIds.has(id),
  )

  for (const requiredCapability of NET_RUNNER_BASELINE_CAPABILITIES) {
    if (!capabilityIds.has(requiredCapability)) {
      issues.push({
        level: 'error',
        code: 'missing-baseline-capability',
        message: `Missing baseline capability: ${requiredCapability}`,
      })
    }
  }

  const definedAgentTypes = new Set(
    NET_RUNNER_AGENT_DEFINITIONS.map(agent => agent.agentType),
  )
  for (const agentType of NET_RUNNER_AGENT_TYPES) {
    if (!definedAgentTypes.has(agentType)) {
      issues.push({
        level: 'error',
        code: 'missing-agent-definition',
        message: `Missing agent definition for: ${agentType}`,
      })
    }
  }

  const agentCoverage: AgentCapabilityCoverage[] = NET_RUNNER_AGENT_TYPES.map(
    agentType => {
      const capabilities = getCapabilitiesForAgent(agentType)
      const minimum = MIN_AGENT_CAPABILITY_COVERAGE[agentType]
      if (capabilities.length < minimum) {
        issues.push({
          level: 'error',
          code: 'insufficient-agent-capabilities',
          message: `${agentType} has ${capabilities.length} capabilities; expected at least ${minimum}.`,
        })
      }

      return {
        agentType,
        definition: NET_RUNNER_AGENT_DEFINITIONS.find(
          agent => agent.agentType === agentType,
        ),
        capabilities,
        totalCapabilities: capabilities.length,
      }
    },
  )

  const workflowCoverage: WorkflowAgentCoverage[] = []
  for (const workflow of SECURITY_WORKFLOWS) {
    const workflowCapabilities = getCapabilitiesForWorkflow(workflow.id)
    if (workflowCapabilities.length === 0) {
      issues.push({
        level: 'error',
        code: 'workflow-without-capabilities',
        message: `${workflow.id} has no mapped capabilities.`,
      })
    }

    for (const specialistAgent of workflow.specialistAgents) {
      const relevantCapabilities = workflowCapabilities.filter(capability =>
        capability.recommendedAgents.includes(specialistAgent),
      )
      workflowCoverage.push({
        workflowId: workflow.id,
        agentType: specialistAgent,
        relevantCapabilities,
      })
      if (relevantCapabilities.length === 0) {
        issues.push({
          level: 'error',
          code: 'workflow-agent-without-relevant-capabilities',
          message: `${workflow.id} includes ${specialistAgent}, but no workflow capabilities are mapped to that agent.`,
        })
      }
    }
  }

  for (const capability of allCapabilities) {
    if (capability.recommendedAgents.length === 0) {
      issues.push({
        level: 'error',
        code: 'capability-without-agent',
        message: `${capability.id} has no recommended specialist agents.`,
      })
    }
  }

  return {
    ok: !issues.some(issue => issue.level === 'error'),
    issues,
    agentCoverage,
    workflowCoverage,
    baselineCapabilitiesPresent,
  }
}

export function renderNetRunnerSecurityAlignment(
  report: NetRunnerSecurityAlignmentReport = validateNetRunnerSecurityAlignment(),
): string {
  const lines: string[] = [
    'Net-Runner Security Alignment',
    `status: ${report.ok ? 'PASS' : 'FAIL'}`,
    `baseline capabilities: ${report.baselineCapabilitiesPresent.length}/${NET_RUNNER_BASELINE_CAPABILITIES.length}`,
    '',
    'agent capability coverage:',
  ]

  for (const coverage of report.agentCoverage) {
    lines.push(`- ${coverage.agentType}: ${coverage.totalCapabilities}`)
  }

  if (report.issues.length > 0) {
    lines.push('', 'issues:')
    for (const issue of report.issues) {
      lines.push(`- [${issue.level.toUpperCase()}] ${issue.code}: ${issue.message}`)
    }
  } else {
    lines.push('', 'issues: none')
  }

  return lines.join('\n')
}
