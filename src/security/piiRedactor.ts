const PATTERNS: Array<{ kind: string; re: RegExp }> = [
  { kind: 'EMAIL', re: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g },
  {
    kind: 'PHONE',
    re: /(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}|\+\d{7,15}/g,
  },
  { kind: 'IPV4', re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  {
    kind: 'JWT',
    re: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  },
  { kind: 'AWS_KEY', re: /AKIA[0-9A-Z]{16}/g },
  { kind: 'GITHUB_PAT', re: /ghp_[A-Za-z0-9]{36,}/g },
  {
    kind: 'BEARER_TOKEN',
    re: /Bearer\s+[A-Za-z0-9._\-]{20,}/g,
  },
  {
    kind: 'PRIVATE_KEY',
    re: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g,
  },
]

export type RedactResult = { redacted: string; redactionCount: number }

export function redactPii(text: string): RedactResult {
  let redactionCount = 0
  let redacted = text
  for (const { kind, re } of PATTERNS) {
    const globalRe = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
    redacted = redacted.replace(globalRe, () => {
      redactionCount++
      return `[REDACTED:${kind}]`
    })
  }
  return { redacted, redactionCount }
}

export function redactPiiDeep(value: unknown): { value: unknown; redactionCount: number } {
  if (typeof value === 'string') {
    const { redacted, redactionCount } = redactPii(value)
    return { value: redacted, redactionCount }
  }
  if (Array.isArray(value)) {
    let total = 0
    const arr = value.map(item => {
      const r = redactPiiDeep(item)
      total += r.redactionCount
      return r.value
    })
    return { value: arr, redactionCount: total }
  }
  if (value !== null && typeof value === 'object') {
    let total = 0
    const obj: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const r = redactPiiDeep(v)
      total += r.redactionCount
      obj[k] = r.value
    }
    return { value: obj, redactionCount: total }
  }
  return { value, redactionCount: 0 }
}
