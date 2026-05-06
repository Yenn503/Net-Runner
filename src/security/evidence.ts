import { randomUUID } from 'crypto'
import { appendFile, mkdir, readFile } from 'fs/promises'
import { dirname } from 'path'
import type { GuardrailDecision } from './guardrails.js'
import { getEvidenceLedgerPath } from './paths.js'
import { hashEntry } from './evidenceHash.js'
import { redactPiiDeep } from './piiRedactor.js'

export type EvidenceSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'

export type MitreAttackReference = {
  techniqueId: string
  techniqueName: string
  tacticId?: string
  tacticName?: string
  subtechniqueId?: string
}

export type CvssScore = {
  version: '3.1' | '4.0'
  vector: string
  baseScore: number
  baseSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

export type OwaspCategory =
  | 'A01:2021-Broken-Access-Control'
  | 'A02:2021-Cryptographic-Failures'
  | 'A03:2021-Injection'
  | 'A04:2021-Insecure-Design'
  | 'A05:2021-Security-Misconfiguration'
  | 'A06:2021-Vulnerable-and-Outdated-Components'
  | 'A07:2021-Identification-and-Authentication-Failures'
  | 'A08:2021-Software-and-Data-Integrity-Failures'
  | 'A09:2021-Security-Logging-and-Monitoring-Failures'
  | 'A10:2021-Server-Side-Request-Forgery'

export type ComplianceFramework = 'PCI-DSS' | 'NIST-800-53' | 'SOC2' | 'HIPAA' | 'ISO-27001' | 'CIS'

export type ComplianceReference = {
  framework: ComplianceFramework
  controls: string[]
}

type EvidenceEntryBase = {
  id: string
  createdAt: string
  hash?: string
  prevHash?: string | null
  redactionCount?: number
}

export type SessionBoundaryEntry = EvidenceEntryBase & {
  type: 'session_start' | 'session_end'
  summary: string
}

export type NoteEntry = EvidenceEntryBase & {
  type: 'note'
  note: string
}

export type FindingEntry = EvidenceEntryBase & {
  type: 'finding'
  title: string
  severity: EvidenceSeverity
  evidence: string
  recommendation?: string
  cweIds?: string[]
  cvss?: CvssScore
  mitreAttack?: MitreAttackReference[]
  owaspCategory?: OwaspCategory[]
  compliance?: ComplianceReference[]
  replayCommand?: string
  replayRequest?: string
  mitreAttackTechniques?: string[]
}

export type ArtifactEntry = EvidenceEntryBase & {
  type: 'artifact'
  label: string
  path: string
  description?: string
}

export type GuardrailEntry = EvidenceEntryBase & {
  type: 'guardrail'
  plannedAction: string
  decision: GuardrailDecision
}

export type ExecutionStepEntry = EvidenceEntryBase & {
  type: 'execution_step'
  agentType: string
  status: 'completed' | 'failed' | 'killed'
  description: string
  prompt: string
  summary?: string
  outputFile?: string
  totalToolUseCount?: number
  totalDurationMs?: number
  model?: string
}

export type ApprovalEntry = EvidenceEntryBase & {
  type: 'approval'
  reviewId: string
  status: 'pending' | 'approved' | 'rejected'
  plannedAction: string
  reason: string
  decidedBy?: string
}

export type EvidenceEntry =
  | SessionBoundaryEntry
  | NoteEntry
  | FindingEntry
  | ArtifactEntry
  | GuardrailEntry
  | ExecutionStepEntry
  | ApprovalEntry

export type EvidenceEntryInput =
  | Omit<SessionBoundaryEntry, 'id' | 'createdAt'>
  | Omit<NoteEntry, 'id' | 'createdAt'>
  | Omit<FindingEntry, 'id' | 'createdAt'>
  | Omit<ArtifactEntry, 'id' | 'createdAt'>
  | Omit<GuardrailEntry, 'id' | 'createdAt'>
  | Omit<ExecutionStepEntry, 'id' | 'createdAt'>
  | Omit<ApprovalEntry, 'id' | 'createdAt'>

export type AppendEvidenceOptions = {
  redactPii?: boolean
}

export async function appendEvidenceEntry(
  cwd: string,
  entry: EvidenceEntryInput,
  options: AppendEvidenceOptions = {},
): Promise<EvidenceEntry> {
  const shouldRedact = options.redactPii !== false

  const path = getEvidenceLedgerPath(cwd)
  await mkdir(dirname(path), { recursive: true })

  let prevHash: string | null = null
  try {
    const raw = await readFile(path, 'utf8')
    const lines = raw.split('\n').filter(l => l.trim())
    const lastLine = lines[lines.length - 1]
    if (lastLine) {
      const lastEntry = JSON.parse(lastLine) as Record<string, unknown>
      if (typeof lastEntry.hash === 'string') {
        prevHash = lastEntry.hash
      }
    }
  } catch {
    // file doesn't exist yet — prevHash stays null
  }

  let baseEntry: Record<string, unknown> = {
    ...entry,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  }

  let redactionCount = 0
  if (shouldRedact) {
    const result = redactPiiDeep(baseEntry)
    baseEntry = result.value as Record<string, unknown>
    redactionCount = result.redactionCount
  }

  const entryForHash: Record<string, unknown> = { ...baseEntry }
  if (redactionCount > 0) {
    entryForHash.redactionCount = redactionCount
  }
  const hash = hashEntry(entryForHash)

  const fullEntry: Record<string, unknown> = { ...entryForHash, prevHash, hash }

  await appendFile(path, `${JSON.stringify(fullEntry)}\n`, 'utf8')
  return fullEntry as unknown as EvidenceEntry
}

export async function readEvidenceEntries(cwd: string): Promise<EvidenceEntry[]> {
  try {
    const raw = await readFile(getEvidenceLedgerPath(cwd), 'utf8')
    return raw
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => JSON.parse(line) as EvidenceEntry)
  } catch {
    return []
  }
}

export function countEvidenceEntriesByType(
  entries: EvidenceEntry[],
): Record<EvidenceEntry['type'], number> {
  return entries.reduce<Record<EvidenceEntry['type'], number>>(
    (counts, entry) => {
      counts[entry.type] += 1
      return counts
    },
    {
      session_start: 0,
      session_end: 0,
      note: 0,
      finding: 0,
      artifact: 0,
      guardrail: 0,
      execution_step: 0,
      approval: 0,
    },
  )
}
