import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { appendEvidenceEntry } from './evidence.js'
import { validateFinding } from './validateFinding.js'

let cwd: string

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'nr-validate-test-'))
})

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true })
})

describe('validateFinding', () => {
  it('returns absent when finding id does not exist', async () => {
    const result = await validateFinding(cwd, 'nonexistent-id')
    expect(result.verdict).toBe('absent')
    expect(result.exitCode).toBe(-1)
  })

  it('verdict=reproduces when command output matches evidence', async () => {
    const entry = await appendEvidenceEntry(cwd, {
      type: 'finding',
      title: 'Test Finding',
      severity: 'low',
      evidence: 'hello world',
      replayCommand: 'echo "hello world"',
    })

    const result = await validateFinding(cwd, entry.id)
    expect(result.verdict).toBe('reproduces')
    expect(result.addedLines).toHaveLength(0)
    expect(result.removedLines).toHaveLength(0)
  })

  it('verdict=differs when command output diverges from evidence', async () => {
    const entry = await appendEvidenceEntry(cwd, {
      type: 'finding',
      title: 'Test Finding 2',
      severity: 'medium',
      evidence: 'original output line\nsome other line',
      replayCommand: 'echo "completely different output"',
    })

    const result = await validateFinding(cwd, entry.id)
    expect(result.verdict).toBe('differs')
    expect(result.addedLines.length).toBeGreaterThan(0)
    expect(result.removedLines.length).toBeGreaterThan(0)
  })

  it('uses command_override when finding has no replayCommand', async () => {
    const entry = await appendEvidenceEntry(cwd, {
      type: 'finding',
      title: 'Override Test',
      severity: 'info',
      evidence: 'override result',
    })

    const result = await validateFinding(cwd, entry.id, 'echo "override result"')
    expect(result.verdict).toBe('reproduces')
  })

  it('throws when finding has no command and no override', async () => {
    const entry = await appendEvidenceEntry(cwd, {
      type: 'finding',
      title: 'No Command Finding',
      severity: 'info',
      evidence: 'some evidence',
    })

    await expect(validateFinding(cwd, entry.id)).rejects.toThrow('no replayCommand')
  })

  it('appends a validation note to the evidence ledger', async () => {
    const entry = await appendEvidenceEntry(cwd, {
      type: 'finding',
      title: 'Audited Finding',
      severity: 'high',
      evidence: 'test output',
      replayCommand: 'echo "test output"',
    })

    await validateFinding(cwd, entry.id)

    const { readEvidenceEntries } = await import('./evidence.js')
    const entries = await readEvidenceEntries(cwd)
    const notes = entries.filter(e => e.type === 'note')
    expect(notes.length).toBeGreaterThan(0)
    const noteEntry = notes[notes.length - 1]
    expect((noteEntry as any).note).toContain('[validate-finding]')
    expect((noteEntry as any).note).toContain(entry.id)
  })
})
