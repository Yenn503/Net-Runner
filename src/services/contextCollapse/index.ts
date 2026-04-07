// Stub — contextCollapse not included in source snapshot (feature-gated)
import type {
  AssistantMessage,
  Message,
  StreamEvent,
} from '../../types/message.js'

type ContextCollapseStats = {
  collapsedSpans: number
  collapsedMessages: number
  stagedSpans: number
  health: {
    totalErrors: number
    totalEmptySpawns: number
    totalSpawns: number
    emptySpawnWarningEmitted: boolean
    lastError?: string
  }
}

const EMPTY_STATS: ContextCollapseStats = {
  collapsedSpans: 0,
  collapsedMessages: 0,
  stagedSpans: 0,
  health: {
    totalErrors: 0,
    totalEmptySpawns: 0,
    totalSpawns: 0,
    emptySpawnWarningEmitted: false,
  },
}

export function isContextCollapseEnabled(): boolean {
  return false
}

export function resetContextCollapse(): void {}

export function initContextCollapse(): void {}

export function isWithheldPromptTooLong(
  _message: Message | StreamEvent | undefined,
  _isPromptTooLongMessage?: (message: AssistantMessage) => boolean,
  _querySource?: string,
): boolean {
  return false
}

export function getContextCollapseState() {
  return null
}

export function getStats(): ContextCollapseStats {
  return EMPTY_STATS
}

export async function applyCollapsesIfNeeded(
  messages: Message[],
  _toolUseContext: unknown,
  _querySource: string,
): Promise<{ messages: Message[] }> {
  return { messages }
}

export function recoverFromOverflow(
  messages: Message[],
  _querySource: string,
): { committed: number; messages: Message[] } {
  return {
    committed: 0,
    messages,
  }
}
