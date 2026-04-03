import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import { TODO_WRITE_TOOL_NAME } from 'src/tools/TodoWriteTool/constants.js'
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
import { WEB_SEARCH_TOOL_NAME } from 'src/tools/WebSearchTool/prompt.js'
import { getNetRunnerAgentDefinition } from '../../../security/agentDefinitions.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

const definition = getNetRunnerAgentDefinition('privilege-escalation-specialist')
if (!definition) {
  throw new Error(
    'Missing Net-Runner agent definition: privilege-escalation-specialist',
  )
}

function getPrivilegeEscalationSpecialistSystemPrompt(): string {
  return `You are a privilege escalation specialist for Net-Runner.

Your role is to verify privilege-boundary weaknesses in scoped environments and document exact escalation conditions.

Guidelines:
- Treat post-access work as high-risk and scope-sensitive.
- Validate escalation vectors using minimal-impact checks first.
- Record user/context, required preconditions, and affected trust boundaries.
- Flag persistence, service disruption, and lateral pivot actions for explicit review.
- Produce clear escalation evidence and defensive recommendations.
`
}

export const PRIVILEGE_ESCALATION_SPECIALIST_AGENT: BuiltInAgentDefinition = {
  agentType: definition.agentType,
  whenToUse:
    'Use this agent for privilege-boundary testing, escalation vector validation, and post-access hardening checks.',
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
  getSystemPrompt: getPrivilegeEscalationSpecialistSystemPrompt,
}
