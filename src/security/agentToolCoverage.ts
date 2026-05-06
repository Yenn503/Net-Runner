import {
  type NetRunnerCapabilityDefinition,
  getNetRunnerCapabilities,
} from './capabilities.js'
import {
  NET_RUNNER_AGENT_TYPES,
  type NetRunnerAgentType,
} from './agentTypes.js'
import { ENGAGEMENT_LEAD_AGENT } from '../tools/AgentTool/built-in/engagementLeadAgent.js'
import { RECON_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/reconSpecialistAgent.js'
import { APP_TESTING_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/appTestingSpecialistAgent.js'
import { INFRA_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/infraSpecialistAgent.js'
import { CODE_FORENSICS_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/codeForensicsSpecialistAgent.js'
import { EVIDENCE_REPORTING_SPECIALIST_AGENT } from '../tools/AgentTool/built-in/evidenceReportingSpecialistAgent.js'

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
  APP_TESTING_SPECIALIST_AGENT,
  INFRA_SPECIALIST_AGENT,
  CODE_FORENSICS_SPECIALIST_AGENT,
  EVIDENCE_REPORTING_SPECIALIST_AGENT,
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
