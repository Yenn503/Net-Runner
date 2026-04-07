import type { PromptCommand } from '../types/command.js'
import type { MCPServerConnection } from '../services/mcp/types.js'

type CachedFetcher = ((client: MCPServerConnection) => Promise<PromptCommand[]>) & {
  cache: Map<string, Promise<PromptCommand[]>>
}

const fetcher = (async (
  client: MCPServerConnection,
): Promise<PromptCommand[]> => {
  const cached = fetcher.cache.get(client.name)
  if (cached) {
    return cached
  }

  const result = Promise.resolve([] as PromptCommand[])
  fetcher.cache.set(client.name, result)
  return result
}) as CachedFetcher

fetcher.cache = new Map<string, Promise<PromptCommand[]>>()

export const fetchMcpSkillsForClient = fetcher
