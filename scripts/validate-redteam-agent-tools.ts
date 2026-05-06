import { getNetRunnerCapabilities } from '../src/security/capabilities.ts'
import {
  NET_RUNNER_AGENT_TYPES,
  type NetRunnerAgentType,
} from '../src/security/agentTypes.js'
import {
  getSecurityBuiltInAgentTooling,
  validateSecurityAgentToolCoverage,
} from '../src/security/agentToolCoverage.ts'
import { ENGAGEMENT_LEAD_AGENT } from '../src/tools/AgentTool/built-in/engagementLeadAgent.ts'
import { RECON_SPECIALIST_AGENT } from '../src/tools/AgentTool/built-in/reconSpecialistAgent.ts'
import { APP_TESTING_SPECIALIST_AGENT } from '../src/tools/AgentTool/built-in/appTestingSpecialistAgent.ts'
import { INFRA_SPECIALIST_AGENT } from '../src/tools/AgentTool/built-in/infraSpecialistAgent.ts'
import { CODE_FORENSICS_SPECIALIST_AGENT } from '../src/tools/AgentTool/built-in/codeForensicsSpecialistAgent.ts'
import { EVIDENCE_REPORTING_SPECIALIST_AGENT } from '../src/tools/AgentTool/built-in/evidenceReportingSpecialistAgent.ts'
import { getBuiltInAgents } from '../src/tools/AgentTool/builtInAgents.ts'
import { AGENT_TOOL_NAME } from '../src/tools/AgentTool/constants.ts'
import { SEND_MESSAGE_TOOL_NAME } from '../src/tools/SendMessageTool/constants.ts'
import { BASH_TOOL_NAME } from '../src/tools/BashTool/toolName.ts'
import { FILE_EDIT_TOOL_NAME } from '../src/tools/FileEditTool/constants.ts'
import { FILE_READ_TOOL_NAME } from '../src/tools/FileReadTool/prompt.ts'
import { FILE_WRITE_TOOL_NAME } from '../src/tools/FileWriteTool/prompt.ts'
import { GLOB_TOOL_NAME } from '../src/tools/GlobTool/prompt.ts'
import { GREP_TOOL_NAME } from '../src/tools/GrepTool/prompt.ts'
import { LIST_MCP_RESOURCES_TOOL_NAME } from '../src/tools/ListMcpResourcesTool/prompt.ts'
import { READ_MCP_RESOURCE_TOOL_NAME } from '../src/tools/ReadMcpResourceTool/prompt.ts'
import { SKILL_TOOL_NAME } from '../src/tools/SkillTool/constants.ts'
import { TODO_WRITE_TOOL_NAME } from '../src/tools/TodoWriteTool/constants.ts'
import { WEB_FETCH_TOOL_NAME } from '../src/tools/WebFetchTool/prompt.ts'
import { WEB_SEARCH_TOOL_NAME } from '../src/tools/WebSearchTool/prompt.ts'

const report = validateSecurityAgentToolCoverage()
const registryAgentTooling = new Map(
  getSecurityBuiltInAgentTooling().map(agent => [
    agent.agentType,
    [...agent.tools].sort(),
  ]),
)
const builtInAgentTooling: Array<{
  agentType: NetRunnerAgentType
  tools: string[]
}> = [
  ENGAGEMENT_LEAD_AGENT,
  RECON_SPECIALIST_AGENT,
  APP_TESTING_SPECIALIST_AGENT,
  INFRA_SPECIALIST_AGENT,
  CODE_FORENSICS_SPECIALIST_AGENT,
  EVIDENCE_REPORTING_SPECIALIST_AGENT,
].map(agent => ({
  agentType: agent.agentType as NetRunnerAgentType,
  tools: [...(agent.tools ?? [])].sort(),
}))

const registryDriftErrors: string[] = []
for (const builtInAgent of builtInAgentTooling) {
  const registryTools = registryAgentTooling.get(builtInAgent.agentType)
  if (!registryTools) {
    registryDriftErrors.push(
      `Security registry is missing agent ${builtInAgent.agentType}.`,
    )
    continue
  }
  if (JSON.stringify(registryTools) !== JSON.stringify(builtInAgent.tools)) {
    registryDriftErrors.push(
      `Security registry tool drift for ${builtInAgent.agentType}.`,
    )
  }
}

const securityMemoryErrors: string[] = []
const securityCommunicationErrors: string[] = []
const securityToolsetErrors: string[] = []
const builtInAgentsByType = new Map(
  getBuiltInAgents().map(agent => [agent.agentType, agent]),
)
const requiredSpecialistTools = [
  AGENT_TOOL_NAME,
  SEND_MESSAGE_TOOL_NAME,
  BASH_TOOL_NAME,
  FILE_READ_TOOL_NAME,
  FILE_EDIT_TOOL_NAME,
  FILE_WRITE_TOOL_NAME,
  GLOB_TOOL_NAME,
  GREP_TOOL_NAME,
  LIST_MCP_RESOURCES_TOOL_NAME,
  READ_MCP_RESOURCE_TOOL_NAME,
  SKILL_TOOL_NAME,
  TODO_WRITE_TOOL_NAME,
  WEB_FETCH_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
]

for (const agentType of NET_RUNNER_AGENT_TYPES satisfies readonly NetRunnerAgentType[]) {
  const builtInAgent = builtInAgentsByType.get(agentType)
  if (!builtInAgent) {
    securityMemoryErrors.push(`${agentType} is missing from built-in agents.`)
    continue
  }
  if (builtInAgent.memory !== 'project') {
    securityMemoryErrors.push(
      `${agentType} must use project-scoped persistent memory.`,
    )
  }
}

for (const builtInAgent of builtInAgentTooling) {
  const hasSendMessage = builtInAgent.tools.includes(SEND_MESSAGE_TOOL_NAME)
  const hasAgent = builtInAgent.tools.includes(AGENT_TOOL_NAME)
  if (!hasAgent) {
    securityCommunicationErrors.push(
      `${builtInAgent.agentType} must include ${AGENT_TOOL_NAME} for specialist-to-specialist delegation.`,
    )
  }
  if (!hasSendMessage) {
    securityCommunicationErrors.push(
      `${builtInAgent.agentType} must include ${SEND_MESSAGE_TOOL_NAME} for teammate handoffs and async follow-up.`,
    )
  }
  if (hasAgent && !hasSendMessage) {
    securityCommunicationErrors.push(
      `${builtInAgent.agentType} includes ${AGENT_TOOL_NAME} but is missing ${SEND_MESSAGE_TOOL_NAME}.`,
    )
  }
  for (const requiredTool of requiredSpecialistTools) {
    if (!builtInAgent.tools.includes(requiredTool)) {
      securityToolsetErrors.push(
        `${builtInAgent.agentType} is missing required specialist tool: ${requiredTool}.`,
      )
    }
  }
}

console.log('Net-Runner Agent Tooling Validation')
console.log(
  `status: ${report.ok && registryDriftErrors.length === 0 && securityMemoryErrors.length === 0 && securityCommunicationErrors.length === 0 && securityToolsetErrors.length === 0 ? 'PASS' : 'FAIL'}`,
)
console.log('agent capability mappings:')
for (const agentType of NET_RUNNER_AGENT_TYPES) {
  const count = getNetRunnerCapabilities().filter(capability =>
    capability.recommendedAgents.includes(agentType),
  ).length
  console.log(`- ${agentType}: ${count}`)
}

const warnings = report.issues.filter(issue => issue.level === 'warning')
if (warnings.length > 0) {
  console.log('\nwarnings:')
  for (const warning of warnings) {
    console.log(`- [${warning.code}] ${warning.message}`)
  }
}

const errors = report.issues.filter(issue => issue.level === 'error')
if (errors.length > 0) {
  console.log('\nerrors:')
  for (const error of errors) {
    console.log(`- [${error.code}] ${error.message}`)
  }
}

if (registryDriftErrors.length > 0) {
  console.log('\nerrors:')
  for (const error of registryDriftErrors) {
    console.log(`- [security-registry-drift] ${error}`)
  }
}

if (securityMemoryErrors.length > 0) {
  console.log('\nerrors:')
  for (const error of securityMemoryErrors) {
    console.log(`- [security-memory] ${error}`)
  }
}

if (securityCommunicationErrors.length > 0) {
  console.log('\nerrors:')
  for (const error of securityCommunicationErrors) {
    console.log(`- [security-communication] ${error}`)
  }
}

if (securityToolsetErrors.length > 0) {
  console.log('\nerrors:')
  for (const error of securityToolsetErrors) {
    console.log(`- [security-toolset] ${error}`)
  }
}

if (
  errors.length > 0 ||
  registryDriftErrors.length > 0 ||
  securityMemoryErrors.length > 0 ||
  securityCommunicationErrors.length > 0 ||
  securityToolsetErrors.length > 0
) {
  process.exit(1)
}
