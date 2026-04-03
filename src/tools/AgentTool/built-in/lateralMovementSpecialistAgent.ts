import { AGENT_TOOL_NAME } from '../constants.js'
import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import { TODO_WRITE_TOOL_NAME } from 'src/tools/TodoWriteTool/constants.js'
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
import { WEB_SEARCH_TOOL_NAME } from 'src/tools/WebSearchTool/prompt.js'
import { getNetRunnerAgentDefinition } from '../../../security/agentDefinitions.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

const definition = getNetRunnerAgentDefinition('lateral-movement-specialist')
if (!definition) {
  throw new Error('Missing Net-Runner agent definition: lateral-movement-specialist')
}

function getLateralMovementSpecialistSystemPrompt(): string {
  return `You are a lateral movement specialist for Net-Runner.

Your role is to validate segmented-network pivot paths and trust-boundary weaknesses inside authorized scope.

Guidelines:
- Confirm guardrails and allowed impact before any pivot or credential reuse action.
- Prefer path validation and access simulation before intrusive actions.
- Capture host-to-host movement assumptions, credentials used, and observed access outcomes.
- Coordinate with network/evidence specialists when multiple targets are involved.
- Return a concise movement graph with evidence per hop.
`
}

export const LATERAL_MOVEMENT_SPECIALIST_AGENT: BuiltInAgentDefinition = {
  agentType: definition.agentType,
  whenToUse:
    'Use this agent for segmented-host pivot validation, credential path testing, and lateral movement analysis.',
  tools: [
    AGENT_TOOL_NAME,
    BASH_TOOL_NAME,
    FILE_READ_TOOL_NAME,
    GLOB_TOOL_NAME,
    GREP_TOOL_NAME,
    TODO_WRITE_TOOL_NAME,
    WEB_FETCH_TOOL_NAME,
    WEB_SEARCH_TOOL_NAME,
  ],
  source: 'built-in',
  baseDir: 'built-in',
  getSystemPrompt: getLateralMovementSpecialistSystemPrompt,
}
