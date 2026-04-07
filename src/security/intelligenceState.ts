import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, relative, resolve } from 'path'
import { getIntelligenceStatePath } from './paths.js'
import type { WafType } from './wafDetection.js'

// ---------------------------------------------------------------------------
// WAF profile (persisted after first HTTP detection)
// ---------------------------------------------------------------------------

export type PersistedWafProfile = {
  detected: boolean
  wafType: WafType
  wafName: string
  confidence: number
  matchedSignatures: string[]
  detectedAt: string
}

// ---------------------------------------------------------------------------
// MCTS action summary (persisted after planning run)
// ---------------------------------------------------------------------------

export type PersistedMctsAction = {
  type: string
  name: string
  agent: string
  visits: number
  confidence: number
}

export type PersistedMctsSummary = {
  rankedActions: PersistedMctsAction[]
  bestPath: string[]
  totalIterations: number
  computedAt: string
}

// ---------------------------------------------------------------------------
// Intelligence state — lives at .netrunner/intelligence-state.json
// ---------------------------------------------------------------------------

export type IntelligenceState = {
  schemaVersion: 1
  wafProfile: PersistedWafProfile | null
  lastMctsPlan: PersistedMctsSummary | null
  knowledgeGraphStats: Record<string, number>
  toolFailureCount: number
  toolFailureReasons: Record<string, number>
  pendingBlindVerifications: number
  updatedAt: string
}

export function createDefaultIntelligenceState(): IntelligenceState {
  return {
    schemaVersion: 1,
    wafProfile: null,
    lastMctsPlan: null,
    knowledgeGraphStats: {},
    toolFailureCount: 0,
    toolFailureReasons: {},
    pendingBlindVerifications: 0,
    updatedAt: new Date().toISOString(),
  }
}

function getSafeIntelligenceStatePath(cwd: string): string {
  const rootDir = resolve(cwd)
  const intelligenceStatePath = resolve(getIntelligenceStatePath(cwd))
  const relativePath = relative(rootDir, intelligenceStatePath)
  if (relativePath.startsWith('..')) {
    throw new Error('Resolved intelligence state path escaped cwd')
  }
  return intelligenceStatePath
}

export async function readIntelligenceState(
  cwd: string,
): Promise<IntelligenceState | null> {
  try {
    const raw = await readFile(getSafeIntelligenceStatePath(cwd), 'utf8')
    return JSON.parse(raw) as IntelligenceState
  } catch {
    return null
  }
}

export async function writeIntelligenceState(
  cwd: string,
  state: IntelligenceState,
): Promise<void> {
  const next: IntelligenceState = {
    ...state,
    updatedAt: new Date().toISOString(),
  }
  const path = getSafeIntelligenceStatePath(cwd)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(next, null, 2), 'utf8')
}

export async function ensureIntelligenceState(
  cwd: string,
): Promise<IntelligenceState> {
  const existing = await readIntelligenceState(cwd)
  if (existing) return existing
  const initial = createDefaultIntelligenceState()
  await writeIntelligenceState(cwd, initial)
  return initial
}

export async function updateWafProfile(
  cwd: string,
  profile: PersistedWafProfile,
): Promise<void> {
  const state = await ensureIntelligenceState(cwd)
  state.wafProfile = profile
  await writeIntelligenceState(cwd, state)
}

export async function updateMctsPlan(
  cwd: string,
  plan: PersistedMctsSummary,
): Promise<void> {
  const state = await ensureIntelligenceState(cwd)
  state.lastMctsPlan = plan
  await writeIntelligenceState(cwd, state)
}

export async function recordToolFailureReason(
  cwd: string,
  reason: string,
): Promise<void> {
  const state = await ensureIntelligenceState(cwd)
  state.toolFailureCount += 1
  state.toolFailureReasons[reason] = (state.toolFailureReasons[reason] ?? 0) + 1
  await writeIntelligenceState(cwd, state)
}

export async function updateKnowledgeGraphStats(
  cwd: string,
  stats: Record<string, number>,
): Promise<void> {
  const state = await ensureIntelligenceState(cwd)
  state.knowledgeGraphStats = stats
  await writeIntelligenceState(cwd, state)
}

export async function incrementPendingBlindVerifications(
  cwd: string,
  count = 1,
): Promise<void> {
  const state = await ensureIntelligenceState(cwd)
  state.pendingBlindVerifications = Math.max(
    0,
    state.pendingBlindVerifications + count,
  )
  await writeIntelligenceState(cwd, state)
}

export async function decrementPendingBlindVerifications(
  cwd: string,
  count = 1,
): Promise<void> {
  await incrementPendingBlindVerifications(cwd, -count)
}
