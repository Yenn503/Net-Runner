/**
 * WAF Detection & Bypass Intelligence — fingerprint WAFs and select bypass strategies.
 *
 * Provides structured WAF identification from HTTP response data and maps detected
 * WAF types to specific bypass techniques. Designed for agent consumption: the
 * recon-specialist identifies the WAF, and exploit/web-testing specialists use
 * the bypass guidance to adapt payloads.
 *
 * WAF signatures ported from AutoRedTeam-Orchestrator's waf_bypass_engine.py and
 * failure_analyzer.py, cross-referenced with wafw00f and publicly documented
 * WAF fingerprints.
 */

// ---------------------------------------------------------------------------
// WAF types
// ---------------------------------------------------------------------------

export type WafType =
  | 'cloudflare'
  | 'akamai'
  | 'imperva'
  | 'fortinet'
  | 'f5-bigip'
  | 'modsecurity'
  | 'aws-waf'
  | 'azure-front-door'
  | 'sucuri'
  | 'barracuda'
  | 'citrix-netscaler'
  | 'generic'
  | 'none'

// ---------------------------------------------------------------------------
// WAF fingerprint definition
// ---------------------------------------------------------------------------

export type WafFingerprint = {
  type: WafType
  name: string
  headerPatterns: RegExp[]
  bodyPatterns: RegExp[]
  cookiePatterns: RegExp[]
  statusCodes: number[]
}

const WAF_FINGERPRINTS: WafFingerprint[] = [
  {
    type: 'cloudflare',
    name: 'Cloudflare',
    headerPatterns: [/cf-ray/i, /cf-cache-status/i, /server:\s*cloudflare/i, /cf-mitigated/i],
    bodyPatterns: [/attention required.*cloudflare/i, /checking your browser/i, /cloudflare ray id/i, /error 1020/i],
    cookiePatterns: [/__cfduid/i, /cf_clearance/i, /__cf_bm/i],
    statusCodes: [403, 503],
  },
  {
    type: 'akamai',
    name: 'Akamai Kona / Ghost',
    headerPatterns: [/x-akamai/i, /akamaighost/i, /server:\s*akamaighost/i, /x-true-cache-key/i],
    bodyPatterns: [/reference #\d+\.\w+/i, /akamai/i],
    cookiePatterns: [/ak_bmsc/i, /akavpau/i, /bm_sv/i],
    statusCodes: [403],
  },
  {
    type: 'imperva',
    name: 'Imperva Incapsula',
    headerPatterns: [/x-iinfo/i, /x-cdn:\s*incapsula/i],
    bodyPatterns: [/incapsula incident id/i, /request unsuccessful/i, /powered by incapsula/i],
    cookiePatterns: [/visid_incap/i, /incap_ses/i, /nlbi_/i],
    statusCodes: [403],
  },
  {
    type: 'fortinet',
    name: 'Fortinet FortiWeb',
    headerPatterns: [/server:\s*fortiweb/i, /fortigate/i],
    bodyPatterns: [/fortigate/i, /fortiweb/i, /\.fgd_icon/i, /fgt_redirect/i],
    cookiePatterns: [/fortigate/i, /fortiweb/i],
    statusCodes: [403, 405],
  },
  {
    type: 'f5-bigip',
    name: 'F5 BIG-IP ASM',
    headerPatterns: [/server:\s*bigip/i, /x-wa-info/i, /f5-ltm/i],
    bodyPatterns: [/the requested url was rejected/i, /please consult with your administrator/i],
    cookiePatterns: [/ts[a-z0-9]{8,}=/i, /bigipserver/i, /f5_cspm/i],
    statusCodes: [403],
  },
  {
    type: 'modsecurity',
    name: 'ModSecurity / OWASP CRS',
    headerPatterns: [/server:.*mod_security/i, /server:.*modsecurity/i],
    bodyPatterns: [/mod_security/i, /modsecurity/i, /owasp.*crs/i, /not acceptable/i, /request denied.*modsec/i],
    cookiePatterns: [],
    statusCodes: [403, 406],
  },
  {
    type: 'aws-waf',
    name: 'AWS WAF',
    headerPatterns: [/x-amzn-requestid/i, /x-amz-cf-id/i, /server:\s*awselb/i],
    bodyPatterns: [/request blocked/i, /awswaf/i],
    cookiePatterns: [/aws-waf-token/i],
    statusCodes: [403],
  },
  {
    type: 'azure-front-door',
    name: 'Azure Front Door / Application Gateway',
    headerPatterns: [/x-azure-ref/i, /x-ms-request-id/i, /server:\s*microsoft/i],
    bodyPatterns: [/azure.*blocked/i, /this request was blocked/i],
    cookiePatterns: [],
    statusCodes: [403],
  },
  {
    type: 'sucuri',
    name: 'Sucuri CloudProxy',
    headerPatterns: [/server:\s*sucuri/i, /x-sucuri/i],
    bodyPatterns: [/sucuri website firewall/i, /access denied.*sucuri/i, /cloudproxy/i],
    cookiePatterns: [/sucuri/i],
    statusCodes: [403],
  },
  {
    type: 'barracuda',
    name: 'Barracuda WAF',
    headerPatterns: [/server:\s*barracuda/i],
    bodyPatterns: [/barracuda/i, /barra_counter_session/i],
    cookiePatterns: [/barra_counter_session/i, /barracuda/i],
    statusCodes: [403],
  },
  {
    type: 'citrix-netscaler',
    name: 'Citrix NetScaler AppFirewall',
    headerPatterns: [/server:\s*netscaler/i, /ns_af/i, /cneonction/i],
    bodyPatterns: [/ns_af/i, /netscaler/i, /appfw.*session/i],
    cookiePatterns: [/ns_af/i, /citrix_ns_id/i],
    statusCodes: [403, 302],
  },
]

// ---------------------------------------------------------------------------
// Detection result
// ---------------------------------------------------------------------------

export type WafDetectionResult = {
  detected: boolean
  wafType: WafType
  wafName: string
  confidence: number
  matchedSignatures: string[]
  bypassStrategies: WafBypassStrategy[]
}

// ---------------------------------------------------------------------------
// Bypass strategies per WAF type
// ---------------------------------------------------------------------------

export type WafBypassStrategy = {
  name: string
  description: string
  technique: string
  priority: number
  example?: string
}

const BYPASS_STRATEGIES: Record<WafType, WafBypassStrategy[]> = {
  cloudflare: [
    { name: 'Unicode normalization', description: 'Use Unicode equivalents for blocked characters.', technique: 'encoding', priority: 9, example: '\\u0027 instead of \'' },
    { name: 'Chunked transfer', description: 'Split payload across Transfer-Encoding: chunked.', technique: 'chunked', priority: 8 },
    { name: 'Double URL-encode', description: 'Double-encode special characters.', technique: 'encoding', priority: 7, example: '%2527 instead of %27' },
    { name: 'Header injection bypass', description: 'Abuse X-Forwarded-For or X-Originating-IP.', technique: 'header', priority: 6 },
    { name: 'Case variation', description: 'Mixed case SQL keywords: SeLeCt, UnIoN.', technique: 'mutation', priority: 5 },
  ],
  akamai: [
    { name: 'Parameter pollution', description: 'HTTP Parameter Pollution to split payloads across duplicate params.', technique: 'hpp', priority: 9 },
    { name: 'JSON content-type', description: 'Switch to application/json body to bypass form-based rules.', technique: 'content-type', priority: 8 },
    { name: 'Null byte injection', description: 'Insert %00 before payload to confuse parsers.', technique: 'encoding', priority: 7 },
    { name: 'Path normalization', description: 'Use /./path or //path to confuse URL normalization.', technique: 'path', priority: 6 },
  ],
  imperva: [
    { name: 'Multipart boundary abuse', description: 'Use multipart/form-data with unusual boundaries.', technique: 'content-type', priority: 9 },
    { name: 'Header case manipulation', description: 'Use unusual header casing: Content-type vs Content-Type.', technique: 'header', priority: 8 },
    { name: 'Inline SQL comments', description: 'Insert /**/ between SQL keywords: UN/**/ION.', technique: 'mutation', priority: 7, example: 'UN/**/ION SEL/**/ECT' },
    { name: 'Tab/newline substitution', description: 'Replace spaces with \\t or \\n.', technique: 'encoding', priority: 6 },
  ],
  fortinet: [
    { name: 'URL-encoded newlines', description: 'Use %0a%0d to break pattern matching.', technique: 'encoding', priority: 8 },
    { name: 'Double-encoding', description: 'Double URL-encode the payload.', technique: 'encoding', priority: 7 },
    { name: 'HTTP method override', description: 'Use X-HTTP-Method-Override header.', technique: 'method', priority: 6 },
  ],
  'f5-bigip': [
    { name: 'Content-Length mismatch', description: 'Send Content-Length that differs from actual body size.', technique: 'smuggling', priority: 8 },
    { name: 'HTTP/0.9 request', description: 'Downgrade to HTTP/0.9 to bypass inspection.', technique: 'protocol', priority: 7 },
    { name: 'Unicode encoding', description: 'Use full-width Unicode characters.', technique: 'encoding', priority: 6 },
  ],
  modsecurity: [
    { name: 'SQL comment nesting', description: 'Nest comments: /*!UNION*/ /*!SELECT*/.', technique: 'mutation', priority: 9, example: '/*!50000UNION*/ /*!50000SELECT*/' },
    { name: 'Hex encoding', description: 'Hex-encode string literals: 0x61646d696e for "admin".', technique: 'encoding', priority: 8, example: 'SELECT 0x61646d696e' },
    { name: 'Space alternatives', description: 'Use %09, %0b, %0c, %0d, %a0 instead of space.', technique: 'encoding', priority: 7 },
    { name: 'Anomaly score tuning', description: 'Keep payload just under CRS anomaly scoring threshold.', technique: 'evasion', priority: 6 },
  ],
  'aws-waf': [
    { name: 'JSON body injection', description: 'Move payload to JSON body; many AWS WAF rules only inspect URL/forms.', technique: 'content-type', priority: 9 },
    { name: 'Base64 in header', description: 'Base64-encode payload in custom header and decode server-side.', technique: 'encoding', priority: 7 },
    { name: 'Oversized payload', description: 'Pad request beyond WAF inspection limit (typically 8KB body).', technique: 'evasion', priority: 6 },
  ],
  'azure-front-door': [
    { name: 'IP rotation', description: 'Rotate source IPs to avoid geo-blocking.', technique: 'proxy', priority: 8 },
    { name: 'Chunked encoding', description: 'Use chunked transfer encoding.', technique: 'chunked', priority: 7 },
    { name: 'URL normalization tricks', description: 'Use /..;/ or /;/ path segments.', technique: 'path', priority: 6 },
  ],
  sucuri: [
    { name: 'XFF header spoofing', description: 'Set X-Forwarded-For to bypass IP reputation.', technique: 'header', priority: 8 },
    { name: 'Direct origin access', description: 'Discover and access the origin IP directly, bypassing Sucuri proxy.', technique: 'dns', priority: 9 },
    { name: 'Unicode smuggling', description: 'Use Unicode normalization differences.', technique: 'encoding', priority: 6 },
  ],
  barracuda: [
    { name: 'Double-encode', description: 'Double URL-encoding.', technique: 'encoding', priority: 8 },
    { name: 'HTTP verb tampering', description: 'Use uncommon HTTP methods like PATCH or OPTIONS.', technique: 'method', priority: 7 },
  ],
  'citrix-netscaler': [
    { name: 'HTTP desync', description: 'Request smuggling via CL/TE ambiguity.', technique: 'smuggling', priority: 8 },
    { name: 'Cookie injection', description: 'Inject payload via Cookie header.', technique: 'header', priority: 7 },
  ],
  generic: [
    { name: 'Double URL-encode', description: 'Double-encode payload.', technique: 'encoding', priority: 8 },
    { name: 'Mixed case', description: 'Randomize keyword casing.', technique: 'mutation', priority: 7 },
    { name: 'Inline comments', description: 'SQL inline comments between keywords.', technique: 'mutation', priority: 6 },
    { name: 'Space substitution', description: 'Replace spaces with /**/ or %09.', technique: 'encoding', priority: 5 },
  ],
  none: [],
}

// ---------------------------------------------------------------------------
// Detect WAF from HTTP response data
// ---------------------------------------------------------------------------

export function detectWaf(
  statusCode: number,
  headers: Record<string, string>,
  body: string,
  cookies?: string,
): WafDetectionResult {
  const headerStr = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n')
  const cookieStr = cookies ?? headers['set-cookie'] ?? headers['Set-Cookie'] ?? ''

  let bestMatch: { fp: WafFingerprint; score: number; sigs: string[] } | null = null

  for (const fp of WAF_FINGERPRINTS) {
    let score = 0
    const sigs: string[] = []

    for (const p of fp.headerPatterns) {
      if (p.test(headerStr)) {
        score += 3
        sigs.push(`header:${p.source}`)
      }
    }

    for (const p of fp.bodyPatterns) {
      if (p.test(body)) {
        score += 2
        sigs.push(`body:${p.source}`)
      }
    }

    for (const p of fp.cookiePatterns) {
      if (p.test(cookieStr)) {
        score += 2
        sigs.push(`cookie:${p.source}`)
      }
    }

    if (fp.statusCodes.includes(statusCode)) {
      score += 1
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { fp, score, sigs }
    }
  }

  if (!bestMatch) {
    return {
      detected: false,
      wafType: 'none',
      wafName: 'None detected',
      confidence: 0,
      matchedSignatures: [],
      bypassStrategies: [],
    }
  }

  const confidence = Math.min(bestMatch.score / 8, 1)
  const strategies = (BYPASS_STRATEGIES[bestMatch.fp.type] ?? [])
    .sort((a, b) => b.priority - a.priority)

  return {
    detected: true,
    wafType: bestMatch.fp.type,
    wafName: bestMatch.fp.name,
    confidence: Number(confidence.toFixed(2)),
    matchedSignatures: bestMatch.sigs,
    bypassStrategies: strategies,
  }
}

// ---------------------------------------------------------------------------
// Format WAF detection for agent prompt injection
// ---------------------------------------------------------------------------

export function formatWafGuidanceForAgent(result: WafDetectionResult): string {
  if (!result.detected) {
    return '[WAF Detection] No WAF detected. Proceed with standard payloads.'
  }

  const lines = [
    `[WAF Detection] ${result.wafName} detected (confidence: ${(result.confidence * 100).toFixed(0)}%).`,
    `Matched signatures: ${result.matchedSignatures.join(', ')}.`,
    '',
    'Recommended bypass strategies (priority order):',
  ]

  for (const s of result.bypassStrategies) {
    lines.push(`  ${s.priority}. ${s.name}: ${s.description}${s.example ? ` (e.g. ${s.example})` : ''}`)
  }

  lines.push('', 'Apply these adaptations to your payloads before retrying.')

  return lines.join('\n')
}
