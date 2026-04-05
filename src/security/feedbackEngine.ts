/**
 * Feedback Loop Engine — failure classification + payload mutation + intelligent retry guidance.
 *
 * Inspired by AutoRedTeam-Orchestrator's feedback engine but redesigned for Net-Runner's
 * LLM-native architecture. Instead of executing retries directly, this module classifies
 * failures, selects mutation strategies, and produces structured guidance that agents use
 * to adapt their next action.
 *
 * Key capabilities:
 * - Classify tool/HTTP failures into actionable categories (WAF, rate-limit, auth, etc.)
 * - Select payload mutation strategies ranked by priority
 * - Track success/failure history for adaptive strategy selection
 * - Produce structured retry guidance for agent consumption
 */

// ---------------------------------------------------------------------------
// Failure reasons
// ---------------------------------------------------------------------------

export type FailureReason =
  | 'timeout'
  | 'rate-limited'
  | 'connection-error'
  | 'dns-error'
  | 'waf-blocked'
  | 'ids-detected'
  | 'captcha-required'
  | 'ip-blocked'
  | 'payload-filtered'
  | 'encoding-error'
  | 'content-type-mismatch'
  | 'false-positive'
  | 'verification-failed'
  | 'server-error'
  | 'not-found'
  | 'auth-required'
  | 'unknown'

// ---------------------------------------------------------------------------
// Adjustment types and strategies
// ---------------------------------------------------------------------------

export type AdjustmentType =
  | 'encoding'
  | 'delay'
  | 'proxy'
  | 'payload-mutation'
  | 'protocol'
  | 'header'
  | 'concurrency'
  | 'user-agent'
  | 'method'
  | 'chunked'

export type AdjustmentStrategy = {
  name: string
  type: AdjustmentType
  description: string
  applicableReasons: FailureReason[]
  priority: number
  maxAttempts: number
  params: Record<string, unknown>
}

export type AdjustmentAction = {
  strategy: AdjustmentStrategy
  params: Record<string, unknown>
  attempt: number
}

// ---------------------------------------------------------------------------
// Failure analysis
// ---------------------------------------------------------------------------

export type FailureAnalysis = {
  reason: FailureReason
  confidence: number
  description: string
  evidence: string[]
  suggestions: string[]
}

// ---------------------------------------------------------------------------
// Retry guidance (what agents consume)
// ---------------------------------------------------------------------------

export type RetryGuidance = {
  shouldRetry: boolean
  analysis: FailureAnalysis
  recommendedStrategies: AdjustmentStrategy[]
  mutatedPayload: string | null
  delayMs: number
  headerOverrides: Record<string, string>
  agentInstruction: string
}

// ---------------------------------------------------------------------------
// Built-in WAF detection patterns (ported from ART failure_analyzer.py)
// ---------------------------------------------------------------------------

const WAF_PATTERNS: Record<string, RegExp[]> = {
  cloudflare: [/cloudflare/i, /cf-ray/i, /cf-cache-status/i, /attention required/i, /checking your browser/i],
  akamai: [/akamai/i, /akamaighost/i, /ak_bmsc/i, /reference #\d+\.\d+\.\d+/i],
  imperva: [/incapsula/i, /visid_incap/i, /incap_ses/i, /request unsuccessful/i],
  fortinet: [/fortigate/i, /fortiweb/i, /\.fgd_icon/i],
  f5_bigip: [/bigip/i, /ts[a-z0-9]{8,}=/i, /f5-ltm/i],
  modsecurity: [/mod_security/i, /modsecurity/i, /owasp.*crs/i, /not acceptable/i],
  aws_waf: [/awswaf/i, /x-amzn-requestid/i, /request blocked/i],
  generic: [/access denied/i, /request blocked/i, /forbidden/i, /security violation/i, /attack detected/i, /blocked by/i, /malicious request/i],
}

const RATE_LIMIT_PATTERNS: RegExp[] = [
  /rate limit/i, /too many requests/i, /retry-after/i,
  /x-ratelimit/i, /x-rate-limit/i, /quota exceeded/i, /throttl/i, /slow down/i,
]

const CAPTCHA_PATTERNS: RegExp[] = [
  /captcha/i, /recaptcha/i, /hcaptcha/i, /g-recaptcha/i,
  /verify.*human/i, /robot.*check/i, /challenge/i,
]

const AUTH_PATTERNS: RegExp[] = [
  /unauthorized/i, /login.*required/i, /authentication.*required/i,
  /www-authenticate/i, /please.*log.*in/i, /session.*expired/i,
]

const IP_BLOCK_PATTERNS: RegExp[] = [
  /your ip has been blocked/i,
  /your ip address has been blocked/i,
  /ip address blocked/i,
  /ip blocked/i,
  /blocked your ip/i,
  /banned your ip/i,
]

// ---------------------------------------------------------------------------
// Built-in strategies (ported + enhanced from ART strategies.py)
// ---------------------------------------------------------------------------

const WAF_ENCODING_STRATEGIES: AdjustmentStrategy[] = [
  {
    name: 'url-double-encode',
    type: 'encoding',
    description: 'Double URL-encode payload to bypass WAF pattern matching.',
    applicableReasons: ['waf-blocked', 'payload-filtered'],
    priority: 10,
    maxAttempts: 2,
    params: { encoding: 'double-url' },
  },
  {
    name: 'unicode-encode',
    type: 'encoding',
    description: 'Unicode-encode special characters to evade signature matching.',
    applicableReasons: ['waf-blocked', 'payload-filtered'],
    priority: 9,
    maxAttempts: 2,
    params: { encoding: 'unicode' },
  },
  {
    name: 'hex-encode',
    type: 'encoding',
    description: 'Hex-encode payload characters.',
    applicableReasons: ['waf-blocked', 'payload-filtered'],
    priority: 8,
    maxAttempts: 2,
    params: { encoding: 'hex' },
  },
  {
    name: 'mixed-case',
    type: 'payload-mutation',
    description: 'Randomize character casing to bypass case-sensitive filters.',
    applicableReasons: ['waf-blocked', 'payload-filtered'],
    priority: 7,
    maxAttempts: 3,
    params: { mutation: 'case-toggle' },
  },
  {
    name: 'inline-comment',
    type: 'payload-mutation',
    description: 'Insert SQL inline comments (/**/) between keywords.',
    applicableReasons: ['waf-blocked', 'payload-filtered'],
    priority: 6,
    maxAttempts: 2,
    params: { mutation: 'inline-comment' },
  },
  {
    name: 'space-substitute',
    type: 'payload-mutation',
    description: 'Replace spaces with alternative whitespace (/**/, %09, %0a, +).',
    applicableReasons: ['waf-blocked', 'payload-filtered'],
    priority: 5,
    maxAttempts: 3,
    params: { mutation: 'space-substitute' },
  },
]

const RATE_LIMIT_STRATEGIES: AdjustmentStrategy[] = [
  {
    name: 'exponential-backoff',
    type: 'delay',
    description: 'Exponential backoff with jitter to respect rate limits.',
    applicableReasons: ['rate-limited', 'timeout'],
    priority: 10,
    maxAttempts: 5,
    params: { baseDelayMs: 1000, maxDelayMs: 30_000, multiplier: 2 },
  },
  {
    name: 'reduce-concurrency',
    type: 'concurrency',
    description: 'Halve concurrency to reduce server load.',
    applicableReasons: ['rate-limited', 'server-error'],
    priority: 8,
    maxAttempts: 3,
    params: { factor: 0.5, minConcurrent: 1 },
  },
  {
    name: 'add-jitter',
    type: 'delay',
    description: 'Add random delay jitter between requests.',
    applicableReasons: ['rate-limited', 'ids-detected'],
    priority: 7,
    maxAttempts: 5,
    params: { minJitterMs: 500, maxJitterMs: 3000 },
  },
]

const HEADER_STRATEGIES: AdjustmentStrategy[] = [
  {
    name: 'rotate-user-agent',
    type: 'user-agent',
    description: 'Switch to a different browser User-Agent string.',
    applicableReasons: ['waf-blocked', 'ip-blocked'],
    priority: 8,
    maxAttempts: 5,
    params: { pool: 'browser' },
  },
  {
    name: 'add-forwarded-for',
    type: 'header',
    description: 'Add X-Forwarded-For header with a rotated IP.',
    applicableReasons: ['ip-blocked'],
    priority: 7,
    maxAttempts: 3,
    params: { header: 'X-Forwarded-For', valueType: 'random-ip' },
  },
  {
    name: 'content-type-change',
    type: 'header',
    description: 'Try alternative Content-Type headers.',
    applicableReasons: ['content-type-mismatch', 'waf-blocked'],
    priority: 6,
    maxAttempts: 3,
    params: { contentTypes: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'] },
  },
  {
    name: 'add-origin-referer',
    type: 'header',
    description: 'Add Origin and Referer headers matching the target domain.',
    applicableReasons: ['waf-blocked'],
    priority: 5,
    maxAttempts: 2,
    params: { headers: ['Origin', 'Referer'] },
  },
]

const METHOD_STRATEGIES: AdjustmentStrategy[] = [
  {
    name: 'method-override',
    type: 'method',
    description: 'Use X-HTTP-Method-Override to change the effective HTTP method.',
    applicableReasons: ['waf-blocked'],
    priority: 5,
    maxAttempts: 3,
    params: { methods: ['POST', 'PUT', 'PATCH'] },
  },
  {
    name: 'chunked-transfer',
    type: 'chunked',
    description: 'Use chunked Transfer-Encoding to split payload across chunks.',
    applicableReasons: ['waf-blocked', 'payload-filtered'],
    priority: 6,
    maxAttempts: 2,
    params: { chunkSize: 10 },
  },
]

const ALL_STRATEGIES: AdjustmentStrategy[] = [
  ...WAF_ENCODING_STRATEGIES,
  ...RATE_LIMIT_STRATEGIES,
  ...HEADER_STRATEGIES,
  ...METHOD_STRATEGIES,
]

// ---------------------------------------------------------------------------
// Payload mutator
// ---------------------------------------------------------------------------

const SPACE_SUBSTITUTES = ['/**/', '%09', '%0a', '%0d', '+']
const SQL_KEYWORDS = ['SELECT', 'UNION', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'UPDATE', 'DELETE', 'DROP']

export function mutatePayload(payload: string, mutation: string): string {
  switch (mutation) {
    case 'case-toggle':
      return Array.from(payload).map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join('')

    case 'inline-comment': {
      let result = payload
      for (const kw of SQL_KEYWORDS) {
        result = result.split(kw).join(`${kw}/**/`)
        result = result.split(kw.toLowerCase()).join(`${kw.toLowerCase()}/**/`)
      }
      return result
    }

    case 'space-substitute': {
      const sub = SPACE_SUBSTITUTES[Math.floor(Math.random() * SPACE_SUBSTITUTES.length)]!
      return payload.split(' ').join(sub)
    }

    case 'concat-break': {
      if (payload.length > 4) {
        const mid = Math.floor(payload.length / 2)
        return `'${payload.slice(0, mid)}'+'${payload.slice(mid)}'`
      }
      return payload
    }

    default:
      return payload
  }
}

export function encodePayload(payload: string, encoding: string): string {
  switch (encoding) {
    case 'double-url':
      return encodeURIComponent(encodeURIComponent(payload))

    case 'unicode':
      return Array.from(payload).map(c => {
        if (/[a-zA-Z0-9 .,]/.test(c)) return c
        return `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`
      }).join('')

    case 'hex':
      return Array.from(payload).map(c => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')

    case 'base64':
      return Buffer.from(payload, 'utf-8').toString('base64')

    default:
      return payload
  }
}

// ---------------------------------------------------------------------------
// Failure analyzer
// ---------------------------------------------------------------------------

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(text))
}

export function analyzeFailure(
  error?: { message?: string; code?: string; statusCode?: number } | null,
  responseBody?: string | null,
  responseHeaders?: Record<string, string> | null,
  statusCode?: number | null,
): FailureAnalysis {
  const combined = [
    error?.message ?? '',
    responseBody ?? '',
    ...(responseHeaders ? Object.entries(responseHeaders).map(([k, v]) => `${k}: ${v}`) : []),
  ].join('\n').toLowerCase()

  const evidence: string[] = []
  let reason: FailureReason = 'unknown'
  let confidence = 0.3
  let description = 'Unknown failure'
  const suggestions: string[] = []

  const code = statusCode ?? error?.statusCode ?? 0

  if (matchesAny(combined, IP_BLOCK_PATTERNS)) {
    reason = 'ip-blocked'
    confidence = 0.9
    description = 'Source IP appears to be blocked by the target'
    evidence.push('IP-block pattern detected in error or response data')
    suggestions.push(
      'Rotate source IP or egress point',
      'Add header variations such as X-Forwarded-For only when authorized',
      'Slow request rate and retry with a fresh session',
    )
  }

  // WAF detection (highest priority)
  for (const [wafName, patterns] of Object.entries(WAF_PATTERNS)) {
    if (reason === 'unknown' && matchesAny(combined, patterns)) {
      reason = 'waf-blocked'
      confidence = 0.85
      description = `WAF detected: ${wafName}`
      evidence.push(`WAF signature matched: ${wafName}`)
      suggestions.push(
        'Try double URL-encoding the payload',
        'Use mixed-case or inline-comment mutation',
        'Switch to chunked Transfer-Encoding',
      )
      break
    }
  }

  // Rate limiting
  if (reason === 'unknown' && (code === 429 || matchesAny(combined, RATE_LIMIT_PATTERNS))) {
    reason = 'rate-limited'
    confidence = 0.9
    description = 'Request rate-limited by target'
    evidence.push(code === 429 ? 'HTTP 429 response' : 'Rate-limit pattern in response')
    suggestions.push('Apply exponential backoff', 'Add jitter between requests', 'Reduce concurrency')
  }

  // CAPTCHA
  if (reason === 'unknown' && matchesAny(combined, CAPTCHA_PATTERNS)) {
    reason = 'captcha-required'
    confidence = 0.8
    description = 'CAPTCHA challenge detected'
    evidence.push('CAPTCHA pattern in response body')
    suggestions.push('Manual CAPTCHA solving required', 'Try alternative endpoint', 'Switch to authenticated session')
  }

  // Auth required
  if (reason === 'unknown' && (code === 401 || code === 403 || matchesAny(combined, AUTH_PATTERNS))) {
    reason = 'auth-required'
    confidence = code === 401 || code === 403 ? 0.95 : 0.7
    description = code === 403 ? 'Access forbidden' : 'Authentication required'
    evidence.push(`HTTP ${code || 'auth pattern detected'}`)
    suggestions.push('Provide valid credentials', 'Check session/cookie state', 'Try alternative auth method')
  }

  // Server error
  if (reason === 'unknown' && code >= 500) {
    reason = 'server-error'
    confidence = 0.9
    description = `Server error: HTTP ${code}`
    evidence.push(`HTTP ${code}`)
    suggestions.push('Reduce payload complexity', 'Wait and retry', 'Try a simpler test vector')
  }

  // Not found
  if (reason === 'unknown' && code === 404) {
    reason = 'not-found'
    confidence = 0.95
    description = 'Target resource not found'
    evidence.push('HTTP 404')
    suggestions.push('Verify the target URL path', 'Run directory enumeration', 'Check for URL rewriting')
  }

  // Connection-level errors
  if (reason === 'unknown' && error?.message) {
    const msg = error.message.toLowerCase()
    if (msg.includes('timeout') || msg.includes('etimedout') || msg.includes('esockettimedout')) {
      reason = 'timeout'
      confidence = 0.9
      description = 'Request timed out'
      evidence.push(error.message)
      suggestions.push('Increase timeout', 'Check target availability', 'Reduce payload size')
    } else if (msg.includes('econnrefused') || msg.includes('econnreset') || msg.includes('connection')) {
      reason = 'connection-error'
      confidence = 0.85
      description = 'Connection failed'
      evidence.push(error.message)
      suggestions.push('Verify target is reachable', 'Check firewall rules', 'Try alternative port')
    } else if (msg.includes('enotfound') || msg.includes('dns')) {
      reason = 'dns-error'
      confidence = 0.9
      description = 'DNS resolution failed'
      evidence.push(error.message)
      suggestions.push('Verify domain name', 'Check DNS configuration', 'Try IP address directly')
    }
  }

  return { reason, confidence, description, evidence, suggestions }
}

// ---------------------------------------------------------------------------
// Strategy selector
// ---------------------------------------------------------------------------

export function selectStrategies(
  reason: FailureReason,
  maxCount?: number,
): AdjustmentStrategy[] {
  const applicable = ALL_STRATEGIES
    .filter(s => s.applicableReasons.includes(reason))
    .sort((a, b) => b.priority - a.priority)

  return maxCount ? applicable.slice(0, maxCount) : applicable
}

// ---------------------------------------------------------------------------
// User-Agent pool
// ---------------------------------------------------------------------------

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

export function pickUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]!
}

function generateRandomIp(): string {
  const octet = () => Math.floor(Math.random() * 254) + 1
  return `${octet()}.${octet()}.${octet()}.${octet()}`
}

// ---------------------------------------------------------------------------
// FeedbackEngine — main entry point
// ---------------------------------------------------------------------------

export type FeedbackEngineOptions = {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

export class FeedbackEngine {
  private maxRetries: number
  private baseDelayMs: number
  private maxDelayMs: number

  private successCounts = new Map<string, number>()
  private failureCounts = new Map<string, number>()

  constructor(options: FeedbackEngineOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3
    this.baseDelayMs = options.baseDelayMs ?? 1000
    this.maxDelayMs = options.maxDelayMs ?? 30_000
  }

  /** Analyze a failure and produce structured retry guidance for the agent. */
  produceRetryGuidance(
    attempt: number,
    payload: string | null,
    error?: { message?: string; code?: string; statusCode?: number } | null,
    responseBody?: string | null,
    responseHeaders?: Record<string, string> | null,
    statusCode?: number | null,
  ): RetryGuidance {
    const analysis = analyzeFailure(error, responseBody, responseHeaders, statusCode)
    const strategies = selectStrategies(analysis.reason, 3)

    if (attempt >= this.maxRetries) {
      return {
        shouldRetry: false,
        analysis,
        recommendedStrategies: strategies,
        mutatedPayload: null,
        delayMs: 0,
        headerOverrides: {},
        agentInstruction: `Max retries (${this.maxRetries}) reached. Failure reason: ${analysis.description}. ${analysis.suggestions.join('. ')}.`,
      }
    }

    // Compute delay
    let delayMs = 0
    if (analysis.reason === 'rate-limited' || analysis.reason === 'timeout') {
      const exp = Math.min(this.baseDelayMs * Math.pow(2, attempt), this.maxDelayMs)
      const jitter = Math.random() * exp * 0.3
      delayMs = Math.round(exp + jitter)
    }

    // Compute header overrides
    const headerOverrides: Record<string, string> = {}
    for (const s of strategies) {
      if (s.type === 'user-agent') {
        headerOverrides['User-Agent'] = pickUserAgent()
      }
      if (s.name === 'add-forwarded-for') {
        headerOverrides['X-Forwarded-For'] = generateRandomIp()
      }
      if (s.name === 'add-origin-referer') {
        headerOverrides['Referer'] = 'https://www.google.com/'
      }
    }

    // Compute payload mutation
    let mutatedPayload: string | null = null
    if (payload) {
      const topStrat = strategies[0]
      if (topStrat) {
        const mutation = topStrat.params['mutation'] as string | undefined
        const encoding = topStrat.params['encoding'] as string | undefined
        if (encoding) {
          mutatedPayload = encodePayload(payload, encoding)
        } else if (mutation) {
          mutatedPayload = mutatePayload(payload, mutation)
        }
      }
    }

    // Build agent instruction
    const parts = [
      `Failure classified as: ${analysis.reason} (${(analysis.confidence * 100).toFixed(0)}% confidence).`,
      analysis.description,
    ]
    if (strategies.length > 0) {
      parts.push(`Recommended adaptations: ${strategies.map(s => s.description).join('; ')}.`)
    }
    if (delayMs > 0) {
      parts.push(`Wait ${delayMs}ms before retrying.`)
    }
    if (mutatedPayload) {
      parts.push('A mutated payload variant has been generated — use it for the next attempt.')
    }
    parts.push(...analysis.suggestions.map(s => `• ${s}`))

    // Record for adaptive learning
    this.recordAttempt(strategies[0]?.name ?? 'none', false)

    return {
      shouldRetry: true,
      analysis,
      recommendedStrategies: strategies,
      mutatedPayload,
      delayMs,
      headerOverrides,
      agentInstruction: parts.join(' '),
    }
  }

  /** Record a strategy outcome for adaptive learning. */
  recordAttempt(strategyName: string, success: boolean): void {
    const map = success ? this.successCounts : this.failureCounts
    map.set(strategyName, (map.get(strategyName) ?? 0) + 1)
  }

  /** Get strategy effectiveness stats. */
  getStrategyStats(): Array<{ name: string; successes: number; failures: number; successRate: number }> {
    const allNames = new Set(Array.from(this.successCounts.keys()).concat(Array.from(this.failureCounts.keys())))
    return Array.from(allNames).map(name => {
      const successes = this.successCounts.get(name) ?? 0
      const failures = this.failureCounts.get(name) ?? 0
      const total = successes + failures
      return { name, successes, failures, successRate: total > 0 ? successes / total : 0 }
    }).sort((a, b) => b.successRate - a.successRate)
  }

  /** Reset all counters. */
  reset(): void {
    this.successCounts.clear()
    this.failureCounts.clear()
  }
}
