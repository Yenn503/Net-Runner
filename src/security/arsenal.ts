/**
 * Exploit arsenal — typed loader, matcher, and discovered-ledger append.
 *
 * The arsenal is curated metadata (provenance-tracked exploit leads) split
 * across `.netrunner/arsenal/index/<surface>.yaml`. This module turns that
 * folder into a typed query surface so agents do not have to grep YAML by
 * hand. See `.netrunner/arsenal/README.md` for the schema and discipline.
 */
import { readdir, readFile, mkdir, appendFile } from 'fs/promises'
import { basename, join } from 'path'
import { parse as parseYaml } from 'yaml'

import {
  getArsenalIndexDir,
  getDiscoveredArsenalPath,
} from './paths.js'

/** A surface is the index filename without `.yaml`. */
export type ArsenalSurface =
  | 'windows'
  | 'linux'
  | 'web-and-appliance'
  | 'active-directory'
  | (string & Record<never, never>)

export type ExploitType =
  | 'rce'
  | 'privilege-escalation'
  | 'auth-bypass'
  | 'defense-evasion'
  | 'credential-access'
  | 'info-disclosure'
  | 'dos'
  | 'lateral-movement'
  | (string & Record<never, never>)

export type ReliabilityScore = 'high' | 'medium' | 'low' | 'unverified'

export type ValidationStatus =
  | 'unvalidated'
  | 'validated-lab'
  | 'validated-target'
  | 'failed'

export type ExecutionAdapter =
  | 'metasploit'
  | 'nuclei'
  | 'searchsploit'
  | 'manual'
  | 'custom-script'
  | 'mcp-tool'

export interface ArsenalEntry {
  /** Unique within the surface file. */
  id: string
  /** CVE id or 'none' for un-assigned community PoCs. */
  cve: string
  name: string
  exploit_type: ExploitType
  affected_versions: string
  references: string[]
  source: string
  reliability: ReliabilityScore
  validation_status: ValidationStatus
  prerequisites: string
  execution_environment: string
  detection_notes: string
  execution_adapter: ExecutionAdapter
  operator_notes: string
  /** Filled in by the loader — the surface YAML the entry came from. */
  surface: ArsenalSurface
}

/** Discovered-ledger entry shape (one JSON object per line). */
export interface DiscoveredArsenalEntry {
  ts: string
  engagement: string
  target: string
  cve: string
  name: string
  exploit_type: ExploitType
  reliability: ReliabilityScore
  validation_status: ValidationStatus
  execution_adapter: ExecutionAdapter
  evidence: string
  operator_notes?: string
}

/** Lookup filter — every field is optional; all supplied fields are AND-ed. */
export interface ArsenalLookupFilter {
  /** Substring matched (case-insensitive) against `affected_versions` + `name`. */
  product?: string
  /** Version string; matched as substring against `affected_versions`. */
  version?: string
  /** Exact CVE id. */
  cve?: string
  /** Restrict to one exploit type. */
  exploit_type?: ExploitType
  /** Restrict to one surface file. */
  surface?: ArsenalSurface
  /** Minimum reliability — `high` > `medium` > `low` > `unverified`. */
  min_reliability?: ReliabilityScore
}

export interface ArsenalLookupRenderOptions {
  limit?: number
  referencesPerHit?: number
}

const RELIABILITY_RANK: Record<ReliabilityScore, number> = {
  high: 3,
  medium: 2,
  low: 1,
  unverified: 0,
}

/** Required keys for a well-formed YAML entry. */
const REQUIRED_KEYS: readonly (keyof ArsenalEntry)[] = [
  'id',
  'cve',
  'name',
  'exploit_type',
  'affected_versions',
  'references',
  'source',
  'reliability',
  'validation_status',
  'prerequisites',
  'execution_environment',
  'detection_notes',
  'execution_adapter',
  'operator_notes',
]

export interface LoadArsenalResult {
  entries: ArsenalEntry[]
  /** Per-file load errors (malformed YAML, missing fields). Non-fatal. */
  errors: { file: string; reason: string }[]
}

/**
 * Load every entry from `.netrunner/arsenal/index/*.yaml`.
 *
 * Missing directory => empty result (not an error — repos may not seed an
 * arsenal). Bad YAML or missing required fields are reported in `errors`
 * but do not throw, so a single bad file does not blind every agent.
 */
export async function loadArsenal(cwd: string): Promise<LoadArsenalResult> {
  const indexDir = getArsenalIndexDir(cwd)
  const out: ArsenalEntry[] = []
  const errors: { file: string; reason: string }[] = []
  let files: string[]
  try {
    files = (await readdir(indexDir)).filter(f => f.endsWith('.yaml'))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { entries: out, errors }
    throw err
  }
  for (const file of files) {
    const surface = basename(file, '.yaml')
    const full = join(indexDir, file)
    let raw: string
    try {
      raw = await readFile(full, 'utf8')
    } catch (err) {
      errors.push({ file, reason: `read failed: ${(err as Error).message}` })
      continue
    }
    let parsed: unknown
    try {
      parsed = parseYaml(raw)
    } catch (err) {
      errors.push({ file, reason: `yaml parse failed: ${(err as Error).message}` })
      continue
    }
    const exploits = (parsed as { exploits?: unknown[] } | null)?.exploits
    if (!Array.isArray(exploits)) {
      errors.push({ file, reason: 'top-level `exploits` array missing' })
      continue
    }
    for (const raw of exploits) {
      const entry = validateEntry(raw, surface, file)
      if (entry.ok) {
        out.push(entry.entry)
      } else {
        errors.push({ file, reason: entry.reason })
      }
    }
  }
  return { entries: out, errors }
}

type ValidationResult =
  | { ok: true; entry: ArsenalEntry }
  | { ok: false; reason: string }

function validateEntry(raw: unknown, surface: string, file: string): ValidationResult {
  if (raw === null || typeof raw !== 'object') {
    return { ok: false, reason: `non-object entry in ${file}` }
  }
  const obj = raw as Record<string, unknown>
  for (const key of REQUIRED_KEYS) {
    if (!(key in obj)) {
      return { ok: false, reason: `entry "${String(obj.id ?? '?')}" missing field: ${key}` }
    }
  }
  if (!Array.isArray(obj.references)) {
    return { ok: false, reason: `entry "${String(obj.id)}" references must be array` }
  }
  const entry: ArsenalEntry = {
    id: String(obj.id),
    cve: String(obj.cve),
    name: String(obj.name),
    exploit_type: String(obj.exploit_type) as ExploitType,
    affected_versions: String(obj.affected_versions),
    references: (obj.references as unknown[]).map(String),
    source: String(obj.source),
    reliability: String(obj.reliability) as ReliabilityScore,
    validation_status: String(obj.validation_status) as ValidationStatus,
    prerequisites: String(obj.prerequisites),
    execution_environment: String(obj.execution_environment),
    detection_notes: String(obj.detection_notes),
    execution_adapter: String(obj.execution_adapter) as ExecutionAdapter,
    operator_notes: String(obj.operator_notes),
    surface,
  }
  return { ok: true, entry }
}

/** AND-filter a loaded arsenal by the supplied criteria. */
export function matchArsenal(
  entries: readonly ArsenalEntry[],
  filter: ArsenalLookupFilter,
): ArsenalEntry[] {
  const product = filter.product?.trim().toLowerCase()
  const version = filter.version?.trim().toLowerCase()
  const cve = filter.cve?.trim().toUpperCase()
  const minRank = filter.min_reliability
    ? RELIABILITY_RANK[filter.min_reliability]
    : -1
  return entries.filter(entry => {
    if (filter.surface && entry.surface !== filter.surface) return false
    if (cve && entry.cve.toUpperCase() !== cve) return false
    if (filter.exploit_type && entry.exploit_type !== filter.exploit_type) {
      return false
    }
    if (product) {
      const hay = `${entry.name} ${entry.affected_versions}`.toLowerCase()
      if (!hay.includes(product)) return false
    }
    if (version) {
      if (!entry.affected_versions.toLowerCase().includes(version)) return false
    }
    if (minRank >= 0 && RELIABILITY_RANK[entry.reliability] < minRank) {
      return false
    }
    return true
  })
}

/** Sort hits by reliability (high → unverified) then by surface/id. */
export function sortArsenalHits(hits: ArsenalEntry[]): ArsenalEntry[] {
  return [...hits].sort((a, b) => {
    const dr = RELIABILITY_RANK[b.reliability] - RELIABILITY_RANK[a.reliability]
    if (dr !== 0) return dr
    if (a.surface !== b.surface) return a.surface < b.surface ? -1 : 1
    return a.id < b.id ? -1 : 1
  })
}

export function renderArsenalLookupResult(
  scanned: number,
  hits: readonly ArsenalEntry[],
  errors: readonly { file: string; reason: string }[],
  options: ArsenalLookupRenderOptions = {},
): string {
  const limit = options.limit ?? 8
  const referencesPerHit = options.referencesPerHit ?? 3
  const shown = Math.min(hits.length, limit)
  const header = `[arsenal] scanned=${scanned} hits=${hits.length} shown=${shown}${hits.length > limit ? ' (truncated; raise limit to see the rest)' : ''}`
  const errorBlock = errors.length
    ? `\n\n[warnings] ${errors.length} file(s) had load issues:\n${errors.map(e => `  - ${e.file}: ${e.reason}`).join('\n')}`
    : ''
  if (hits.length === 0) {
    return `${header}\n(no match — fall back to cve-intelligence-lookup: searchsploit / CISA KEV / NVD)${errorBlock}`
  }
  const rendered = hits
    .slice(0, limit)
    .map((entry, idx) => renderArsenalEntry(entry, idx, referencesPerHit))
    .join('\n\n')
  return `${header}\n\n${rendered}${errorBlock}`
}

function renderArsenalEntry(
  entry: ArsenalEntry,
  idx: number,
  referencesPerHit: number,
): string {
  const refs = entry.references
    .slice(0, referencesPerHit)
    .map(r => `    - ${r}`)
    .join('\n')
  const moreRefs =
    entry.references.length > referencesPerHit
      ? `\n    (+${entry.references.length - referencesPerHit} more refs)`
      : ''
  return [
    `[#${idx + 1}] ${entry.id} (${entry.surface}) — ${entry.name}`,
    `  cve: ${entry.cve}    type: ${entry.exploit_type}    reliability: ${entry.reliability}    status: ${entry.validation_status}`,
    `  affects: ${entry.affected_versions}`,
    `  prereqs: ${entry.prerequisites}`,
    `  env: ${entry.execution_environment}    adapter: ${entry.execution_adapter}`,
    `  detection: ${entry.detection_notes}`,
    `  notes: ${entry.operator_notes}`,
    `  source: ${entry.source}`,
    `  references:\n${refs}${moreRefs}`,
  ].join('\n')
}

/**
 * Append a validated exploit to `.netrunner/arsenal/discovered.jsonl`.
 * Creates the parent directory if needed. Caller supplies the engagement
 * name and a `ts` is filled in automatically when omitted.
 */
export async function appendDiscoveredArsenal(
  cwd: string,
  entry: Omit<DiscoveredArsenalEntry, 'ts'> & { ts?: string },
): Promise<string> {
  const path = getDiscoveredArsenalPath(cwd)
  await mkdir(join(path, '..'), { recursive: true })
  const record: DiscoveredArsenalEntry = {
    ts: entry.ts ?? new Date().toISOString(),
    engagement: entry.engagement,
    target: entry.target,
    cve: entry.cve,
    name: entry.name,
    exploit_type: entry.exploit_type,
    reliability: entry.reliability,
    validation_status: entry.validation_status,
    execution_adapter: entry.execution_adapter,
    evidence: entry.evidence,
    ...(entry.operator_notes ? { operator_notes: entry.operator_notes } : {}),
  }
  await appendFile(path, `${JSON.stringify(record)}\n`, 'utf8')
  return path
}
