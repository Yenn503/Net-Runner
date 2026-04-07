import { z } from 'zod/v4'
import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'
import type { McpServerConfigForProcessTransport, SDKMessage, SDKSessionInfo } from './coreTypes.js'

export type AnyZodRawShape = Record<string, z.ZodTypeAny>

export type InferShape<Schema extends AnyZodRawShape> = {
  [Key in keyof Schema]: z.infer<Schema[Key]>
}

export type Options = Record<string, unknown>

export type InternalOptions = Options

export type Query = AsyncIterable<SDKMessage>

export type InternalQuery = Query

export type SessionMutationOptions = {
  dir?: string
}

export type GetSessionInfoOptions = {
  dir?: string
}

export type GetSessionMessagesOptions = {
  dir?: string
  limit?: number
  offset?: number
  includeSystemMessages?: boolean
}

export type ListSessionsOptions = {
  dir?: string
  limit?: number
  offset?: number
}

export type ForkSessionOptions = {
  dir?: string
  upToMessageId?: string
  title?: string
}

export type ForkSessionResult = {
  sessionId: string
}

export type SessionMessage = SDKMessage

export type SDKSessionOptions = Options

export type SDKSession = Record<string, unknown>

export type McpSdkServerConfigWithInstance = {
  type: 'sdk'
  name: string
  instance?: unknown
  config?: McpServerConfigForProcessTransport
}

export type SdkMcpToolDefinition<Schema extends AnyZodRawShape> = {
  name: string
  description: string
  inputSchema: Schema
  handler: (
    args: InferShape<Schema>,
    extra: unknown,
  ) => Promise<CallToolResult>
  annotations?: ToolAnnotations
  searchHint?: string
  alwaysLoad?: boolean
}

export type { SDKSessionInfo }
