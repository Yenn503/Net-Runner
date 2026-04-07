import type { Message, StreamEvent } from '../../types/message.js'
import type { CompactionResult } from './compact.js'

type ReactiveCompactOutcome =
  | {
      ok: true
      result: CompactionResult
    }
  | {
      ok: false
      reason: 'too_few_groups' | 'aborted' | 'exhausted' | 'error' | 'media_unstrippable'
    }

export function isWithheldPromptTooLong(
  _message: Message | StreamEvent | undefined,
): boolean {
  return false
}

export function isReactiveCompactEnabled(): boolean {
  return false
}

export function isReactiveOnlyMode(): boolean {
  return false
}

export function isWithheldMediaSizeError(
  _message: Message | StreamEvent | undefined,
): boolean {
  return false
}

export async function tryReactiveCompact(_input: {
  hasAttempted: boolean
  querySource: string
  aborted: boolean
  messages: Message[]
  cacheSafeParams: unknown
}): Promise<CompactionResult | null> {
  return null
}

export async function reactiveCompactOnPromptTooLong(
  _messages: Message[],
  _cacheSafeParams: unknown,
  _options: {
    customInstructions?: string
    trigger: 'manual' | 'automatic'
  },
): Promise<ReactiveCompactOutcome> {
  return { ok: false, reason: 'exhausted' }
}
