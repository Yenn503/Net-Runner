import { appendEvidenceEntry, readEvidenceEntries } from './evidence.js'
import { assessPlannedAction, readEngagementManifest } from './engagement.js'
import type { GuardrailDecision } from './guardrails.js'
import { NET_RUNNER_AGENT_TYPES, type NetRunnerAgentType } from './agentTypes.js'
import {
  appendSecurityExecutionStep,
  queuePendingSecurityReview,
} from './runState.js'
import {
  processToolFailureWithPersistence,
  autoDetectWafWithPersistence,
  ingestEvidenceToGraphWithPersistence,
  type ToolFailureContext,
  type EnrichedFailureResult,
  type WafAutoDetectResult,
} from './intelligenceMiddleware.js'

const SECURITY_AGENT_TYPES = new Set<string>(NET_RUNNER_AGENT_TYPES)

export function isNetRunnerSecurityAgent(agentType: string): agentType is NetRunnerAgentType {
  return SECURITY_AGENT_TYPES.has(agentType)
}

export async function evaluateEngagementGuardrail(
  cwd: string,
  plannedAction: string,
  options?: {
    recordAllow?: boolean
  },
): Promise<GuardrailDecision | null> {
  const manifest = await readEngagementManifest(cwd)
  if (!manifest) {
    return null
  }

  const decision = assessPlannedAction(manifest, plannedAction)
  let recordedDecision: GuardrailDecision = decision

  if (decision.action === 'review') {
    const pendingReview = await queuePendingSecurityReview(cwd, {
      plannedAction,
      reason: decision.reason,
      matchedPatterns: decision.matchedPatterns,
    })
    recordedDecision = {
      ...decision,
      reviewId: pendingReview.id,
      reason: `${decision.reason} Pending review id: ${pendingReview.id}.`,
    }
    await appendEvidenceEntry(cwd, {
      type: 'approval',
      reviewId: pendingReview.id,
      status: 'pending',
      plannedAction,
      reason: decision.reason,
    })
  }

  if (recordedDecision.action !== 'allow' || options?.recordAllow) {
    await appendEvidenceEntry(cwd, {
      type: 'guardrail',
      plannedAction,
      decision: recordedDecision,
    })
  }

  return recordedDecision
}

export async function evaluateSubagentGuardrail(
  cwd: string,
  plannedAction: string,
): Promise<GuardrailDecision | null> {
  try {
    return await evaluateEngagementGuardrail(cwd, plannedAction, {
      recordAllow: true,
    })
  } catch {
    return null
  }
}

type RecordSubagentExecutionOptions = {
  cwd: string
  agentType: string
  status: 'completed' | 'failed' | 'killed'
  description: string
  prompt: string
  summary?: string
  outputFile?: string
  totalToolUseCount?: number
  totalDurationMs?: number
  model?: string
}

function trimSummary(value: string, max = 400): string {
  const trimmed = value.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= max) {
    return trimmed
  }
  return `${trimmed.slice(0, max)}...`
}

// ---------------------------------------------------------------------------
// Intelligence middleware hooks
// ---------------------------------------------------------------------------

export async function handleToolFailure(
  cwd: string,
  ctx: ToolFailureContext,
): Promise<EnrichedFailureResult | null> {
  try {
    const manifest = await readEngagementManifest(cwd)
    if (!manifest) return null
    return await processToolFailureWithPersistence(cwd, ctx)
  } catch {
    return null
  }
}

export async function handleHttpResponse(
  cwd: string,
  statusCode: number,
  headers: Record<string, string>,
  body: string,
  cookies?: string,
): Promise<WafAutoDetectResult | null> {
  try {
    const manifest = await readEngagementManifest(cwd)
    if (!manifest) return null
    return await autoDetectWafWithPersistence(cwd, statusCode, headers, body, cookies)
  } catch {
    return null
  }
}

export async function syncEvidenceToKnowledgeGraph(
  cwd: string,
): Promise<{ imported: number } | null> {
  try {
    const manifest = await readEngagementManifest(cwd)
    if (!manifest) return null
    const entries = await readEvidenceEntries(cwd)
    if (entries.length === 0) return { imported: 0 }
    return await ingestEvidenceToGraphWithPersistence(cwd, entries)
  } catch {
    return null
  }
}

export async function recordSubagentExecution(
  options: RecordSubagentExecutionOptions,
): Promise<void> {
  try {
    const manifest = await readEngagementManifest(options.cwd)
    if (!manifest) {
      return
    }

    await appendSecurityExecutionStep(options.cwd, {
      agentType: options.agentType,
      status: options.status,
      description: options.description,
      prompt: options.prompt,
      summary: options.summary,
      outputFile: options.outputFile,
      totalToolUseCount: options.totalToolUseCount,
      totalDurationMs: options.totalDurationMs,
      model: options.model,
    })

    await appendEvidenceEntry(options.cwd, {
      type: 'execution_step',
      agentType: options.agentType,
      status: options.status,
      description: trimSummary(options.description, 160),
      prompt: trimSummary(options.prompt, 220),
      summary:
        options.summary && options.summary.trim().length > 0
          ? trimSummary(options.summary)
          : undefined,
      outputFile: options.outputFile,
      totalToolUseCount: options.totalToolUseCount,
      totalDurationMs: options.totalDurationMs,
      model: options.model,
    })

    if (options.outputFile) {
      await appendEvidenceEntry(options.cwd, {
        type: 'artifact',
        label: `subagent-output:${options.agentType}`,
        path: options.outputFile,
        description: `Captured output transcript for ${options.agentType} (${options.status}).`,
      })
    }
  } catch {
    return
  }
}
