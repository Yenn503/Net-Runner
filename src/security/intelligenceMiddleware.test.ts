import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { initializeNetRunnerProject } from './engagement.ts'
import { appendEvidenceEntry, readEvidenceEntries } from './evidence.ts'
import {
  handleToolFailure,
  handleHttpResponse,
  syncEvidenceToKnowledgeGraph,
} from './runtimeIntegration.ts'
import {
  processToolFailure,
  autoDetectWaf,
  ingestEvidenceToGraph,
  buildAttackStateFromGraph,
  planNextActions,
  shouldGateBlindFinding,
  formatIntelligenceContext,
  getKnowledgeGraph,
  resetIntelligenceInstances,
} from './intelligenceMiddleware.ts'
import {
  createDefaultIntelligenceState,
  readIntelligenceState,
  ensureIntelligenceState,
  writeIntelligenceState,
  updateWafProfile,
  recordToolFailureReason,
} from './intelligenceState.ts'
import { KnowledgeGraph } from './knowledgeGraph.ts'
import type { FindingEntry, EvidenceEntry } from './evidence.ts'

// ---------------------------------------------------------------------------
// Intelligence State persistence
// ---------------------------------------------------------------------------

test('createDefaultIntelligenceState returns empty baseline', () => {
  const state = createDefaultIntelligenceState()
  assert.equal(state.schemaVersion, 1)
  assert.equal(state.wafProfile, null)
  assert.equal(state.lastMctsPlan, null)
  assert.equal(state.toolFailureCount, 0)
  assert.equal(state.pendingBlindVerifications, 0)
})

test('ensureIntelligenceState creates file on first call', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-intel-state-'))
  await initializeNetRunnerProject({ cwd, workflowId: 'web-app-testing' })

  const state = await readIntelligenceState(cwd)
  assert.ok(state)
  assert.equal(state.schemaVersion, 1)
})

test('writeIntelligenceState persists and readIntelligenceState loads', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-intel-rw-'))
  await initializeNetRunnerProject({ cwd, workflowId: 'web-app-testing' })

  const state = await ensureIntelligenceState(cwd)
  state.toolFailureCount = 5
  state.toolFailureReasons['waf-blocked'] = 3
  await writeIntelligenceState(cwd, state)

  const loaded = await readIntelligenceState(cwd)
  assert.ok(loaded)
  assert.equal(loaded.toolFailureCount, 5)
  assert.equal(loaded.toolFailureReasons['waf-blocked'], 3)
})

test('updateWafProfile persists WAF detection', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-intel-waf-'))
  await initializeNetRunnerProject({ cwd, workflowId: 'web-app-testing' })

  await updateWafProfile(cwd, {
    detected: true,
    wafType: 'cloudflare',
    wafName: 'Cloudflare',
    confidence: 0.88,
    matchedSignatures: ['header:cf-ray'],
    detectedAt: new Date().toISOString(),
  })

  const state = await readIntelligenceState(cwd)
  assert.ok(state?.wafProfile)
  assert.equal(state.wafProfile.wafType, 'cloudflare')
  assert.equal(state.wafProfile.confidence, 0.88)
})

test('recordToolFailureReason increments counters', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-intel-fail-'))
  await initializeNetRunnerProject({ cwd, workflowId: 'web-app-testing' })

  await recordToolFailureReason(cwd, 'waf-blocked')
  await recordToolFailureReason(cwd, 'waf-blocked')
  await recordToolFailureReason(cwd, 'timeout')

  const state = await readIntelligenceState(cwd)
  assert.ok(state)
  assert.equal(state.toolFailureCount, 3)
  assert.equal(state.toolFailureReasons['waf-blocked'], 2)
  assert.equal(state.toolFailureReasons['timeout'], 1)
})

// ---------------------------------------------------------------------------
// Tool failure middleware
// ---------------------------------------------------------------------------

test('processToolFailure classifies WAF block and produces retry guidance', () => {
  const result = processToolFailure({
    attempt: 0,
    payload: '<script>alert(1)</script>',
    statusCode: 403,
    responseBody: 'Attention Required! | Cloudflare',
    responseHeaders: { 'cf-ray': '123abc', server: 'cloudflare' },
  })

  assert.equal(result.analysis.reason, 'waf-blocked')
  assert.ok(result.guidance.shouldRetry)
  assert.ok(result.agentContext.includes('[Intelligence: Failure Analysis]'))
  assert.ok(result.agentContext.includes('waf-blocked'))
})

test('processToolFailure classifies rate-limit', () => {
  const result = processToolFailure({
    attempt: 0,
    payload: null,
    statusCode: 429,
    responseBody: 'Too many requests',
  })

  assert.equal(result.analysis.reason, 'rate-limited')
  assert.ok(result.guidance.shouldRetry)
  assert.ok(result.guidance.delayMs > 0)
})

test('processToolFailure classifies timeout', () => {
  const result = processToolFailure({
    attempt: 0,
    payload: null,
    error: { message: 'ETIMEDOUT' },
  })

  assert.equal(result.analysis.reason, 'timeout')
  assert.ok(result.guidance.shouldRetry)
})

test('processToolFailure respects max retries', () => {
  const result = processToolFailure({
    attempt: 3,
    payload: null,
    statusCode: 429,
  })

  assert.equal(result.guidance.shouldRetry, false)
  assert.ok(result.agentContext.includes('max attempts reached'))
})

test('processToolFailureWithPersistence records to intelligence state', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-intel-pfail-'))
  await initializeNetRunnerProject({ cwd, workflowId: 'web-app-testing' })

  const result = await handleToolFailure(cwd, {
    attempt: 0,
    payload: null,
    statusCode: 429,
    responseBody: 'Rate limit exceeded',
  })

  assert.ok(result)
  assert.equal(result.analysis.reason, 'rate-limited')

  const state = await readIntelligenceState(cwd)
  assert.ok(state)
  assert.equal(state.toolFailureCount, 1)
  assert.equal(state.toolFailureReasons['rate-limited'], 1)
})

test('handleToolFailure returns null when no engagement exists', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-intel-noproj-'))
  const result = await handleToolFailure(cwd, {
    attempt: 0,
    payload: null,
    statusCode: 500,
  })
  assert.equal(result, null)
})

// ---------------------------------------------------------------------------
// WAF auto-detection
// ---------------------------------------------------------------------------

test('autoDetectWaf detects Cloudflare from response headers', () => {
  const result = autoDetectWaf(
    403,
    { 'cf-ray': '123abc', server: 'cloudflare' },
    'Attention Required!',
  )

  assert.equal(result.isNew, true)
  assert.equal(result.detection.detected, true)
  assert.equal(result.detection.wafType, 'cloudflare')
  assert.ok(result.agentContext.includes('Cloudflare'))
})

test('autoDetectWaf returns cached result when profile exists', () => {
  const result = autoDetectWaf(
    200,
    {},
    'ok',
    undefined,
    {
      detected: true,
      wafType: 'akamai',
      wafName: 'Akamai',
      confidence: 0.75,
      matchedSignatures: ['header:akamai'],
      detectedAt: new Date().toISOString(),
    },
  )

  assert.equal(result.isNew, false)
  assert.ok(result.agentContext.includes('Previously detected'))
  assert.ok(result.agentContext.includes('Akamai'))
})

test('autoDetectWaf returns no-WAF for clean response', () => {
  const result = autoDetectWaf(200, { server: 'nginx' }, 'ok')
  assert.equal(result.isNew, false)
  assert.equal(result.detection.detected, false)
})

test('handleHttpResponse persists WAF detection', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-intel-wafhttp-'))
  await initializeNetRunnerProject({ cwd, workflowId: 'web-app-testing' })

  const result = await handleHttpResponse(
    cwd,
    403,
    { 'cf-ray': '123abc', server: 'cloudflare' },
    'Attention Required!',
  )

  assert.ok(result)
  assert.equal(result.isNew, true)
  assert.equal(result.detection.wafType, 'cloudflare')

  const state = await readIntelligenceState(cwd)
  assert.ok(state?.wafProfile)
  assert.equal(state.wafProfile.wafType, 'cloudflare')
})

test('handleHttpResponse returns null when no engagement exists', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-intel-wafnoproj-'))
  const result = await handleHttpResponse(cwd, 200, {}, 'ok')
  assert.equal(result, null)
})

// ---------------------------------------------------------------------------
// Knowledge graph ↔ evidence
// ---------------------------------------------------------------------------

test('ingestEvidenceToGraph imports finding entries as vulnerabilities', () => {
  const graph = new KnowledgeGraph()
  const entries: EvidenceEntry[] = [
    {
      id: 'f-1',
      createdAt: new Date().toISOString(),
      type: 'finding',
      title: 'SQL Injection in /login',
      severity: 'high',
      evidence: 'Parameter "user" is injectable',
    } as FindingEntry,
  ]

  const { imported } = ingestEvidenceToGraph(entries, graph)
  assert.equal(imported, 1)
  assert.equal(graph.entityCount, 1)
  const vulns = graph.getEntitiesByType('vulnerability')
  assert.equal(vulns.length, 1)
  assert.equal(vulns[0]!.properties['severity'], 'high')
})

test('syncEvidenceToKnowledgeGraph persists stats', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-intel-kgevidence-'))
  await initializeNetRunnerProject({ cwd, workflowId: 'web-app-testing' })

  await appendEvidenceEntry(cwd, {
    type: 'finding',
    title: 'XSS in search',
    severity: 'medium',
    evidence: 'Reflected input in response',
  })

  resetIntelligenceInstances()
  const result = await syncEvidenceToKnowledgeGraph(cwd)
  assert.ok(result)
  assert.ok(result.imported >= 1)

  const state = await readIntelligenceState(cwd)
  assert.ok(state)
  assert.ok((state.knowledgeGraphStats['totalEntities'] ?? 0) > 0)
})

test('syncEvidenceToKnowledgeGraph returns null when no engagement', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-intel-kgnoproj-'))
  const result = await syncEvidenceToKnowledgeGraph(cwd)
  assert.equal(result, null)
})

// ---------------------------------------------------------------------------
// MCTS planning from knowledge graph
// ---------------------------------------------------------------------------

test('buildAttackStateFromGraph creates state from graph entities', () => {
  const graph = new KnowledgeGraph()
  graph.addEntity('10.0.0.1', 'host', { ip: '10.0.0.1' })
  graph.addEntity('10.0.0.1:80', 'service', { port: 80, name: 'http' })
  graph.addRelation('runs-on', '10.0.0.1:80', '10.0.0.1')
  graph.addEntity('vuln-1', 'vulnerability', { severity: 'high', type: 'sqli' })
  graph.addRelation('has-vuln', '10.0.0.1', 'vuln-1')

  const state = buildAttackStateFromGraph('10.0.0.1', graph)
  assert.equal(state.target, '10.0.0.1')
  assert.equal(state.openPorts.size, 1)
  assert.ok(state.openPorts.has(80))
  assert.equal(state.vulnerabilities.length, 1)
  assert.equal(state.vulnerabilities[0]!.severity, 'high')
})

test('planNextActions produces ranked actions from graph state', () => {
  const graph = new KnowledgeGraph()
  graph.addEntity('10.0.0.1', 'host', { ip: '10.0.0.1' })
  graph.addEntity('10.0.0.1:80', 'service', { port: 80, name: 'http' })
  graph.addRelation('runs-on', '10.0.0.1:80', '10.0.0.1')

  const { result, agentContext } = planNextActions('10.0.0.1', 50, graph)
  assert.ok(result.actionRankings.length > 0)
  assert.ok(agentContext.includes('[Attack Path Analysis'))
  assert.ok(result.bestPath.length > 0)
})

test('planNextActions works with empty graph', () => {
  const graph = new KnowledgeGraph()
  const { result } = planNextActions('10.0.0.1', 50, graph)
  assert.ok(result.actionRankings.length > 0)
})

// ---------------------------------------------------------------------------
// Blind finding verification gate
// ---------------------------------------------------------------------------

test('shouldGateBlindFinding returns true for blind SQLi findings', () => {
  const finding: FindingEntry = {
    id: 'f-1',
    createdAt: new Date().toISOString(),
    type: 'finding',
    title: 'Time-based blind SQLi in /api/search',
    severity: 'high',
    evidence: 'SLEEP(5) caused 5-second delay',
  }
  assert.equal(shouldGateBlindFinding(finding), true)
})

test('shouldGateBlindFinding returns true for OOB findings', () => {
  const finding: FindingEntry = {
    id: 'f-2',
    createdAt: new Date().toISOString(),
    type: 'finding',
    title: 'SSRF via image parameter',
    severity: 'high',
    evidence: 'OOB callback received from target',
  }
  assert.equal(shouldGateBlindFinding(finding), true)
})

test('shouldGateBlindFinding returns false for non-blind findings', () => {
  const finding: FindingEntry = {
    id: 'f-3',
    createdAt: new Date().toISOString(),
    type: 'finding',
    title: 'Reflected XSS in search parameter',
    severity: 'medium',
    evidence: 'Payload reflected in response body',
  }
  assert.equal(shouldGateBlindFinding(finding), false)
})

test('shouldGateBlindFinding detects Log4Shell', () => {
  const finding: FindingEntry = {
    id: 'f-4',
    createdAt: new Date().toISOString(),
    type: 'finding',
    title: 'Log4Shell RCE via User-Agent',
    severity: 'critical',
    evidence: 'JNDI callback confirmed',
  }
  assert.equal(shouldGateBlindFinding(finding), true)
})

// ---------------------------------------------------------------------------
// Intelligence context formatting
// ---------------------------------------------------------------------------

test('formatIntelligenceContext shows empty state', () => {
  const state = createDefaultIntelligenceState()
  const ctx = formatIntelligenceContext(state)
  assert.ok(ctx.includes('[Intelligence State]'))
  assert.ok(ctx.includes('No intelligence data collected yet'))
  assert.ok(ctx.includes('[/Intelligence State]'))
})

test('formatIntelligenceContext shows WAF and failure data', () => {
  const state = createDefaultIntelligenceState()
  state.wafProfile = {
    detected: true,
    wafType: 'cloudflare',
    wafName: 'Cloudflare',
    confidence: 0.88,
    matchedSignatures: ['header:cf-ray'],
    detectedAt: '2024-01-01T00:00:00Z',
  }
  state.toolFailureCount = 5
  state.toolFailureReasons = { 'waf-blocked': 3, 'rate-limited': 2 }

  const ctx = formatIntelligenceContext(state)
  assert.ok(ctx.includes('Cloudflare'))
  assert.ok(ctx.includes('88%'))
  assert.ok(ctx.includes('Tool failures: 5'))
  assert.ok(ctx.includes('waf-blocked(3)'))
})

test('formatIntelligenceContext shows MCTS plan', () => {
  const state = createDefaultIntelligenceState()
  state.lastMctsPlan = {
    rankedActions: [
      { type: 'port-scan', name: 'Nmap Full Scan', agent: 'recon-specialist', visits: 40, confidence: 20 },
    ],
    bestPath: ['Nmap Full Scan', 'Nikto Web Scan'],
    totalIterations: 200,
    computedAt: '2024-01-01T00:00:00Z',
  }

  const ctx = formatIntelligenceContext(state)
  assert.ok(ctx.includes('MCTS plan'))
  assert.ok(ctx.includes('Nmap Full Scan'))
  assert.ok(ctx.includes('recon-specialist'))
})

test('formatIntelligenceContext shows knowledge graph stats', () => {
  const state = createDefaultIntelligenceState()
  state.knowledgeGraphStats = { totalEntities: 12, totalRelations: 8 }

  const ctx = formatIntelligenceContext(state)
  assert.ok(ctx.includes('Knowledge graph: 12 entities'))
  assert.ok(ctx.includes('8 relations'))
})

// ---------------------------------------------------------------------------
// End-to-end integration flow
// ---------------------------------------------------------------------------

test('full intelligence flow: init → WAF detect → failure → evidence → plan', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-intel-e2e-'))
  await initializeNetRunnerProject({ cwd, workflowId: 'web-app-testing' })

  // 1. WAF auto-detect on first HTTP response
  const wafResult = await handleHttpResponse(
    cwd, 403,
    { 'cf-ray': '123abc', server: 'cloudflare' },
    'Attention Required!',
  )
  assert.ok(wafResult)
  assert.equal(wafResult.isNew, true)

  // 2. Tool failure with WAF context
  const failResult = await handleToolFailure(cwd, {
    attempt: 0,
    payload: "' OR 1=1--",
    statusCode: 403,
    responseBody: 'Attention Required! | Cloudflare',
    responseHeaders: { 'cf-ray': '456def', server: 'cloudflare' },
  })
  assert.ok(failResult)
  assert.equal(failResult.analysis.reason, 'waf-blocked')

  // 3. Log a finding
  await appendEvidenceEntry(cwd, {
    type: 'finding',
    title: 'SQL Injection in /api/users',
    severity: 'high',
    evidence: 'Error-based SQLi confirmed with UNION SELECT',
  })

  // 4. Sync evidence to knowledge graph
  resetIntelligenceInstances()
  const kgResult = await syncEvidenceToKnowledgeGraph(cwd)
  assert.ok(kgResult)
  assert.ok(kgResult.imported >= 1)

  // 5. Verify final intelligence state
  const finalState = await readIntelligenceState(cwd)
  assert.ok(finalState)
  assert.ok(finalState.wafProfile?.detected)
  assert.equal(finalState.wafProfile?.wafType, 'cloudflare')
  assert.ok(finalState.toolFailureCount >= 1)
  assert.ok((finalState.knowledgeGraphStats['totalEntities'] ?? 0) > 0)
})
