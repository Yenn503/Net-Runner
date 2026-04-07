import type { Message } from './message.js'

export type ShellProgress = {
  output: string
  fullOutput: string
  elapsedTimeSeconds?: number
  totalLines?: number
  totalBytes?: number
  timeoutMs?: number
  taskId?: string
}

export type BashProgress = ShellProgress & {
  type: 'bash_progress'
}

export type PowerShellProgress = ShellProgress & {
  type: 'powershell_progress'
}

export type AgentToolProgress = {
  type: 'agent_progress'
  message: Message
  prompt: string
  agentId: string
}

export type SkillToolProgress = {
  type: 'skill_progress'
  message: Message
  prompt: string
  agentId: string
}

export type MCPProgress = {
  type: 'mcp_progress'
  status: 'started' | 'progress' | 'completed' | 'failed'
  serverName: string
  toolName: string
  elapsedTimeMs?: number
  progress?: number
  total?: number
  progressMessage?: string
}

export type REPLToolProgress = {
  type: 'repl_progress'
  message?: Message
  prompt?: string
}

export type TaskOutputProgress = {
  type: 'task_output_progress'
  taskId: string
  status?: string
}

export type WebSearchProgress =
  | {
      type: 'query_update'
      query: string
    }
  | {
      type: 'search_results_received'
      query: string
      resultCount: number
    }

export type SdkWorkflowProgress = {
  type: string
  index: number
  phaseIndex?: number
  label?: string
  status?: string
  completed?: boolean
  [key: string]: unknown
}

export type ToolProgressData =
  | AgentToolProgress
  | BashProgress
  | MCPProgress
  | PowerShellProgress
  | REPLToolProgress
  | SkillToolProgress
  | TaskOutputProgress
  | WebSearchProgress
