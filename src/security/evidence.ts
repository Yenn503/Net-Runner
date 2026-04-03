import { randomUUID } from 'crypto'
import { appendFile, mkdir, readFile } from 'fs/promises'
import { dirname } from 'path'
import type { GuardrailDecision } from './guardrails.js'
import { getEvidenceLedgerPath } from './paths.js'

export type EvidenceSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'

type EvidenceEntryBase = {
  id: string
  createdAt: string
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

export type EvidenceEntry =
  | SessionBoundaryEntry
  | NoteEntry
  | FindingEntry
  | ArtifactEntry
  | GuardrailEntry

export type EvidenceEntryInput =
  | Omit<SessionBoundaryEntry, 'id' | 'createdAt'>
  | Omit<NoteEntry, 'id' | 'createdAt'>
  | Omit<FindingEntry, 'id' | 'createdAt'>
  | Omit<ArtifactEntry, 'id' | 'createdAt'>
  | Omit<GuardrailEntry, 'id' | 'createdAt'>

export async function appendEvidenceEntry(
  cwd: string,
  entry: EvidenceEntryInput,
): Promise<EvidenceEntry> {
  const fullEntry: EvidenceEntry = {
    ...entry,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  } as EvidenceEntry

  const path = getEvidenceLedgerPath(cwd)
  await mkdir(dirname(path), { recursive: true })
  await appendFile(path, `${JSON.stringify(fullEntry)}\n`, 'utf8')
  return fullEntry
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
    },
  )
}
