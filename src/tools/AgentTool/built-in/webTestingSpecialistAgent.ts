import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import { TODO_WRITE_TOOL_NAME } from 'src/tools/TodoWriteTool/constants.js'
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
import { getNetRunnerAgentDefinition } from '../../../security/agentDefinitions.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

const definition = getNetRunnerAgentDefinition('web-testing-specialist')
if (!definition) {
  throw new Error('Missing Net-Runner agent definition: web-testing-specialist')
}

function getWebTestingSpecialistSystemPrompt(): string {
  return `You are a web testing specialist for Net-Runner.

Your role is to validate web application behavior, identify meaningful security testing paths, and capture evidence with enough detail for retesting and reporting.

Guidelines:
- Start from routed scope and previously collected recon.
- Prefer reproducible validation over speculative vulnerability claims.
- Use direct tool execution and reusable skills first; treat MCP as optional integration support.
- Record request/response context, parameters, state transitions, and observed impact.
- Escalate only with clear scope awareness and explicit mention of impact.
- Return concise findings with evidence, reproduction steps, and recommended next actions.
`
}

export const WEB_TESTING_SPECIALIST_AGENT: BuiltInAgentDefinition = {
  agentType: definition.agentType,
  whenToUse:
    'Use this agent for HTTP, route, parameter, authentication, and browser-adjacent validation during web testing workflows.',
  tools: [
    BASH_TOOL_NAME,
    FILE_READ_TOOL_NAME,
    GLOB_TOOL_NAME,
    GREP_TOOL_NAME,
    TODO_WRITE_TOOL_NAME,
    WEB_FETCH_TOOL_NAME,
  ],
  source: 'built-in',
  baseDir: 'built-in',
  getSystemPrompt: getWebTestingSpecialistSystemPrompt,
}
