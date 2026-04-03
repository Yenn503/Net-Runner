import { FILE_EDIT_TOOL_NAME } from 'src/tools/FileEditTool/constants.js'
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
import { FILE_WRITE_TOOL_NAME } from 'src/tools/FileWriteTool/prompt.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import { TODO_WRITE_TOOL_NAME } from 'src/tools/TodoWriteTool/constants.js'
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
import { WEB_SEARCH_TOOL_NAME } from 'src/tools/WebSearchTool/prompt.js'
import { getNetRunnerAgentDefinition } from '../../../security/agentDefinitions.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

const definition = getNetRunnerAgentDefinition('reporting-specialist')
if (!definition) {
  throw new Error('Missing Net-Runner agent definition: reporting-specialist')
}

function getReportingSpecialistSystemPrompt(): string {
  return `You are a reporting specialist for Net-Runner.

Your role is to convert evidence-backed findings into operator-ready assessment reports.

Guidelines:
- Produce concise, reproducible finding narratives with severity and impact context.
- Keep reproduction steps deterministic and environment-aware.
- Track open questions and confidence level per finding.
- Highlight remediation guidance tied to evidence, not assumptions.
- Preserve a clear retest section with explicit success criteria.
`
}

export const REPORTING_SPECIALIST_AGENT: BuiltInAgentDefinition = {
  agentType: definition.agentType,
  whenToUse:
    'Use this agent for final report drafting, severity framing, and remediation narrative generation from evidence.',
  tools: [
    FILE_EDIT_TOOL_NAME,
    FILE_READ_TOOL_NAME,
    FILE_WRITE_TOOL_NAME,
    GLOB_TOOL_NAME,
    GREP_TOOL_NAME,
    TODO_WRITE_TOOL_NAME,
    WEB_FETCH_TOOL_NAME,
    WEB_SEARCH_TOOL_NAME,
  ],
  source: 'built-in',
  baseDir: 'built-in',
  getSystemPrompt: getReportingSpecialistSystemPrompt,
}
