// Stub — snipCompact not included in source snapshot
import type { Message } from '../../types/message.js'

export const SNIP_NUDGE_TEXT =
  'Context-efficiency mode is unavailable in this OSS build.'

type SnipCompactResult = {
  messages: Message[]
  tokensFreed: number
  boundaryMessage?: Message
  executed: boolean
}

export function isSnipRuntimeEnabled(): boolean {
  return false
}

export function shouldNudgeForSnips(_messages: Message[]): boolean {
  return false
}

export function isSnipMarkerMessage(_message: Message): boolean {
  return false
}

export function snipCompactIfNeeded(
  messages: Message[],
  _options?: { force?: boolean },
): SnipCompactResult {
  return {
    messages,
    tokensFreed: 0,
    executed: false,
  }
}

export function snipCompact(
  messages: Message[],
  options?: { force?: boolean },
): SnipCompactResult {
  return snipCompactIfNeeded(messages, options)
}
