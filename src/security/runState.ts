import { randomUUID } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname } from 'path'
import { getRunStatePath } from './paths.js'

export type SecurityExecutionStatus = 'completed' | 'failed' | 'killed'

export type SecurityExecutionStep = {
  id: string
  createdAt: string
  agentType: string
  status: SecurityExecutionStatus
  description: string
  prompt: string
  summary?: string
  outputFile?: string
  totalToolUseCount?: number
  totalDurationMs?: number
  model?: string
}

export type SecurityReviewStatus = 'pending' | 'approved' | 'rejected'

export type PendingSecurityReview = {
  id: string
  createdAt: string
  updatedAt: string
  status: SecurityReviewStatus
  plannedAction: string
  reason: string
  matchedPatterns: string[]
  requestedBy: 'guardrail'
  decidedBy?: string
}

export type SecurityRunState = {
  schemaVersion: 1
  workflowId: string
  currentPhase: string
  phaseHistory: string[]
  executionSteps: SecurityExecutionStep[]
  pendingReviews: PendingSecurityReview[]
  updatedAt: string
}

export type CreateSecurityRunStateOptions = {
  workflowId?: string
  currentPhase?: string
}

const MAX_STEPS = 250

export function createDefaultSecurityRunState(
  options?: CreateSecurityRunStateOptions,
): SecurityRunState {
  const workflowId = options?.workflowId ?? 'unknown'
  const currentPhase = options?.currentPhase ?? 'execution'
  const now = new Date().toISOString()
  return {
    schemaVersion: 1,
    workflowId,
    currentPhase,
    phaseHistory: [currentPhase],
    executionSteps: [],
    pendingReviews: [],
    updatedAt: now,
  }
}

export async function readSecurityRunState(
  cwd: string,
): Promise<SecurityRunState | null> {
  try {
    const raw = await readFile(getRunStatePath(cwd), 'utf8')
    return JSON.parse(raw) as SecurityRunState
  } catch {
    return null
  }
}

export async function writeSecurityRunState(
  cwd: string,
  state: SecurityRunState,
): Promise<void> {
  const nextState: SecurityRunState = {
    ...state,
    updatedAt: new Date().toISOString(),
  }
  const path = getRunStatePath(cwd)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(nextState, null, 2), 'utf8')
}

export async function ensureSecurityRunState(
  cwd: string,
  options?: CreateSecurityRunStateOptions,
): Promise<SecurityRunState> {
  const existing = await readSecurityRunState(cwd)
  if (existing) {
    return existing
  }
  const initial = createDefaultSecurityRunState(options)
  await writeSecurityRunState(cwd, initial)
  return initial
}

export type SecurityExecutionStepInput = Omit<
  SecurityExecutionStep,
  'id' | 'createdAt'
>

export async function appendSecurityExecutionStep(
  cwd: string,
  step: SecurityExecutionStepInput,
): Promise<SecurityExecutionStep> {
  const current = await ensureSecurityRunState(cwd)
  const nextStep: SecurityExecutionStep = {
    ...step,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  }
  const next: SecurityRunState = {
    ...current,
    executionSteps: [...current.executionSteps, nextStep].slice(-MAX_STEPS),
  }
  await writeSecurityRunState(cwd, next)
  return nextStep
}

export async function queuePendingSecurityReview(
  cwd: string,
  review: {
    plannedAction: string
    reason: string
    matchedPatterns: string[]
  },
): Promise<PendingSecurityReview> {
  const current = await ensureSecurityRunState(cwd)
  const now = new Date().toISOString()
  const nextReview: PendingSecurityReview = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'pending',
    plannedAction: review.plannedAction,
    reason: review.reason,
    matchedPatterns: review.matchedPatterns,
    requestedBy: 'guardrail',
  }
  await writeSecurityRunState(cwd, {
    ...current,
    pendingReviews: [...current.pendingReviews, nextReview],
  })
  return nextReview
}

export async function resolvePendingSecurityReview(
  cwd: string,
  reviewId: string,
  status: 'approved' | 'rejected',
  decidedBy = 'operator',
): Promise<PendingSecurityReview | null> {
  const current = await readSecurityRunState(cwd)
  if (!current) {
    return null
  }

  let resolved: PendingSecurityReview | null = null
  const nextReviews = current.pendingReviews.map(review => {
    if (review.id !== reviewId || review.status !== 'pending') {
      return review
    }
    const next: PendingSecurityReview = {
      ...review,
      status,
      decidedBy,
      updatedAt: new Date().toISOString(),
    }
    resolved = next
    return next
  })

  if (!resolved) {
    return null
  }

  await writeSecurityRunState(cwd, {
    ...current,
    pendingReviews: nextReviews,
  })
  return resolved
}
