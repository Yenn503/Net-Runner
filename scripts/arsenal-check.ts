#!/usr/bin/env bun
/**
 * Arsenal validator.
 *
 * Walks .netrunner/arsenal/index/*.yaml and verifies:
 *   - YAML parses
 *   - Required fields are present and well-typed
 *   - Reliability + validation_status + exploit_type + execution_adapter
 *     use the documented enum values
 *   - `references` and `source` are HTTPS URLs
 *   - `id` is unique within the file
 *
 * Exits non-zero if any check fails. Output is grep-friendly.
 *
 *   bun run arsenal:check
 */
import { loadArsenal } from '../src/security/arsenal.ts'

const RELIABILITY = new Set(['high', 'medium', 'low', 'unverified'])
const VALIDATION_STATUS = new Set([
  'unvalidated',
  'validated-lab',
  'validated-target',
  'failed',
])
const EXPLOIT_TYPE = new Set([
  'rce',
  'privilege-escalation',
  'auth-bypass',
  'defense-evasion',
  'credential-access',
  'info-disclosure',
  'dos',
  'lateral-movement',
])
const EXECUTION_ADAPTER = new Set([
  'metasploit',
  'nuclei',
  'searchsploit',
  'manual',
  'custom-script',
  'mcp-tool',
])

const CWD = process.cwd()
const problems: string[] = []

const { entries, errors } = await loadArsenal(CWD)

for (const err of errors) {
  problems.push(`[${err.file}] load: ${err.reason}`)
}

// Per-file id uniqueness.
const idsBySurface = new Map<string, Set<string>>()
for (const entry of entries) {
  let bucket = idsBySurface.get(entry.surface)
  if (!bucket) {
    bucket = new Set()
    idsBySurface.set(entry.surface, bucket)
  }
  if (bucket.has(entry.id)) {
    problems.push(`[${entry.surface}.yaml] duplicate id: ${entry.id}`)
  }
  bucket.add(entry.id)

  if (!RELIABILITY.has(entry.reliability)) {
    problems.push(`[${entry.surface}.yaml] ${entry.id}: bad reliability "${entry.reliability}"`)
  }
  if (!VALIDATION_STATUS.has(entry.validation_status)) {
    problems.push(`[${entry.surface}.yaml] ${entry.id}: bad validation_status "${entry.validation_status}"`)
  }
  if (!EXPLOIT_TYPE.has(entry.exploit_type)) {
    problems.push(`[${entry.surface}.yaml] ${entry.id}: bad exploit_type "${entry.exploit_type}"`)
  }
  if (!EXECUTION_ADAPTER.has(entry.execution_adapter)) {
    problems.push(`[${entry.surface}.yaml] ${entry.id}: bad execution_adapter "${entry.execution_adapter}"`)
  }
  if (entry.cve !== 'none' && !/^CVE-\d{4}-\d{4,7}$/.test(entry.cve)) {
    problems.push(`[${entry.surface}.yaml] ${entry.id}: bad cve format "${entry.cve}"`)
  }
  if (!entry.source.startsWith('https://')) {
    problems.push(`[${entry.surface}.yaml] ${entry.id}: source must be https:// — got "${entry.source}"`)
  }
  if (entry.references.length === 0) {
    problems.push(`[${entry.surface}.yaml] ${entry.id}: references array is empty`)
  }
  for (const ref of entry.references) {
    if (!ref.startsWith('https://')) {
      problems.push(`[${entry.surface}.yaml] ${entry.id}: reference must be https:// — got "${ref}"`)
    }
  }
}

const total = entries.length
const surfaces = idsBySurface.size

if (problems.length > 0) {
  console.error(`\n✗ Arsenal check failed (${problems.length} problem(s)):\n`)
  for (const p of problems) console.error(`  ${p}`)
  console.error(`\n  Scanned ${total} entries across ${surfaces} surface file(s).\n`)
  process.exit(1)
}

console.log(`✓ Arsenal OK — ${total} entries across ${surfaces} surface file(s).`)
for (const [surface, ids] of idsBySurface.entries()) {
  console.log(`  · ${surface}.yaml: ${ids.size} entries`)
}
