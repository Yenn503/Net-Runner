import { exec } from 'child_process'
import { promisify } from 'util'
import {
  appendEvidenceEntry,
  readEvidenceEntries,
  type FindingEntry,
  type ValidationVerdict,
} from './evidence.js'

const execAsync = promisify(exec)

const EXEC_MAX_BUFFER_BYTES = 10 * 1024 * 1024
const EXEC_TIMEOUT_MS = 30_000
const DIFF_MAX_LINES = 20

export type ValidateFindingVerdict = ValidationVerdict | 'absent'

export type ValidateFindingResult = {
  verdict: ValidateFindingVerdict
  exitCode: number | string
  addedLines: string[]
  removedLines: string[]
  output: string
}

function lineDiff(
  original: string,
  current: string,
): { added: string[]; removed: string[] } {
  const oldLines = original.split(/\r?\n/)
  const newLines = current.split(/\r?\n/)
  const oldSet = new Set(oldLines)
  const newSet = new Set(newLines)
  const removed = oldLines.filter(l => !newSet.has(l)).slice(0, DIFF_MAX_LINES)
  const added = newLines.filter(l => !oldSet.has(l)).slice(0, DIFF_MAX_LINES)
  return { added, removed }
}

export async function validateFinding(
  cwd: string,
  findingId: string,
  commandOverride?: string,
): Promise<ValidateFindingResult> {
  const entries = await readEvidenceEntries(cwd)
  const finding = entries.find(
    (e): e is FindingEntry => e.type === 'finding' && e.id === findingId,
  )

  if (!finding) {
    return {
      verdict: 'absent',
      exitCode: -1,
      addedLines: [],
      removedLines: [],
      output: `Finding ${findingId} not found in evidence ledger.`,
    }
  }

  const command = finding.replayCommand ?? commandOverride ?? finding.replayRequest

  if (!command) {
    throw new Error(
      `Finding ${findingId} has no replayCommand and no command_override was supplied. Cannot validate.`,
    )
  }

  let stdout = ''
  let stderr = ''
  let exitCode: number | string = 0

  try {
    const result = await execAsync(command, {
      cwd,
      timeout: EXEC_TIMEOUT_MS,
      maxBuffer: EXEC_MAX_BUFFER_BYTES,
      env: { ...process.env, TERM: 'dumb' },
    })
    stdout = result.stdout
    stderr = result.stderr
  } catch (err: any) {
    stdout = err.stdout ?? ''
    stderr = err.stderr ?? ''
    exitCode = err.code ?? '?'
  }

  const combined = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n')
  const { added, removed } = lineDiff(finding.evidence, combined)
  const verdict: ValidationVerdict =
    added.length === 0 && removed.length === 0 ? 'reproduces' : 'differs'

  await appendEvidenceEntry(cwd, {
    type: 'validation',
    findingId,
    verdict,
    method: 'replay',
    command,
    exitCode,
    summary: `[validate-finding] verdict=${verdict} exitCode=${exitCode} added=${added.length} removed=${removed.length}`,
    confidenceScore: verdict === 'reproduces' ? 1 : 0.25,
  })

  return {
    verdict,
    exitCode,
    addedLines: added,
    removedLines: removed,
    output: combined,
  }
}
