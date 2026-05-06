import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { getEvidenceLedgerPath } from './paths.js'

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`
  }
  const sorted = Object.keys(value as Record<string, unknown>)
    .sort()
    .map(k => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`)
    .join(',')
  return `{${sorted}}`
}

export function hashEntry(entryWithoutChain: Record<string, unknown>): string {
  return createHash('sha256').update(canonicalJson(entryWithoutChain)).digest('hex')
}

type ChainOk = { ok: true; length: number }
type ChainBroken = { ok: false; breakAtIndex: number; reason: string }
export type ChainVerifyResult = ChainOk | ChainBroken

export async function verifyEvidenceChain(cwd: string): Promise<ChainVerifyResult> {
  let raw: string
  try {
    raw = await readFile(getEvidenceLedgerPath(cwd), 'utf8')
  } catch {
    return { ok: true, length: 0 }
  }

  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  let prevHash: string | null = null
  let chainStarted = false

  for (let i = 0; i < lines.length; i++) {
    let entry: Record<string, unknown>
    try {
      entry = JSON.parse(lines[i])
    } catch {
      return { ok: false, breakAtIndex: i, reason: 'JSON parse error' }
    }

    const { hash, prevHash: storedPrev, ...rest } = entry as Record<string, unknown> & {
      hash?: string
      prevHash?: string | null
    }

    if (hash === undefined) {
      prevHash = null
      chainStarted = false
      continue
    }

    if (!chainStarted && prevHash === null) {
      if (storedPrev !== null) {
        return {
          ok: false,
          breakAtIndex: i,
          reason: `First chained entry must have prevHash null, got ${JSON.stringify(storedPrev)}`,
        }
      }
    } else if (chainStarted) {
      if (storedPrev !== prevHash) {
        return {
          ok: false,
          breakAtIndex: i,
          reason: `prevHash mismatch at index ${i}: expected ${prevHash}, got ${String(storedPrev)}`,
        }
      }
    }

    const expected = hashEntry(rest as Record<string, unknown>)
    if (hash !== expected) {
      return {
        ok: false,
        breakAtIndex: i,
        reason: `Hash mismatch at index ${i}: stored=${hash}, computed=${expected}`,
      }
    }

    prevHash = hash
    chainStarted = true
  }

  return { ok: true, length: lines.length }
}
