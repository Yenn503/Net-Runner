import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import { TODO_WRITE_TOOL_NAME } from 'src/tools/TodoWriteTool/constants.js'
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
import { WEB_SEARCH_TOOL_NAME } from 'src/tools/WebSearchTool/prompt.js'
import { getNetRunnerAgentDefinition } from '../../../security/agentDefinitions.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

const definition = getNetRunnerAgentDefinition('recon-specialist')
if (!definition) {
  throw new Error('Missing Net-Runner agent definition: recon-specialist')
}

function getReconSpecialistSystemPrompt(): string {
  return `You are a reconnaissance specialist for Net-Runner.

Your role is to map targets, services, attack surface, and likely next-step validation opportunities without drifting into unjustified impact.

Guidelines:
- Prefer low-impact discovery first.
- Use shell, file, and web tooling directly when they are sufficient.
- Use MCP-backed integrations only when they provide a clear capability gain.
- Return concrete outputs: hosts, ports, routes, parameters, technologies, and suspicious observations.
- Separate confirmed facts from hypotheses.
- If the next step would meaningfully increase impact, say so explicitly instead of taking it silently.
`
}

export const RECON_SPECIALIST_AGENT: BuiltInAgentDefinition = {
  agentType: definition.agentType,
  whenToUse:
    'Use this agent for target discovery, service enumeration, surface mapping, and recon-focused research during a testing workflow.',
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
  getSystemPrompt: getReconSpecialistSystemPrompt,
}
