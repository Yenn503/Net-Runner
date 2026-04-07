// SDK Core Types - Common serializable types used by both SDK consumers and SDK builders.
//
// Types are generated from Zod schemas in coreSchemas.ts.
// To modify types:
// 1. Edit Zod schemas in coreSchemas.ts
// 2. Run: bun scripts/generate-sdk-types.ts
//
// Schemas are available in coreSchemas.ts for runtime validation but are not
// part of the public API.

import { z } from 'zod/v4'
import {
  ApiKeySourceSchema,
  AsyncHookJSONOutputSchema,
  ConfigChangeHookInputSchema,
  CwdChangedHookInputSchema,
  ElicitationHookInputSchema,
  ElicitationResultHookInputSchema,
  ExitReasonSchema,
  FileChangedHookInputSchema,
  HookEventSchema,
  HookInputSchema,
  HookJSONOutputSchema,
  InstructionsLoadedHookInputSchema,
  McpServerConfigForProcessTransportSchema,
  McpServerStatusSchema,
  ModelInfoSchema,
  ModelUsageSchema,
  NotificationHookInputSchema,
  PermissionDeniedHookInputSchema,
  PermissionModeSchema,
  PermissionRequestHookInputSchema,
  PermissionResultSchema,
  PermissionUpdateSchema,
  PostCompactHookInputSchema,
  PostToolUseFailureHookInputSchema,
  PostToolUseHookInputSchema,
  PreCompactHookInputSchema,
  PreToolUseHookInputSchema,
  RewindFilesResultSchema,
  SDKAssistantMessageErrorSchema,
  SDKAssistantMessageSchema,
  SDKCompactBoundaryMessageSchema,
  SDKMessageSchema,
  SDKPartialAssistantMessageSchema,
  SDKPermissionDenialSchema,
  SDKRateLimitInfoSchema,
  SDKResultMessageSchema,
  SDKSessionInfoSchema,
  SDKStatusMessageSchema,
  SDKStatusSchema,
  SDKSystemMessageSchema,
  SDKToolProgressMessageSchema,
  SDKUserMessageReplaySchema,
  SDKUserMessageSchema,
  SessionEndHookInputSchema,
  SessionStartHookInputSchema,
  SetupHookInputSchema,
  StopFailureHookInputSchema,
  StopHookInputSchema,
  SubagentStartHookInputSchema,
  SubagentStopHookInputSchema,
  SyncHookJSONOutputSchema,
  TaskCompletedHookInputSchema,
  TaskCreatedHookInputSchema,
  TeammateIdleHookInputSchema,
  UserPromptSubmitHookInputSchema,
} from './coreSchemas.js'

// Re-export sandbox types for SDK consumers
export type {
  SandboxFilesystemConfig,
  SandboxIgnoreViolations,
  SandboxNetworkConfig,
  SandboxSettings,
} from '../sandboxTypes.js'
// Re-export all generated types
export * from './coreTypes.generated.js'

// Re-export utility types that can't be expressed as Zod schemas
export type { NonNullableUsage } from './sdkUtilityTypes.js'

export type ApiKeySource = z.infer<ReturnType<typeof ApiKeySourceSchema>>
export type AsyncHookJSONOutput = z.infer<
  ReturnType<typeof AsyncHookJSONOutputSchema>
>
export type ConfigChangeHookInput = z.infer<
  ReturnType<typeof ConfigChangeHookInputSchema>
>
export type CwdChangedHookInput = z.infer<
  ReturnType<typeof CwdChangedHookInputSchema>
>
export type ElicitationHookInput = z.infer<
  ReturnType<typeof ElicitationHookInputSchema>
>
export type ElicitationResultHookInput = z.infer<
  ReturnType<typeof ElicitationResultHookInputSchema>
>
export type ExitReason = z.infer<ReturnType<typeof ExitReasonSchema>>
export type FileChangedHookInput = z.infer<
  ReturnType<typeof FileChangedHookInputSchema>
>
export type HookEvent = z.infer<ReturnType<typeof HookEventSchema>>
export type HookInput = z.infer<ReturnType<typeof HookInputSchema>>
export type HookJSONOutput = z.infer<ReturnType<typeof HookJSONOutputSchema>>
export type InstructionsLoadedHookInput = z.infer<
  ReturnType<typeof InstructionsLoadedHookInputSchema>
>
export type McpServerConfigForProcessTransport = z.infer<
  ReturnType<typeof McpServerConfigForProcessTransportSchema>
>
export type McpServerStatus = z.infer<
  ReturnType<typeof McpServerStatusSchema>
>
export type ModelInfo = z.infer<ReturnType<typeof ModelInfoSchema>>
export type ModelUsage = z.infer<ReturnType<typeof ModelUsageSchema>>
export type NotificationHookInput = z.infer<
  ReturnType<typeof NotificationHookInputSchema>
>
export type PermissionDeniedHookInput = z.infer<
  ReturnType<typeof PermissionDeniedHookInputSchema>
>
export type PermissionMode = z.infer<ReturnType<typeof PermissionModeSchema>>
export type PermissionRequestHookInput = z.infer<
  ReturnType<typeof PermissionRequestHookInputSchema>
>
export type PermissionResult = z.infer<
  ReturnType<typeof PermissionResultSchema>
>
export type PermissionUpdate = z.infer<
  ReturnType<typeof PermissionUpdateSchema>
>
export type PostCompactHookInput = z.infer<
  ReturnType<typeof PostCompactHookInputSchema>
>
export type PostToolUseFailureHookInput = z.infer<
  ReturnType<typeof PostToolUseFailureHookInputSchema>
>
export type PostToolUseHookInput = z.infer<
  ReturnType<typeof PostToolUseHookInputSchema>
>
export type PreCompactHookInput = z.infer<
  ReturnType<typeof PreCompactHookInputSchema>
>
export type PreToolUseHookInput = z.infer<
  ReturnType<typeof PreToolUseHookInputSchema>
>
export type RewindFilesResult = z.infer<
  ReturnType<typeof RewindFilesResultSchema>
>
export type SDKAssistantMessage = z.infer<
  ReturnType<typeof SDKAssistantMessageSchema>
>
export type SDKAssistantMessageError = z.infer<
  ReturnType<typeof SDKAssistantMessageErrorSchema>
>
export type SDKCompactBoundaryMessage = z.infer<
  ReturnType<typeof SDKCompactBoundaryMessageSchema>
>
export type SDKMessage = z.infer<ReturnType<typeof SDKMessageSchema>>
export type SDKPartialAssistantMessage = z.infer<
  ReturnType<typeof SDKPartialAssistantMessageSchema>
>
export type SDKPermissionDenial = z.infer<
  ReturnType<typeof SDKPermissionDenialSchema>
>
export type SDKRateLimitInfo = z.infer<
  ReturnType<typeof SDKRateLimitInfoSchema>
>
export type SDKResultMessage = z.infer<
  ReturnType<typeof SDKResultMessageSchema>
>
export type SDKSessionInfo = z.infer<
  ReturnType<typeof SDKSessionInfoSchema>
>
export type SDKStatus = z.infer<ReturnType<typeof SDKStatusSchema>>
export type SDKStatusMessage = z.infer<
  ReturnType<typeof SDKStatusMessageSchema>
>
export type SDKSystemMessage = z.infer<
  ReturnType<typeof SDKSystemMessageSchema>
>
export type SDKToolProgressMessage = z.infer<
  ReturnType<typeof SDKToolProgressMessageSchema>
>
export type SDKUserMessage = z.infer<
  ReturnType<typeof SDKUserMessageSchema>
>
export type SDKUserMessageReplay = z.infer<
  ReturnType<typeof SDKUserMessageReplaySchema>
>
export type SessionEndHookInput = z.infer<
  ReturnType<typeof SessionEndHookInputSchema>
>
export type SessionStartHookInput = z.infer<
  ReturnType<typeof SessionStartHookInputSchema>
>
export type SetupHookInput = z.infer<ReturnType<typeof SetupHookInputSchema>>
export type StopFailureHookInput = z.infer<
  ReturnType<typeof StopFailureHookInputSchema>
>
export type StopHookInput = z.infer<ReturnType<typeof StopHookInputSchema>>
export type SubagentStartHookInput = z.infer<
  ReturnType<typeof SubagentStartHookInputSchema>
>
export type SubagentStopHookInput = z.infer<
  ReturnType<typeof SubagentStopHookInputSchema>
>
export type SyncHookJSONOutput = z.infer<
  ReturnType<typeof SyncHookJSONOutputSchema>
>
export type TaskCompletedHookInput = z.infer<
  ReturnType<typeof TaskCompletedHookInputSchema>
>
export type TaskCreatedHookInput = z.infer<
  ReturnType<typeof TaskCreatedHookInputSchema>
>
export type TeammateIdleHookInput = z.infer<
  ReturnType<typeof TeammateIdleHookInputSchema>
>
export type UserPromptSubmitHookInput = z.infer<
  ReturnType<typeof UserPromptSubmitHookInputSchema>
>

// Const arrays for runtime usage
export const HOOK_EVENTS = [
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'Notification',
  'UserPromptSubmit',
  'SessionStart',
  'SessionEnd',
  'Stop',
  'StopFailure',
  'SubagentStart',
  'SubagentStop',
  'PreCompact',
  'PostCompact',
  'PermissionRequest',
  'PermissionDenied',
  'Setup',
  'TeammateIdle',
  'TaskCreated',
  'TaskCompleted',
  'Elicitation',
  'ElicitationResult',
  'ConfigChange',
  'WorktreeCreate',
  'WorktreeRemove',
  'InstructionsLoaded',
  'CwdChanged',
  'FileChanged',
] as const

export const EXIT_REASONS = [
  'clear',
  'resume',
  'logout',
  'prompt_input_exit',
  'other',
  'bypass_permissions_disabled',
] as const
