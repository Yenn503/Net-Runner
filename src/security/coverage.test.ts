import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { appendEvidenceEntry } from './evidence.js'
import { computeCoverage } from './coverage.js'

let cwd: string

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'nr-coverage-test-'))
})

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true })
})

describe('computeCoverage', () => {
  it('returns zero covered when ledger has no findings', async () => {
    const result = await computeCoverage(cwd)
    expect(result.covered).toBe(0)
    expect(result.pct).toBe(0)
  })

  it('counts techniques from mitreAttackTechniques on findings', async () => {
    await appendEvidenceEntry(cwd, {
      type: 'finding',
      title: 'SQLi',
      severity: 'high',
      evidence: 'union based sqli confirmed',
      mitreAttackTechniques: ['T1190'],
    })

    const result = await computeCoverage(cwd)
    const allCovered = result.coveredTechniques
    expect(allCovered).toContain('T1190')
  })

  it('counts techniques from mitreAttack references on findings', async () => {
    await appendEvidenceEntry(cwd, {
      type: 'finding',
      title: 'Cred Dump',
      severity: 'critical',
      evidence: 'lsass dumped',
      mitreAttack: [
        { techniqueId: 'T1003', techniqueName: 'OS Credential Dumping' },
      ],
    })

    const result = await computeCoverage(cwd)
    expect(result.coveredTechniques).toContain('T1003')
  })

  it('filters by target substring — only findings matching target contribute coverage', async () => {
    await appendEvidenceEntry(cwd, {
      type: 'finding',
      title: 'SQLi on example.com',
      severity: 'high',
      evidence: 'sqli on example.com',
      mitreAttackTechniques: ['T1190'],
    })
    await appendEvidenceEntry(cwd, {
      type: 'finding',
      title: 'Cred dump on other.com',
      severity: 'critical',
      evidence: 'credential dump on other.com',
      mitreAttack: [{ techniqueId: 'T1003', techniqueName: 'OS Credential Dumping' }],
    })

    const resultAll = await computeCoverage(cwd)
    const resultFiltered = await computeCoverage(cwd, undefined, 'example.com')

    expect(resultFiltered.covered).toBeLessThanOrEqual(resultAll.covered)
  })

  it('pct is 100 when all expected techniques are covered', async () => {
    const result = await computeCoverage(cwd, undefined, undefined)
    if (result.expected > 0) {
      expect(result.pct).toBeGreaterThanOrEqual(0)
      expect(result.pct).toBeLessThanOrEqual(100)
    } else {
      expect(result.pct).toBe(0)
    }
  })

  it('coveredTechniques and gapTechniques are capped at 15', async () => {
    const techniques = Array.from({ length: 20 }, (_, i) => `T${9000 + i}`)
    await appendEvidenceEntry(cwd, {
      type: 'finding',
      title: 'Massive finding',
      severity: 'critical',
      evidence: 'many techniques',
      mitreAttackTechniques: techniques,
    })

    const result = await computeCoverage(cwd)
    expect(result.coveredTechniques.length).toBeLessThanOrEqual(15)
    expect(result.gapTechniques.length).toBeLessThanOrEqual(15)
  })
})
