import { FeedbackEngine, type FailureAnalysis, type RetryGuidance } from './feedbackEngine.js'
import { detectWaf, formatWafGuidanceForAgent, type WafDetectionResult } from './wafDetection.js'
import { KnowledgeGraph } from './knowledgeGraph.js'
import { AttackState, MCTSPlanner, formatMCTSResultForAgent, type MCTSResult } from './mctsPlanner.js'
import type { EvidenceEntry, FindingEntry } from './evidence.js'
import {
  ensureIntelligenceState,
  recordToolFailureReason,
  updateWafProfile,
  updateMctsPlan,
  updateKnowledgeGraphStats,
  type IntelligenceState,
  type PersistedWafProfile,
  type PersistedMctsSummary,
} from './intelligenceState.js'

// ---------------------------------------------------------------------------
// Singleton instances shared across an engagement
// ---------------------------------------------------------------------------

let _feedbackEngine: FeedbackEngine | null = null
let _knowledgeGraph: KnowledgeGraph | null = null

export function getFeedbackEngine(): FeedbackEngine {
  if (!_feedbackEngine) _feedbackEngine = new FeedbackEngine()
  return _feedbackEngine
}

export function getKnowledgeGraph(): KnowledgeGraph {
  if (!_knowledgeGraph) _knowledgeGraph = new KnowledgeGraph({ maxEntities: 500 })
  return _knowledgeGraph
}

export function resetIntelligenceInstances(): void {
  _feedbackEngine?.reset()
  _feedbackEngine = null
  _knowledgeGraph?.clear()
  _knowledgeGraph = null
}

// ---------------------------------------------------------------------------
// 1. Tool failure middleware
// ---------------------------------------------------------------------------

export type ToolFailureContext = {
  attempt: number
  payload: string | null
  error?: { message?: string; code?: string; statusCode?: number } | null
  responseBody?: string | null
  responseHeaders?: Record<string, string> | null
  statusCode?: number | null
}

export type EnrichedFailureResult = {
  analysis: FailureAnalysis
  guidance: RetryGuidance
  agentContext: string
}

export function processToolFailure(ctx: ToolFailureContext): EnrichedFailureResult {
  const engine = getFeedbackEngine()
  const guidance = engine.produceRetryGuidance(
    ctx.attempt,
    ctx.payload,
    ctx.error,
    ctx.responseBody,
    ctx.responseHeaders,
    ctx.statusCode,
  )

  const lines = [
    '[Intelligence: Failure Analysis]',
    `Reason: ${guidance.analysis.reason} (${(guidance.analysis.confidence * 100).toFixed(0)}% confidence)`,
    guidance.analysis.description,
  ]

  if (guidance.shouldRetry) {
    lines.push(`Retry: yes (delay ${guidance.delayMs}ms)`)
    if (guidance.mutatedPayload) {
      lines.push(`Mutated payload available: ${guidance.mutatedPayload.slice(0, 120)}${guidance.mutatedPayload.length > 120 ? '...' : ''}`)
    }
    if (Object.keys(guidance.headerOverrides).length > 0) {
      lines.push(`Header overrides: ${Object.keys(guidance.headerOverrides).join(', ')}`)
    }
  } else {
    lines.push('Retry: no (max attempts reached)')
  }

  if (guidance.recommendedStrategies.length > 0) {
    lines.push('Strategies: ' + guidance.recommendedStrategies.map(s => s.name).join(', '))
  }

  return {
    analysis: guidance.analysis,
    guidance,
    agentContext: lines.join('\n'),
  }
}

export async function processToolFailureWithPersistence(
  cwd: string,
  ctx: ToolFailureContext,
): Promise<EnrichedFailureResult> {
  const result = processToolFailure(ctx)
  await recordToolFailureReason(cwd, result.analysis.reason)
  return result
}

// ---------------------------------------------------------------------------
// 2. WAF auto-detection on HTTP response
// ---------------------------------------------------------------------------

export type WafAutoDetectResult = {
  isNew: boolean
  detection: WafDetectionResult
  agentContext: string
}

export function autoDetectWaf(
  statusCode: number,
  headers: Record<string, string>,
  body: string,
  cookies?: string,
  existingProfile?: PersistedWafProfile | null,
): WafAutoDetectResult {
  if (existingProfile?.detected) {
    return {
      isNew: false,
      detection: {
        detected: existingProfile.detected,
        wafType: existingProfile.wafType,
        wafName: existingProfile.wafName,
        confidence: existingProfile.confidence,
        matchedSignatures: existingProfile.matchedSignatures,
        bypassStrategies: [],
      },
      agentContext: `[Intelligence: WAF] Previously detected ${existingProfile.wafName} (${(existingProfile.confidence * 100).toFixed(0)}% confidence). Bypass strategies already available via /waf-detection.`,
    }
  }

  const detection = detectWaf(statusCode, headers, body, cookies)

  if (!detection.detected) {
    return {
      isNew: false,
      detection,
      agentContext: '[Intelligence: WAF] No WAF detected in this response.',
    }
  }

  return {
    isNew: true,
    detection,
    agentContext: formatWafGuidanceForAgent(detection),
  }
}

export async function autoDetectWafWithPersistence(
  cwd: string,
  statusCode: number,
  headers: Record<string, string>,
  body: string,
  cookies?: string,
): Promise<WafAutoDetectResult> {
  const state = await ensureIntelligenceState(cwd)
  const result = autoDetectWaf(statusCode, headers, body, cookies, state.wafProfile)

  if (result.isNew && result.detection.detected) {
    const profile: PersistedWafProfile = {
      detected: true,
      wafType: result.detection.wafType,
      wafName: result.detection.wafName,
      confidence: result.detection.confidence,
      matchedSignatures: result.detection.matchedSignatures,
      detectedAt: new Date().toISOString(),
    }
    await updateWafProfile(cwd, profile)
  }

  return result
}

// ---------------------------------------------------------------------------
// 3. Knowledge graph ↔ evidence ledger
// ---------------------------------------------------------------------------

export function ingestEvidenceToGraph(
  entries: EvidenceEntry[],
  graph?: KnowledgeGraph,
): { graph: KnowledgeGraph; imported: number } {
  const kg = graph ?? getKnowledgeGraph()
  const mapped: Array<Record<string, unknown>> = []

  for (const entry of entries) {
    if (entry.type === 'finding') {
      const finding = entry as FindingEntry
      mapped.push({
        type: 'vulnerability',
        id: finding.id,
        severity: finding.severity,
        title: finding.title,
        evidence: finding.evidence,
      })
    } else if (entry.type === 'execution_step') {
      const step = entry as EvidenceEntry & { agentType: string; description: string }
      if (step.description) {
        mapped.push({
          type: 'finding',
          id: step.id,
          agent: step.agentType,
          description: step.description,
        })
      }
    }
  }

  const imported = kg.ingestEvidenceEntries(mapped)
  return { graph: kg, imported }
}

export async function ingestEvidenceToGraphWithPersistence(
  cwd: string,
  entries: EvidenceEntry[],
): Promise<{ imported: number }> {
  const { graph, imported } = ingestEvidenceToGraph(entries)
  if (imported > 0) {
    await updateKnowledgeGraphStats(cwd, graph.getStats())
  }
  return { imported }
}

// ---------------------------------------------------------------------------
// 4. MCTS phase-transition planner
// ---------------------------------------------------------------------------

export function buildAttackStateFromGraph(
  target: string,
  graph?: KnowledgeGraph,
): AttackState {
  const kg = graph ?? getKnowledgeGraph()
  const hosts = kg.getEntitiesByType('host')
  const targetType = target.match(/^\d+\.\d+\.\d+\.\d+$/) ? 'ip' : 'domain'
  const state = new AttackState(target, targetType as 'ip' | 'domain')

  for (const host of hosts) {
    const services = kg.getRelationsTo(host.id).filter(r => r.type === 'runs-on')
    for (const svcRel of services) {
      const svc = kg.getEntity(svcRel.sourceId)
      if (svc) {
        const port = svc.properties['port'] as number | undefined
        const serviceName = svc.properties['name'] as string | undefined
        if (port) {
          state.addOpenPort(port, serviceName ?? 'unknown')
        }
      }
    }

    const vulnRels = kg.getRelationsFrom(host.id).filter(r => r.type === 'has-vuln')
    for (const vulnRel of vulnRels) {
      const vuln = kg.getEntity(vulnRel.targetId)
      if (vuln) {
        state.addVulnerability({
          id: vuln.id,
          severity: (vuln.properties['severity'] as 'critical' | 'high' | 'medium' | 'low' | 'info') ?? 'medium',
          type: (vuln.properties['type'] as string) ?? 'unknown',
          description: vuln.properties['title'] as string | undefined,
        })
      }
    }
  }

  const creds = kg.getEntitiesByType('credential')
  for (const cred of creds) {
    const username = cred.properties['username'] as string | undefined
    const password = cred.properties['password'] as string | undefined
    if (username) {
      state.addCredential({ username, credType: 'password', service: cred.properties['service'] as string | undefined })
    }
  }

  return state
}

export function planNextActions(
  target: string,
  iterations?: number,
  graph?: KnowledgeGraph,
): { result: MCTSResult; agentContext: string } {
  const state = buildAttackStateFromGraph(target, graph)
  const planner = new MCTSPlanner({ maxIterations: iterations ?? 200 })
  const result = planner.plan(state)
  const agentContext = formatMCTSResultForAgent(result)
  return { result, agentContext }
}

export async function planNextActionsWithPersistence(
  cwd: string,
  target: string,
  iterations?: number,
): Promise<{ result: MCTSResult; agentContext: string }> {
  const { result, agentContext } = planNextActions(target, iterations)

  const summary: PersistedMctsSummary = {
    rankedActions: result.actionRankings.slice(0, 5).map((a: { action: { type: string; name: string; agent: string }; visits: number }) => ({
      type: a.action.type,
      name: a.action.name,
      agent: a.action.agent,
      visits: a.visits,
      confidence: Number((a.visits / Math.max(result.iterations, 1) * 100).toFixed(1)),
    })),
    bestPath: result.bestPath.map((a: { name: string }) => a.name),
    totalIterations: result.iterations,
    computedAt: new Date().toISOString(),
  }

  await updateMctsPlan(cwd, summary)
  return { result, agentContext }
}

// ---------------------------------------------------------------------------
// 5. Blind finding verification gate
// ---------------------------------------------------------------------------

const BLIND_FINDING_PATTERNS = [
  /blind.*sqli/i, /time.?based.*injection/i, /boolean.?based.*blind/i,
  /blind.*xss/i, /blind.*ssrf/i, /blind.*xxe/i, /blind.*rce/i,
  /out.?of.?band/i, /oob.*callback/i, /log4shell/i, /jndi/i,
]

export function shouldGateBlindFinding(finding: FindingEntry): boolean {
  const text = `${finding.title} ${finding.evidence}`
  return BLIND_FINDING_PATTERNS.some(p => p.test(text))
}

// ---------------------------------------------------------------------------
// 6. Format intelligence context for agent prompt injection
// ---------------------------------------------------------------------------

export function formatIntelligenceContext(state: IntelligenceState): string {
  const lines = ['[Intelligence State]']

  if (state.wafProfile?.detected) {
    lines.push(`WAF: ${state.wafProfile.wafName} (${(state.wafProfile.confidence * 100).toFixed(0)}% confidence, detected ${state.wafProfile.detectedAt})`)
  }

  if (state.toolFailureCount > 0) {
    const topReasons = Object.entries(state.toolFailureReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([r, c]) => `${r}(${c})`)
      .join(', ')
    lines.push(`Tool failures: ${state.toolFailureCount} total, top reasons: ${topReasons}`)
  }

  if (state.lastMctsPlan) {
    const top3 = state.lastMctsPlan.rankedActions.slice(0, 3)
    if (top3.length > 0) {
      lines.push(`MCTS plan (${state.lastMctsPlan.computedAt}): ${top3.map(a => `${a.name}→${a.agent}`).join(', ')}`)
    }
  }

  const kgTotal = state.knowledgeGraphStats['totalEntities'] ?? 0
  if (kgTotal > 0) {
    lines.push(`Knowledge graph: ${kgTotal} entities, ${state.knowledgeGraphStats['totalRelations'] ?? 0} relations`)
  }

  if (state.pendingBlindVerifications > 0) {
    lines.push(`Pending blind verifications: ${state.pendingBlindVerifications}`)
  }

  if (lines.length === 1) {
    lines.push('No intelligence data collected yet.')
  }

  lines.push('[/Intelligence State]')
  return lines.join('\n')
}
