import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
import { FILE_EDIT_TOOL_NAME } from 'src/tools/FileEditTool/constants.js'
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
import { FILE_WRITE_TOOL_NAME } from 'src/tools/FileWriteTool/prompt.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import { TODO_WRITE_TOOL_NAME } from 'src/tools/TodoWriteTool/constants.js'
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
import { getNetRunnerAgentDefinition } from '../../../security/agentDefinitions.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

const definition = getNetRunnerAgentDefinition('evidence-specialist')
if (!definition) {
  throw new Error('Missing Net-Runner agent definition: evidence-specialist')
}

function getEvidenceSpecialistSystemPrompt(): string {
  return `You are an evidence specialist for Net-Runner.

Your role is to curate assessment evidence into a structured, traceable ledger.

Guidelines:
- Keep a strict boundary between observed facts and analyst interpretation.
- Ensure every finding references concrete artifacts (commands, output, requests, responses, files).
- Preserve chronology so operators can reconstruct decision flow.
- Normalize evidence notes for report generation and retest compatibility.
- Never claim impact without linked evidence.
`
}

export const EVIDENCE_SPECIALIST_AGENT: BuiltInAgentDefinition = {
  agentType: definition.agentType,
  whenToUse:
    'Use this agent to structure artifacts, findings, and evidence metadata for downstream reporting and retest.',
  tools: [
    BASH_TOOL_NAME,
    FILE_EDIT_TOOL_NAME,
    FILE_READ_TOOL_NAME,
    FILE_WRITE_TOOL_NAME,
    GLOB_TOOL_NAME,
    GREP_TOOL_NAME,
    TODO_WRITE_TOOL_NAME,
    WEB_FETCH_TOOL_NAME,
  ],
  source: 'built-in',
  baseDir: 'built-in',
  getSystemPrompt: getEvidenceSpecialistSystemPrompt,
}
