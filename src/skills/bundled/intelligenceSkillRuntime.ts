import { getCwd } from '../../utils/cwd.js'
import { readEngagementManifest } from '../../security/engagement.js'
import { readEvidenceEntries } from '../../security/evidence.js'
import {
  formatIntelligenceContext,
  ingestEvidenceToGraphWithPersistence,
  planNextActionsWithPersistence,
  processToolFailure,
} from '../../security/intelligenceMiddleware.js'
import {
  detectWaf,
  formatWafGuidanceForAgent,
  type WafDetectionResult,
} from '../../security/wafDetection.js'
import {
  ensureIntelligenceState,
  readIntelligenceState,
} from '../../security/intelligenceState.js'
import {
  verifyResponseLengthDifferential,
  verifyTimeBased,
  type ResponseLengthVerification,
  type StatisticalVerification,
} from '../../security/statisticalVerifier.js'
import {
  formatOobGuidanceForAgent,
  OobVerificationTracker,
  type OobChannelType,
  type OobVulnType,
} from '../../security/oobVerification.js'

type ParsedHttpInput = {
  statusCode: number
  headers: Record<string, string>
  body: string
  cookies?: string
}

type ParsedFailureContext = {
  attempt: number
  payload: string | null
  error?: { message?: string; code?: string; statusCode?: number } | null
  responseBody?: string | null
  responseHeaders?: Record<string, string> | null
  statusCode?: number | null
}

type StatisticalInput = {
  metric: 'time' | 'length'
  url: string
  param: string
  payload: string
  baselineSamples: number[]
  payloadSamples: number[]
  expectedDelaySeconds?: number
}

type PersistedWafProfileView = {
  detected: boolean
  wafType: string
  wafName: string
  confidence: number
  matchedSignatures: string[]
}

type ParsedOobInput = {
  vulnType: OobVulnType
  url: string
  param: string
  channel?: OobChannelType
}

const OOB_VULN_TYPES: OobVulnType[] = [
  'blind-xxe',
  'blind-ssrf',
  'blind-rce',
  'blind-sqli',
  'blind-xss',
  'blind-ssti',
  'log4shell',
  'blind-deserialization',
]

const OOB_CHANNEL_TYPES: OobChannelType[] = ['http', 'dns', 'smtp', 'ftp', 'ldap']

function tryParseJson<T>(value: string): T | null {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{')) {
    return null
  }

  try {
    return JSON.parse(trimmed) as T
  } catch {
    return null
  }
}

function parseOobInput(args: string, fallbackUrl?: string | null): ParsedOobInput | null {
  const json = tryParseJson<{
    vulnType?: OobVulnType
    url?: string
    param?: string
    channel?: OobChannelType
  }>(args)

  if (json?.vulnType) {
    return {
      vulnType: json.vulnType,
      url: json.url ?? fallbackUrl ?? 'unknown',
      param: json.param ?? 'injection-point',
      channel: json.channel,
    }
  }

  const vulnType = inferOobVulnType(args)
  if (!vulnType) {
    return null
  }

  return {
    vulnType,
    url: extractLabeledValue(args, ['url', 'target']) ?? fallbackUrl ?? 'unknown',
    param: extractLabeledValue(args, ['param', 'parameter']) ?? 'injection-point',
    channel: parseOobChannel(extractLabeledValue(args, ['channel'])),
  }
}

function extractLabeledValue(input: string, labels: string[]): string | null {
  const escaped = labels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(?:^|\\n)\\s*(?:${escaped.join('|')})\\s*[:=]\\s*(.+)$`, 'im')
  const match = input.match(regex)
  return match?.[1]?.trim() ?? null
}

function parseNumberList(raw: string | null): number[] {
  if (!raw) {
    return []
  }

  return raw
    .split(/[\s,]+/)
    .map(token => Number(token.trim()))
    .filter(value => Number.isFinite(value))
}

function parseOptionalNumber(raw: string | null): number | undefined {
  if (!raw) {
    return undefined
  }
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function inferOobVulnType(input: string): OobVulnType | null {
  const normalized = input.toLowerCase()
  for (const vulnType of OOB_VULN_TYPES) {
    if (normalized.includes(vulnType)) {
      return vulnType
    }
  }

  if (normalized.includes('xxe')) return 'blind-xxe'
  if (normalized.includes('ssrf')) return 'blind-ssrf'
  if (normalized.includes('rce') || normalized.includes('command injection')) return 'blind-rce'
  if (normalized.includes('sqli') || normalized.includes('sql injection')) return 'blind-sqli'
  if (normalized.includes('xss')) return 'blind-xss'
  if (normalized.includes('ssti')) return 'blind-ssti'
  if (normalized.includes('log4shell')) return 'log4shell'
  if (normalized.includes('deserialization')) return 'blind-deserialization'

  return null
}

function parseOobChannel(raw: string | null): OobChannelType | undefined {
  if (!raw) {
    return undefined
  }
  const normalized = raw.trim().toLowerCase()
  return OOB_CHANNEL_TYPES.find(channel => channel === normalized)
}

function parseHeaderLines(input: string): Record<string, string> {
  const headers: Record<string, string> = {}
  const reservedKeys = new Set([
    'status',
    'status_code',
    'statuscode',
    'body',
    'cookies',
    'cookie',
    'baseline',
    'baseline_samples',
    'payload_samples',
    'payload',
    'metric',
    'url',
    'param',
    'parameter',
    'attempt',
    'error',
    'error_message',
    'iterations',
    'target',
    'expected_delay_seconds',
  ])

  for (const line of input.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex <= 0) {
      continue
    }
    const key = line.slice(0, separatorIndex).trim()
    if (!key) {
      continue
    }
    if (reservedKeys.has(key.toLowerCase())) {
      continue
    }
    headers[key.toLowerCase()] = line.slice(separatorIndex + 1).trim()
  }

  return headers
}

function parseHttpInput(input: string): ParsedHttpInput | null {
  const normalized = input.replace(/\r\n/g, '\n')
  const httpStart = normalized.search(/HTTP\/(?:1\.\d|2)\s+\d{3}\b/)
  if (httpStart !== -1) {
    const candidate = normalized.slice(httpStart)
    const separatorIndex = candidate.indexOf('\n\n')
    const head = separatorIndex === -1 ? candidate : candidate.slice(0, separatorIndex)
    const body = separatorIndex === -1 ? '' : candidate.slice(separatorIndex + 2).trim()
    const lines = head.split('\n').filter(Boolean)
    const statusMatch = lines[0]?.match(/^HTTP\/(?:1\.\d|2)\s+(\d{3})\b/)
    if (!statusMatch) {
      return null
    }

    const headers: Record<string, string> = {}
    for (const line of lines.slice(1)) {
      const separator = line.indexOf(':')
      if (separator <= 0) {
        continue
      }
      headers[line.slice(0, separator).trim().toLowerCase()] = line
        .slice(separator + 1)
        .trim()
    }

    return {
      statusCode: Number(statusMatch[1]),
      headers,
      body,
      cookies: headers['set-cookie'],
    }
  }

  const statusCode = Number(
    extractLabeledValue(normalized, ['status', 'status_code', 'statuscode']) ?? '',
  )
  const headers = parseHeaderLines(normalized)
  const body = extractLabeledValue(normalized, ['body']) ?? normalized.trim()
  const cookies = extractLabeledValue(normalized, ['cookies', 'cookie']) ?? headers['set-cookie']

  if (!Number.isFinite(statusCode) || statusCode < 100 || statusCode > 599) {
    return null
  }

  return {
    statusCode,
    headers,
    body,
    cookies,
  }
}

function parseFailureContext(args: string): ParsedFailureContext | null {
  const json = tryParseJson<{
    attempt?: number
    payload?: string | null
    error?: { message?: string; code?: string; statusCode?: number } | null
    responseBody?: string | null
    responseHeaders?: Record<string, string> | null
    statusCode?: number | null
  }>(args)

  if (json) {
    return {
      attempt: json.attempt ?? 0,
      payload: json.payload ?? null,
      error: json.error ?? undefined,
      responseBody: json.responseBody ?? null,
      responseHeaders: json.responseHeaders ?? null,
      statusCode: json.statusCode ?? json.error?.statusCode ?? null,
    }
  }

  const http = parseHttpInput(args)
  const attemptValue = Number(extractLabeledValue(args, ['attempt']) ?? '0')
  const errorMessage = extractLabeledValue(args, ['error', 'error_message'])
  const payload = extractLabeledValue(args, ['payload'])

  if (!http && !errorMessage && !args.trim()) {
    return null
  }

  return {
    attempt: Number.isFinite(attemptValue) ? attemptValue : 0,
    payload: payload ?? null,
    error: errorMessage || http
      ? {
          message: errorMessage ?? undefined,
          statusCode: http?.statusCode,
        }
      : undefined,
    responseBody: http?.body ?? (args.trim() || null),
    responseHeaders: http?.headers ?? null,
    statusCode: http?.statusCode ?? null,
  }
}

function parseStatisticalInput(args: string): StatisticalInput | null {
  const json = tryParseJson<{
    metric?: 'time' | 'length'
    url?: string
    param?: string
    payload?: string
    baseline?: number[]
    baselineSamples?: number[]
    payloadSamples?: number[]
    payloadMeasurements?: number[]
    expectedDelaySeconds?: number
  }>(args)

  if (json) {
    const baselineSamples = json.baselineSamples ?? json.baseline ?? []
    const payloadSamples = json.payloadSamples ?? json.payloadMeasurements ?? []
    if (baselineSamples.length === 0 || payloadSamples.length === 0) {
      return null
    }
    return {
      metric: json.metric ?? 'time',
      url: json.url ?? 'unknown',
      param: json.param ?? 'unknown',
      payload: json.payload ?? '(payload omitted)',
      baselineSamples,
      payloadSamples,
      expectedDelaySeconds: json.expectedDelaySeconds,
    }
  }

  const baselineSamples = parseNumberList(
    extractLabeledValue(args, ['baseline', 'baseline_samples']),
  )
  const payloadSamples = parseNumberList(
    extractLabeledValue(args, ['payload_samples', 'measurements', 'payload_measurements']),
  )

  if (baselineSamples.length === 0 || payloadSamples.length === 0) {
    return null
  }

  const metricRaw = (extractLabeledValue(args, ['metric']) ?? '').toLowerCase()
  const metric = metricRaw.includes('length') || metricRaw.includes('boolean')
    ? 'length'
    : 'time'

  return {
    metric,
    url: extractLabeledValue(args, ['url']) ?? 'unknown',
    param: extractLabeledValue(args, ['param', 'parameter']) ?? 'unknown',
    payload: extractLabeledValue(args, ['payload']) ?? '(payload omitted)',
    baselineSamples,
    payloadSamples,
    expectedDelaySeconds: Number(
      extractLabeledValue(args, ['expected_delay_seconds']) ?? '',
    ) || undefined,
  }
}

function formatPersistedWafResult(result: WafDetectionResult): string {
  return formatWafGuidanceForAgent(result)
}

function formatStoredWafProfile(profile: PersistedWafProfileView): string {
  const lines = [
    `[WAF Detection] ${profile.wafName} detected (confidence: ${(profile.confidence * 100).toFixed(0)}%).`,
    `Matched signatures: ${profile.matchedSignatures.join(', ') || '(persisted profile, signatures unavailable)'}.`,
    '',
    'This result was loaded from persisted intelligence state for the current engagement.',
  ]
  return lines.join('\n')
}

function formatStatisticalResult(
  result: StatisticalVerification | ResponseLengthVerification,
  metric: 'time' | 'length',
): string {
  const lines = ['[Statistical Verification]']

  if ('details' in result) {
    lines.push(
      `Mode: ${metric}`,
      `Confirmed: ${result.isConfirmed ? 'yes' : 'no'}`,
      `Confidence: ${(result.confidenceScore * 100).toFixed(0)}%`,
      `p-value: ${result.pValue}`,
    )
    for (const detail of result.details) {
      lines.push(`${detail.label}: ${detail.value}`)
    }
    lines.push(`Recommendation: ${result.recommendation}`)
    return lines.join('\n')
  }

  lines.push(
    `Mode: ${metric}`,
    `Confirmed: ${result.isConfirmed ? 'yes' : 'no'}`,
    `Confidence: ${(result.confidenceScore * 100).toFixed(0)}%`,
    `p-value: ${result.pValue}`,
    `baseline_mean: ${result.meanBaseline}`,
    `payload_mean: ${result.meanPayload}`,
    `Recommendation: ${result.recommendation}`,
  )
  return lines.join('\n')
}

function formatEngagementFallbackMessage(feature: string): string {
  return `${feature} is code-backed, but no active .netrunner engagement is available in the current working directory. Initialize an engagement or provide explicit structured input.`
}

export async function buildFeedbackLoopSkillContent(args: string): Promise<string> {
  const cwd = getCwd()
  const manifest = await readEngagementManifest(cwd)
  const state = await ensureIntelligenceState(cwd)
  const parsed = parseFailureContext(args)

  if (!parsed) {
    return [
      '# Feedback Loop Engine',
      '',
      '## Computed result',
      'No structured failure context could be derived from the provided input.',
      '',
      '## Current intelligence state',
      formatIntelligenceContext(state),
      '',
      '## Expected input',
      'Provide a raw HTTP response, or structured input with status/body/headers/payload so the engine can classify the failure and produce retry guidance.',
      ...(manifest ? [] : ['', formatEngagementFallbackMessage('Feedback Loop Engine')]),
    ].join('\n')
  }

  const result = processToolFailure(parsed)

  return [
    '# Feedback Loop Engine',
    '',
    '## Computed result',
    result.agentContext,
    '',
    '## Agent instruction',
    result.guidance.agentInstruction,
    '',
    '## Current intelligence state',
    formatIntelligenceContext(state),
  ].join('\n')
}

export async function buildOobVerificationSkillContent(args: string): Promise<string> {
  const cwd = getCwd()
  const manifest = await readEngagementManifest(cwd)
  const state = await ensureIntelligenceState(cwd)
  const input = parseOobInput(args, manifest?.targets[0] ?? null)

  if (!input) {
    return [
      '# Out-of-Band Verification',
      '',
      '## Computed result',
      'No blind-vulnerability type could be derived from the provided input.',
      '',
      '## Expected input',
      'Provide a vulnerability type such as blind-xxe, blind-ssrf, blind-rce, blind-sqli, blind-xss, blind-ssti, log4shell, or blind-deserialization, plus optional url/param/channel fields.',
      '',
      '## Current intelligence state',
      formatIntelligenceContext(state),
      ...(manifest ? [] : ['', formatEngagementFallbackMessage('Out-of-Band Verification')]),
    ].join('\n')
  }

  const tracker = new OobVerificationTracker()
  const payloadSet = tracker.generatePayloads(
    input.vulnType,
    input.url,
    input.param,
    input.channel,
  )
  const stats = tracker.getStats()

  return [
    '# Out-of-Band Verification',
    '',
    '## Computed result',
    formatOobGuidanceForAgent(payloadSet),
    '',
    '## Tracker state',
    `Generated verifications: ${stats.total}`,
    `Pending: ${stats.pending}`,
    `Confirmed: ${stats.confirmed}`,
    `Timed out: ${stats.timeout}`,
    '',
    '## Current intelligence state',
    formatIntelligenceContext(state),
  ].join('\n')
}

export async function buildWafDetectionSkillContent(args: string): Promise<string> {
  const cwd = getCwd()
  const manifest = await readEngagementManifest(cwd)
  const state = await ensureIntelligenceState(cwd)
  const parsed = parseHttpInput(args)

  if (!parsed) {
    if (state.wafProfile?.detected) {
      return [
        '# WAF Detection & Bypass',
        '',
        '## Computed result',
        formatStoredWafProfile(state.wafProfile),
        '',
        '## Current intelligence state',
        formatIntelligenceContext(state),
      ].join('\n')
    }

    return [
      '# WAF Detection & Bypass',
      '',
      '## Computed result',
      'No raw HTTP response was provided, and no persisted WAF profile exists for the current engagement.',
      '',
      '## Expected input',
      'Provide a full HTTP response or structured status/header/body fields to run code-backed WAF fingerprinting.',
      ...(manifest ? [] : ['', formatEngagementFallbackMessage('WAF Detection & Bypass')]),
    ].join('\n')
  }

  const result = detectWaf(
    parsed.statusCode,
    parsed.headers,
    parsed.body,
    parsed.cookies,
  )

  return [
    '# WAF Detection & Bypass',
    '',
    '## Computed result',
    formatWafGuidanceForAgent(result),
    '',
    '## Current intelligence state',
    formatIntelligenceContext(state),
  ].join('\n')
}

export async function buildMctsPlanningSkillContent(args: string): Promise<string> {
  const cwd = getCwd()
  const manifest = await readEngagementManifest(cwd)
  const state = await ensureIntelligenceState(cwd)
  const json = tryParseJson<{ target?: string; iterations?: number }>(args)
  const target = json?.target
    ?? extractLabeledValue(args, ['target'])
    ?? manifest?.targets[0]
    ?? (args.trim() && !args.includes('\n') ? args.trim() : null)
  const labeledIterations = parseOptionalNumber(
    extractLabeledValue(args, ['iterations']),
  )
  const iterations = json?.iterations ?? labeledIterations

  if (!target) {
    return [
      '# MCTS Attack Path Planning',
      '',
      '## Computed result',
      'No target could be resolved from the active engagement or the provided input.',
      '',
      '## Current intelligence state',
      formatIntelligenceContext(state),
      ...(manifest ? [] : ['', formatEngagementFallbackMessage('MCTS Attack Path Planning')]),
    ].join('\n')
  }

  const entries = await readEvidenceEntries(cwd)
  const syncResult = entries.length > 0
    ? await ingestEvidenceToGraphWithPersistence(cwd, entries)
    : { imported: 0 }
  const plan = await planNextActionsWithPersistence(cwd, target, iterations)
  const nextState = (await readIntelligenceState(cwd)) ?? state

  return [
    '# MCTS Attack Path Planning',
    '',
    '## Computed result',
    plan.agentContext,
    '',
    '## Knowledge graph sync',
    `Imported entries: ${syncResult.imported}`,
    '',
    '## Current intelligence state',
    formatIntelligenceContext(nextState),
  ].join('\n')
}

export async function buildStatisticalVerificationSkillContent(args: string): Promise<string> {
  const cwd = getCwd()
  const state = await ensureIntelligenceState(cwd)
  const input = parseStatisticalInput(args)

  if (!input) {
    return [
      '# Statistical Verification',
      '',
      '## Computed result',
      'No baseline/payload sample sets could be parsed from the provided input.',
      '',
      '## Expected input',
      'Provide JSON or labeled fields containing baseline samples and payload samples. Example labels: baseline:, payload_samples:, metric:, url:, param:, payload:.',
      '',
      '## Current intelligence state',
      formatIntelligenceContext(state),
    ].join('\n')
  }

  const result = input.metric === 'length'
    ? verifyResponseLengthDifferential(
        input.url,
        input.param,
        input.payload,
        input.baselineSamples,
        input.payloadSamples,
      )
    : verifyTimeBased(
        input.url,
        input.param,
        input.payload,
        input.baselineSamples,
        input.payloadSamples,
        {
          expectedDelaySeconds: input.expectedDelaySeconds,
        },
      )

  return [
    '# Statistical Verification',
    '',
    '## Computed result',
    formatStatisticalResult(result, input.metric),
    '',
    '## Current intelligence state',
    formatIntelligenceContext(state),
  ].join('\n')
}
