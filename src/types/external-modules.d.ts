declare module 'diff' {
  export type StructuredPatchHunk = any
  export function createPatch(...args: any[]): string
  export function diffArrays(...args: any[]): any
  export function diffLines(...args: any[]): any
  export function diffWordsWithSpace(...args: any[]): any
}

declare module 'ws' {
  const WebSocket: any
  export default WebSocket
}

declare module 'semver' {
  export function major(version: string, options?: Record<string, unknown>): number
  export function minor(version: string, options?: Record<string, unknown>): number
  export function patch(version: string, options?: Record<string, unknown>): number
}

declare module 'qrcode' {
  export function toString(...args: any[]): Promise<string>
}

declare module 'react-reconciler' {
  export type FiberRoot = any
  export default function createReconciler(...args: any[]): any
}

declare module 'react-reconciler/constants.js' {
  export const ContinuousEventPriority: any
  export const DefaultEventPriority: any
  export const DiscreteEventPriority: any
  export const LegacyRoot: any
}

declare module 'shell-quote' {
  export type ControlOperator = any
  export type ParseEntry = any
  export function parse(command: string, env?: Record<string, string>): ParseEntry[]
  export function quote(args: readonly any[]): string
}

declare module 'proper-lockfile' {
  export type CheckOptions = Record<string, unknown>
  export type LockOptions = Record<string, unknown>
  export type UnlockOptions = Record<string, unknown>
  export function check(...args: any[]): Promise<boolean>
  export function lock(...args: any[]): Promise<() => Promise<void>>
  export function unlock(...args: any[]): Promise<void>
}

declare module 'picomatch' {
  export default function picomatch(...args: any[]): (input: string) => boolean
}

declare module 'turndown' {
  export default class TurndownService {
    constructor(...args: any[])
    turndown(input: any): string
  }
}

declare module '@anthropic-ai/mcpb' {
  export type McpbManifest = any
  export type McpbUserConfigurationOption = any
}

declare module 'bidi-js' {
  export default function bidiFactory(...args: any[]): any
}

declare module '@ant/claude-for-chrome-mcp' {
  export const BROWSER_TOOLS: any
  export type Logger = any
  export type PermissionMode = any
  export function createClaudeForChromeMcpServer(...args: any[]): any
}

declare module '@ant/computer-use-mcp' {
  export const API_RESIZE_PARAMS: any
  export const DEFAULT_GRANT_FLAGS: any
  export const targetImageSize: any
  export function bindSessionContext(...args: any[]): any
  export function buildComputerUseTools(...args: any[]): any
  export function createComputerUseMcpServer(...args: any[]): any
  export type ComputerUseSessionContext = any
  export type CuCallToolResult = any
  export type CuPermissionRequest = any
  export type CuPermissionResponse = any
  export type ResolvePrepareCaptureResult = any
  export type RunningApp = any
  export type ScreenshotDims = any
  export type ScreenshotResult = any
}

declare module '@ant/computer-use-mcp/types' {
  export const DEFAULT_GRANT_FLAGS: any
  export type ComputerUseHostAdapter = any
  export type CoordinateMode = any
  export type CuPermissionRequest = any
  export type CuPermissionResponse = any
  export type CuSubGates = any
  export type Logger = any
}

declare module '@ant/computer-use-mcp/sentinelApps' {
  export function getSentinelCategory(...args: any[]): any
}

declare const MACRO: {
  BUILD_TIME?: string
  DISPLAY_VERSION?: string
  FEEDBACK_CHANNEL?: string
  ISSUES_EXPLAINER?: string
  NATIVE_PACKAGE_URL?: string
  PACKAGE_URL?: string
  VERSION: string
  VERSION_CHANGELOG?: string
}

declare module './commands/*/index.js' {
  const command: any
  export default command
}

declare module './commands/*.js' {
  const command: any
  export default command
}

declare module './commands/reset-limits/index.js' {
  export const resetLimits: any
  export const resetLimitsNonInteractive: any
}

declare module './services/skillSearch/localSearch.js' {
  export function clearSkillIndexCache(...args: any[]): any
}

declare module 'plist' {
  export function parse(input: string): unknown
}

declare module 'audio-capture-napi' {
  const value: any
  export default value
  export = value
}

declare module 'sharp' {
  const value: any
  export default value
  export = value
}

declare module 'image-processor-napi' {
  const value: any
  export default value
  export = value
}

declare module '*.md' {
  const value: string
  export default value
}

declare module './tools/WorkflowTool/createWorkflowCommand.js' {
  export function getWorkflowCommands(...args: any[]): any
}
