export type AssistantSession = {
  id: string
  title?: string
  environmentName?: string
  updatedAt?: string
}

export async function discoverAssistantSessions(): Promise<
  AssistantSession[]
> {
  throw new Error(
    'Assistant session discovery is not supported in this OSS build.',
  )
}
