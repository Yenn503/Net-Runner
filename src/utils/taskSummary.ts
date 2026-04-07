export function shouldGenerateTaskSummary(): boolean {
  return false
}

export function maybeGenerateTaskSummary(_input: {
  systemPrompt: unknown
  userContext: Record<string, string>
  systemContext: Record<string, string>
  toolUseContext: unknown
  forkContextMessages: unknown[]
}): void {}
