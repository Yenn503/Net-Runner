import {
  type NetRunnerCapabilityDefinition,
  getNetRunnerCapabilities,
} from './capabilities.js'
import {
  NET_RUNNER_AGENT_TYPES,
  type NetRunnerAgentType,
} from './agentTypes.js'
import { AD_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/adSpecialistAgent.js'
import { API_TESTING_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/apiTestingSpecialistAgent.js'
import { BINARY_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/binarySpecialistAgent.js'
import { CODE_AUDIT_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/codeAuditSpecialistAgent.js'
import { ENGAGEMENT_LEAD_AGENT } from '../tools/AgentTool/built-in/engagementLeadAgent.js'
import { EVIDENCE_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/evidenceSpecialistAgent.js'
import { EXPLOIT_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/exploitSpecialistAgent.js'
import { FORENSICS_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/forensicsSpecialistAgent.js'
import { LATERAL_MOVEMENT_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/lateralMovementSpecialistAgent.js'
import { MOBILE_TESTING_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/mobileTestingSpecialistAgent.js'
import { NETWORK_TESTING_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/networkTestingSpecialistAgent.js'
import { PRIVILEGE_ESCALATION_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/privilegeEscalationSpecialistAgent.js'
import { RECON_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/reconSpecialistAgent.js'
import { REPORTING_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/reportingSpecialistAgent.js'
import { RETEST_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/retestSpecialistAgent.js'
import { WEB_TESTING_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/webTestingSpecialistAgent.js'
import { WIFI_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/wifiSpecialistAgent.js'

export type SecurityAgentToolCoverageIssue = {
  level: 'error' | 'warning'
  code:
    | 'missing-security-agent-implementation'
    | 'capability-agent-tool-mismatch'
    | 'unknown-capability-tool'
  message: string
}

export type SecurityAgentToolCoverageReport = {
  ok: boolean
  issues: SecurityAgentToolCoverageIssue[]
}

type BuiltInAgentSnapshot = {
  agentType: NetRunnerAgentType
  tools: string[]
}

const LEGACY_TOOL_ALIASES: Record<string, string[]> = {
  Task: ['Agent'],
  MCPTool: ['ListMcpResourcesTool', 'ReadMcpResourceTool'],
  ReadMcpResource: ['ReadMcpResourceTool'],
  ListMcpResources: ['ListMcpResourcesTool'],
}

const SECURITY_BUILT_IN_AGENTS: BuiltInAgentSnapshot[] = [
  ENGAGEMENT_LEAD_AGENT,
  RECON_SPECIALIST_AGENT,
  WEB_TESTING_SPECIALIST_AGENT,
  API_TESTING_SPECIALIST_AGENT,
  NETWORK_TESTING_SPECIALIST_AGENT,
  EXPLOIT_SPECIALIST_AGENT,
  PRIVILEGE_ESCALATION_SPECIALIST_AGENT,
  LATERAL_MOVEMENT_SPECIALIST_AGENT,
  AD_SPECIALIST_AGENT,
  RETEST_SPECIALIST_AGENT,
  EVIDENCE_SPECIALIST_AGENT,
  REPORTING_SPECIALIST_AGENT,
  FORENSICS_SPECIALIST_AGENT,
  CODE_AUDIT_SPECIALIST_AGENT,
  WIFI_SPECIALIST_AGENT,
  MOBILE_TESTING_SPECIALIST_AGENT,
  BINARY_SPECIALIST_AGENT,
].map(agent => ({
  agentType: agent.agentType as NetRunnerAgentType,
  tools: [...(agent.tools ?? [])],
}))

export function getSecurityBuiltInAgentTooling(): BuiltInAgentSnapshot[] {
  return SECURITY_BUILT_IN_AGENTS.map(agent => ({
    agentType: agent.agentType,
    tools: [...agent.tools],
  }))
}

function resolveCapabilityToolCandidates(
  capability: NetRunnerCapabilityDefinition,
  declaredTool: string,
  allSecurityToolNames: Set<string>,
): {
  candidates: string[]
  unknown: boolean
} {
  if (allSecurityToolNames.has(declaredTool)) {
    return { candidates: [declaredTool], unknown: false }
  }

  const aliasCandidates = (LEGACY_TOOL_ALIASES[declaredTool] ?? []).filter(tool =>
    allSecurityToolNames.has(tool),
  )
  if (aliasCandidates.length > 0) {
    return { candidates: aliasCandidates, unknown: false }
  }

  return {
    candidates: [],
    unknown: true,
  }
}

export function validateSecurityAgentToolCoverage(): SecurityAgentToolCoverageReport {
  const issues: SecurityAgentToolCoverageIssue[] = []

  const agentsByType = new Map(
    SECURITY_BUILT_IN_AGENTS.map(agent => [agent.agentType, new Set(agent.tools)]),
  )
  const allSecurityToolNames = new Set(
    SECURITY_BUILT_IN_AGENTS.flatMap(agent => agent.tools),
  )

  for (const expectedAgentType of NET_RUNNER_AGENT_TYPES) {
    if (!agentsByType.has(expectedAgentType)) {
      issues.push({
        level: 'error',
        code: 'missing-security-agent-implementation',
        message: `Missing built-in security agent implementation: ${expectedAgentType}`,
      })
    }
  }

  for (const capability of getNetRunnerCapabilities()) {
    for (const agentType of capability.recommendedAgents) {
      const agentTools = agentsByType.get(agentType)
      if (!agentTools) continue

      for (const declaredTool of capability.netRunnerTools) {
        const resolved = resolveCapabilityToolCandidates(
          capability,
          declaredTool,
          allSecurityToolNames,
        )

        if (resolved.unknown) {
          issues.push({
            level: 'warning',
            code: 'unknown-capability-tool',
            message: `${capability.id} declares unknown tool "${declaredTool}" (static coverage check skipped).`,
          })
          continue
        }

        if (!resolved.candidates.some(tool => agentTools.has(tool))) {
          issues.push({
            level: 'error',
            code: 'capability-agent-tool-mismatch',
            message: `${agentType} is missing tool coverage for ${capability.id}: expected ${resolved.candidates.join(' or ')}.`,
          })
        }
      }
    }
  }

  return {
    ok: !issues.some(issue => issue.level === 'error'),
    issues,
  }
}
