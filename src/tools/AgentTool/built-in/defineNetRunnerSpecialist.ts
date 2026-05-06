import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
import { FILE_EDIT_TOOL_NAME } from 'src/tools/FileEditTool/constants.js'
import { FILE_WRITE_TOOL_NAME } from 'src/tools/FileWriteTool/prompt.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import { LIST_MCP_RESOURCES_TOOL_NAME } from 'src/tools/ListMcpResourcesTool/prompt.js'
import { READ_MCP_RESOURCE_TOOL_NAME } from 'src/tools/ReadMcpResourceTool/prompt.js'
import { SEND_MESSAGE_TOOL_NAME } from 'src/tools/SendMessageTool/constants.js'
import { SKILL_TOOL_NAME } from 'src/tools/SkillTool/constants.js'
import { TODO_WRITE_TOOL_NAME } from 'src/tools/TodoWriteTool/constants.js'
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
import { WEB_SEARCH_TOOL_NAME } from 'src/tools/WebSearchTool/prompt.js'
import { getNetRunnerAgentDefinition } from '../../../security/agentDefinitions.js'
import {
  formatNetRunnerAgentRolePolicy,
  getNetRunnerAgentRolePolicy,
} from '../../../security/agentRolePolicies.js'
import type { NetRunnerAgentType } from '../../../security/agentTypes.js'
import { AGENT_TOOL_NAME } from '../constants.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

/**
 * Default tool subset assigned to every Net-Runner specialist agent.
 * Specialists can override by passing `tools` to defineNetRunnerSpecialist.
 */
export const NET_RUNNER_SPECIALIST_TOOLSET: readonly string[] = [
  AGENT_TOOL_NAME,
  BASH_TOOL_NAME,
  FILE_EDIT_TOOL_NAME,
  FILE_READ_TOOL_NAME,
  FILE_WRITE_TOOL_NAME,
  GLOB_TOOL_NAME,
  GREP_TOOL_NAME,
  LIST_MCP_RESOURCES_TOOL_NAME,
  READ_MCP_RESOURCE_TOOL_NAME,
  SEND_MESSAGE_TOOL_NAME,
  SKILL_TOOL_NAME,
  TODO_WRITE_TOOL_NAME,
  WEB_FETCH_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
]

export interface NetRunnerSpecialistOptions {
  agentType: NetRunnerAgentType
  whenToUse: string
  systemPrompt: string
  tools?: readonly string[]
}

/**
 * Compressed-output discipline appended to every specialist prompt by default.
 * Reduces token spend on inter-agent handoffs, plans, and reasoning while
 * keeping technical fidelity. Findings, evidence narratives, and operator-
 * visible messages must stay full English.
 *
 * Excluded by SKIP_OUTPUT_STYLE_AGENTS: engagement-lead (operator-facing) and
 * reporting-specialist (customer-facing reports).
 */
const COMPRESSED_OUTPUT_STYLE = `Output style:
- Internal reasoning, tool plans, payload notes, inter-agent handoffs: compressed technical English. Drop articles (a/an/the), filler (just/really/basically/simply), pleasantries, and hedging. Fragments OK. Use arrows for causality (X -> Y). Code, payloads, command flags, file paths, errors, and tool output stay verbatim.
- Findings descriptions, evidence narratives, and operator-visible status: full English. Outputs that reach humans must be readable.
- Pattern: [thing] [action] [reason]. [next step].
`

const SKIP_OUTPUT_STYLE_AGENTS: ReadonlySet<NetRunnerAgentType> = new Set([
  'engagement-lead',
  'reporting-specialist',
])

/**
 * Build a Net-Runner specialist BuiltInAgentDefinition from the minimum unique
 * data: agent type, when-to-use blurb, and system prompt.
 *
 * Keeps specialist files tiny and uniform. The underlying agent type must be
 * registered in src/security/agentDefinitions.ts or this throws at module load
 * — matching prior per-specialist behaviour.
 */
export function defineNetRunnerSpecialist(
  options: NetRunnerSpecialistOptions,
): BuiltInAgentDefinition {
  const definition = getNetRunnerAgentDefinition(options.agentType)
  if (!definition) {
    throw new Error(
      `Missing Net-Runner agent definition: ${options.agentType}`,
    )
  }
  const tools = [...(options.tools ?? NET_RUNNER_SPECIALIST_TOOLSET)]
  const rolePolicy = getNetRunnerAgentRolePolicy(options.agentType)
  const stylePreamble = SKIP_OUTPUT_STYLE_AGENTS.has(options.agentType)
    ? ''
    : `\n\n${COMPRESSED_OUTPUT_STYLE}`
  const prompt = `${options.systemPrompt}

${formatNetRunnerAgentRolePolicy(rolePolicy)}${stylePreamble}`
  return {
    agentType: definition.agentType,
    whenToUse: options.whenToUse,
    tools,
    source: 'built-in',
    baseDir: 'built-in',
    getSystemPrompt: () => prompt,
  }
}
