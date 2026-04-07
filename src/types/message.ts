import type { APIError } from '@anthropic-ai/sdk'
import type {
  BetaContentBlock,
  BetaMessage,
  BetaRawMessageStreamEvent,
  BetaToolUseBlock,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type {
  ContentBlockParam,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/messages/messages.mjs'
import type { Progress } from '../Tool.js'
import type { Attachment } from '../utils/attachments.js'

export type SystemMessageLevel = 'info' | 'warning' | 'error'

export type PartialCompactDirection = 'from' | 'up_to'

export type MessageOrigin =
  | { kind: 'human' }
  | { kind: 'task-notification' }
  | { kind: 'coordinator' }
  | { kind: 'channel'; server: string }

export type StopHookInfo = {
  command: string
  promptText?: string
  durationMs?: number
}

export type CompactMetadata = {
  trigger: 'manual' | 'auto'
  preTokens: number
  preCompactDiscoveredTools?: string[]
  userContext?: string
  messagesSummarized?: number
  preservedSegment?: {
    headUuid: string
    anchorUuid: string
    tailUuid: string
  }
}

export type MicrocompactMetadata = {
  trigger: 'auto'
  preTokens: number
  tokensSaved: number
  compactedToolIds: string[]
  clearedAttachmentUUIDs: string[]
}

export type AssistantMessage = {
  type: 'assistant'
  uuid: string
  timestamp: string
  message: BetaMessage
  research?: unknown
  usage?: unknown
  requestId?: string
  apiError?: string
  error?: unknown
  errorDetails?: string
  isMeta?: true
  isApiErrorMessage?: boolean
  isVirtual?: true
  advisorModel?: string
}

export type UserMessage = {
  type: 'user'
  uuid: string
  timestamp: string
  message: {
    role: 'user'
    content: string | ContentBlockParam[]
  }
  isMeta?: true
  isVisibleInTranscriptOnly?: true
  isVirtual?: true
  isCompactSummary?: true
  summarizeMetadata?: {
    messagesSummarized: number
    userContext?: string
    direction?: PartialCompactDirection
  }
  toolUseResult?: unknown
  mcpMeta?: {
    _meta?: Record<string, unknown>
    structuredContent?: Record<string, unknown>
  }
  imagePasteIds?: number[]
  sourceToolUseID?: string
  sourceToolAssistantUUID?: string
  permissionMode?: string
  origin?: MessageOrigin
}

export type AttachmentMessage<TAttachment extends Attachment = Attachment> = {
  type: 'attachment'
  attachment: TAttachment
  uuid: string
  timestamp: string
}

export type ProgressMessage<P extends Progress = Progress> = {
  type: 'progress'
  toolUseID: string
  parentToolUseID: string
  data: P
  uuid: string
  timestamp: string
}

type SystemBaseMessage = {
  type: 'system'
  uuid: string
  timestamp: string
  isMeta?: boolean
  content?: string
  level?: SystemMessageLevel
}

export type SystemInformationalMessage = SystemBaseMessage & {
  subtype: 'informational'
  content: string
  level: SystemMessageLevel
  toolUseID?: string
  preventContinuation?: boolean
}

export type SystemPermissionRetryMessage = SystemBaseMessage & {
  subtype: 'permission_retry'
  content: string
  commands: string[]
  level: 'info'
}

export type SystemBridgeStatusMessage = SystemBaseMessage & {
  subtype: 'bridge_status'
  content: string
  url: string
  upgradeNudge?: string
}

export type SystemScheduledTaskFireMessage = SystemBaseMessage & {
  subtype: 'scheduled_task_fire'
  content: string
}

export type SystemThinkingMessage = SystemBaseMessage & {
  subtype: 'thinking'
  content: string
  level: 'info'
}

export type SystemStopHookSummaryMessage = SystemBaseMessage & {
  subtype: 'stop_hook_summary'
  hookCount: number
  hookInfos: StopHookInfo[]
  hookErrors: string[]
  preventedContinuation: boolean
  stopReason?: string
  hasOutput: boolean
  level: SystemMessageLevel
  toolUseID?: string
  hookLabel?: string
  totalDurationMs?: number
}

export type SystemTurnDurationMessage = SystemBaseMessage & {
  subtype: 'turn_duration'
  durationMs: number
  budgetTokens?: number
  budgetLimit?: number
  budgetNudges?: number
  messageCount?: number
}

export type SystemAwaySummaryMessage = SystemBaseMessage & {
  subtype: 'away_summary'
  content: string
}

export type SystemMemorySavedMessage = SystemBaseMessage & {
  subtype: 'memory_saved'
  writtenPaths: string[]
  teamCount?: number
}

export type SystemFileSnapshotMessage = SystemBaseMessage & {
  subtype: 'file_snapshot'
  content: string
  level: 'info'
  snapshotFiles: Array<{
    key: string
    path: string
    content: string
  }>
}

export type SystemAgentsKilledMessage = SystemBaseMessage & {
  subtype: 'agents_killed'
}

export type SystemApiMetricsMessage = SystemBaseMessage & {
  subtype: 'api_metrics'
  ttftMs: number
  otps: number
  isP50?: boolean
  hookDurationMs?: number
  turnDurationMs?: number
  toolDurationMs?: number
  classifierDurationMs?: number
  toolCount?: number
  hookCount?: number
  classifierCount?: number
  configWriteCount?: number
}

export type SystemLocalCommandMessage = SystemBaseMessage & {
  subtype: 'local_command'
  content: string
  level: SystemMessageLevel
}

export type SystemCompactBoundaryMessage = SystemBaseMessage & {
  subtype: 'compact_boundary'
  content: string
  level: SystemMessageLevel
  compactMetadata: CompactMetadata
  logicalParentUuid?: string
}

export type SystemMicrocompactBoundaryMessage = SystemBaseMessage & {
  subtype: 'microcompact_boundary'
  content: string
  level: SystemMessageLevel
  microcompactMetadata: MicrocompactMetadata
}

export type SystemAPIErrorMessage = SystemBaseMessage & {
  subtype: 'api_error'
  level: 'error'
  error: APIError
  cause?: Error
  retryInMs: number
  retryAttempt: number
  maxRetries: number
}

export type SystemMessage =
  | SystemInformationalMessage
  | SystemPermissionRetryMessage
  | SystemBridgeStatusMessage
  | SystemScheduledTaskFireMessage
  | SystemThinkingMessage
  | SystemStopHookSummaryMessage
  | SystemTurnDurationMessage
  | SystemAwaySummaryMessage
  | SystemMemorySavedMessage
  | SystemFileSnapshotMessage
  | SystemAgentsKilledMessage
  | SystemApiMetricsMessage
  | SystemLocalCommandMessage
  | SystemCompactBoundaryMessage
  | SystemMicrocompactBoundaryMessage
  | SystemAPIErrorMessage

export type RequestStartEvent = {
  type: 'stream_request_start'
  requestId?: string
  session_id?: string
  uuid?: string
  timestamp?: string
}

export type StreamEvent = {
  type: 'stream_event'
  event: BetaRawMessageStreamEvent | Record<string, unknown>
  ttftMs?: number
}

export type ToolUseSummaryMessage = {
  type: 'tool_use_summary'
  summary: string
  precedingToolUseIds: string[]
  uuid: string
  timestamp: string
}

export type TombstoneMessage = {
  type: 'tombstone'
  message: AssistantMessage
}

export type NormalizedAssistantMessage<
  TBlock extends BetaContentBlock = BetaContentBlock,
> = Omit<AssistantMessage, 'message'> & {
  message: Omit<BetaMessage, 'content'> & {
    content: TBlock[]
  }
}

export type NormalizedUserMessage<
  TBlock extends ContentBlockParam = ContentBlockParam,
> = Omit<UserMessage, 'message'> & {
  message: {
    role: 'user'
    content: TBlock[]
  }
}

export type GroupedToolUseMessage = {
  type: 'grouped_tool_use'
  toolName: string
  messages: NormalizedAssistantMessage<BetaToolUseBlock>[]
  results: NormalizedUserMessage<ToolResultBlockParam>[]
  displayMessage: NormalizedAssistantMessage<BetaToolUseBlock>
  uuid: string
  timestamp: string
  messageId: string
}

export type CollapsibleMessage =
  | NormalizedAssistantMessage<BetaToolUseBlock>
  | NormalizedUserMessage<ToolResultBlockParam>
  | GroupedToolUseMessage

export type CollapsedReadSearchGroup = {
  type: 'collapsed_read_search'
  searchCount: number
  readCount: number
  listCount: number
  replCount: number
  memorySearchCount: number
  memoryReadCount: number
  memoryWriteCount: number
  teamMemorySearchCount?: number
  teamMemoryReadCount?: number
  teamMemoryWriteCount?: number
  readFilePaths: string[]
  searchArgs: string[]
  latestDisplayHint?: string
  messages: CollapsibleMessage[]
  displayMessage: CollapsibleMessage
  uuid: string
  timestamp: string
  mcpCallCount?: number
  mcpServerNames?: string[]
  bashCount?: number
  gitOpBashCount?: number
  commits?: Array<{ sha: string; kind: string }>
  pushes?: Array<{ branch: string }>
  branches?: Array<{ ref: string; action: string }>
  prs?: Array<{ number: number; url?: string; action: string }>
  hookTotalMs?: number
  hookCount?: number
  hookInfos?: StopHookInfo[]
  relevantMemories?: Array<{ path: string; content: string; mtimeMs: number }>
}

export type HookResultMessage =
  | AttachmentMessage
  | ProgressMessage
  | SystemMessage

export type Message =
  | AssistantMessage
  | UserMessage
  | AttachmentMessage
  | ProgressMessage
  | SystemMessage

export type NormalizedMessage =
  | NormalizedAssistantMessage
  | NormalizedUserMessage
  | AttachmentMessage
  | ProgressMessage
  | SystemMessage

export type RenderableMessage =
  | NormalizedAssistantMessage
  | NormalizedUserMessage
  | AttachmentMessage
  | SystemMessage
  | GroupedToolUseMessage
  | CollapsedReadSearchGroup
