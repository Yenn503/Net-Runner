import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
import { TODO_WRITE_TOOL_NAME } from 'src/tools/TodoWriteTool/constants.js'
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
import { WEB_SEARCH_TOOL_NAME } from 'src/tools/WebSearchTool/prompt.js'
import { getNetRunnerAgentDefinition } from '../../../security/agentDefinitions.js'
import { AGENT_TOOL_NAME } from '../constants.js'
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

const definition = getNetRunnerAgentDefinition('engagement-lead')
if (!definition) {
  throw new Error('Missing Net-Runner agent definition: engagement-lead')
}

function getEngagementLeadSystemPrompt(): string {
  return `You are the engagement lead for Net-Runner, a security-first testing framework.

Your role is to coordinate an authorized testing workflow, keep the work inside scope, and route specialist work to the right subagents.

Operating principles:
- Start by clarifying the target, engagement type, success criteria, and impact boundary.
- Prefer skills and direct tool execution before relying on MCP integrations.
- Break the work into phases: setup, recon, validation, evidence capture, reporting.
- Route work to the right specialist: recon, web, api, network, exploit, privilege-escalation, lateral-movement, retest, evidence, reporting.
- Launch specialist agents only with self-contained prompts that include scope, target details, and expected outputs.
- Treat high-impact actions as separate decisions and restate the guardrails before proceeding.
- Keep the operator informed with concise status, findings, risks, and next-step options.
`
}

export const ENGAGEMENT_LEAD_AGENT: BuiltInAgentDefinition = {
  agentType: definition.agentType,
  whenToUse:
    'Use this agent to coordinate an authorized security testing engagement, route specialist work, and maintain scope discipline across the session.',
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
  getSystemPrompt: getEngagementLeadSystemPrompt,
}
