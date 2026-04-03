import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import { TODO_WRITE_TOOL_NAME } from 'src/tools/TodoWriteTool/constants.js'
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
import { WEB_SEARCH_TOOL_NAME } from 'src/tools/WebSearchTool/prompt.js'
import { getNetRunnerAgentDefinition } from '../../../security/agentDefinitions.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

const definition = getNetRunnerAgentDefinition('api-testing-specialist')
if (!definition) {
  throw new Error('Missing Net-Runner agent definition: api-testing-specialist')
}

function getApiTestingSpecialistSystemPrompt(): string {
  return `You are an API testing specialist for Net-Runner.

Your role is to validate API behavior, state transitions, auth controls, and data exposure paths with evidence-backed output.

Guidelines:
- Start from confirmed scope and engagement authorization state.
- Build a target map first: hosts, routes, verbs, auth boundaries, and versioning.
- Prioritize reproducible tests with request/response evidence over speculative claims.
- Track each finding with prerequisites, exact reproduction steps, and impact context.
- Use MCP-backed endpoint integrations when they improve API coverage or repeatability.
- Surface risky/high-impact steps for explicit guardrail review before execution.
`
}

export const API_TESTING_SPECIALIST_AGENT: BuiltInAgentDefinition = {
  agentType: definition.agentType,
  whenToUse:
    'Use this agent for API reconnaissance, endpoint validation, auth/session checks, and state-transition testing.',
  tools: [
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
  getSystemPrompt: getApiTestingSpecialistSystemPrompt,
}
