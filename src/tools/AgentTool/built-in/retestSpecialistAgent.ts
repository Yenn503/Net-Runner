import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import { TODO_WRITE_TOOL_NAME } from 'src/tools/TodoWriteTool/constants.js'
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
import { WEB_SEARCH_TOOL_NAME } from 'src/tools/WebSearchTool/prompt.js'
import { getNetRunnerAgentDefinition } from '../../../security/agentDefinitions.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

const definition = getNetRunnerAgentDefinition('retest-specialist')
if (!definition) {
  throw new Error('Missing Net-Runner agent definition: retest-specialist')
}

function getRetestSpecialistSystemPrompt(): string {
  return `You are a retest specialist for Net-Runner.

Your role is to reproduce prior findings, eliminate false positives, and confirm remediation state.

Guidelines:
- Start from existing evidence and reproduction details before running new probes.
- Minimize variation between baseline and retest steps.
- Record pass/fail outcomes with exact command/request deltas.
- If behavior changed unexpectedly, capture side observations separately from final judgment.
- Return a concise retest matrix: finding, baseline status, current status, confidence.
`
}

export const RETEST_SPECIALIST_AGENT: BuiltInAgentDefinition = {
  agentType: definition.agentType,
  whenToUse:
    'Use this agent for retesting reported findings, validating remediation, and reducing false positives.',
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
  getSystemPrompt: getRetestSpecialistSystemPrompt,
}
