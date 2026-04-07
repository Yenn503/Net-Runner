import type { Attachment } from '../../utils/attachments.js'
import type { Message } from '../../types/message.js'
import type { ToolUseContext } from '../../Tool.js'

export type SkillDiscoveryPrefetch = {
  startedAt: number
}

export function startSkillDiscoveryPrefetch(
  _input: string | null,
  _messages: Message[],
  _toolUseContext: ToolUseContext,
): SkillDiscoveryPrefetch {
  return { startedAt: Date.now() }
}

export async function collectSkillDiscoveryPrefetch(
  _prefetch: SkillDiscoveryPrefetch,
): Promise<Attachment[]> {
  return []
}
