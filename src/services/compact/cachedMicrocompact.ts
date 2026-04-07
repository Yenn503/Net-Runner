// Stub — cachedMicrocompact not included in source snapshot (feature-gated)
export type CacheEdit = {
  type: 'delete'
  cache_reference: string
}

export type CacheEditsBlock = {
  type: 'cache_edits'
  edits: CacheEdit[]
}

export type PinnedCacheEdits = {
  userMessageIndex: number
  block: CacheEditsBlock
}

export type CachedMCState = {
  registeredTools: Set<string>
  toolOrder: string[]
  deletedRefs: Set<string>
  pinnedEdits: PinnedCacheEdits[]
}

export type CachedMCConfig = {
  enabled: boolean
  supportedModels: string[]
  systemPromptSuggestSummaries: boolean
  triggerThreshold: number
  keepRecent: number
}

const CACHED_MC_CONFIG: CachedMCConfig = {
  enabled: false,
  supportedModels: [],
  systemPromptSuggestSummaries: false,
  triggerThreshold: 0,
  keepRecent: 0,
}

export function isCachedMicrocompactEnabled(): boolean {
  return false
}

export function isModelSupportedForCacheEditing(_model: string): boolean {
  return false
}

export function getCachedMCConfig(): CachedMCConfig {
  return CACHED_MC_CONFIG
}

export function createCachedMCState(): CachedMCState {
  return {
    registeredTools: new Set<string>(),
    toolOrder: [],
    deletedRefs: new Set<string>(),
    pinnedEdits: [],
  }
}

export function markToolsSentToAPI(_state: CachedMCState): void {}

export function resetCachedMCState(state: CachedMCState): void {
  state.registeredTools.clear()
  state.toolOrder = []
  state.deletedRefs.clear()
  state.pinnedEdits = []
}

export function registerToolResult(state: CachedMCState, toolUseId: string): void {
  if (!state.registeredTools.has(toolUseId)) {
    state.registeredTools.add(toolUseId)
    state.toolOrder.push(toolUseId)
  }
}

export function registerToolMessage(
  _state: CachedMCState,
  _groupIds: string[],
): void {}

export function getToolResultsToDelete(_state: CachedMCState): string[] {
  return []
}

export function createCacheEditsBlock(
  _state: CachedMCState,
  _toolIds: string[],
): CacheEditsBlock | null {
  return null
}
