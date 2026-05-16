import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

import {
  appendDiscoveredArsenal,
  loadArsenal,
  matchArsenal,
  sortArsenalHits,
} from './arsenal.js'
import {
  getArsenalIndexDir,
  getDiscoveredArsenalPath,
} from './paths.js'

const WINDOWS_YAML = `exploits:
  - id: clfs-lpe-2023-28252
    cve: CVE-2023-28252
    name: Windows Common Log File System (CLFS) driver LPE
    exploit_type: privilege-escalation
    affected_versions: Windows 10/11 / Server — clfs.sys (pre-Apr-2023 patch)
    references:
      - https://nvd.nist.gov/vuln/detail/CVE-2023-28252
    source: https://nvd.nist.gov/vuln/detail/CVE-2023-28252
    reliability: high
    validation_status: unvalidated
    prerequisites: Local code execution as a standard user
    execution_environment: windows-target
    detection_notes: CISA KEV — actively exploited
    execution_adapter: metasploit
    operator_notes: Reliable LPE to SYSTEM on unpatched builds.

  - id: bluehammer
    cve: none
    name: BlueHammer — Defender RPC vulnerability
    exploit_type: defense-evasion
    affected_versions: Windows Defender — windefend RPC interface (build-specific)
    references:
      - https://github.com/Nightmare-Eclipse/BlueHammer
    source: https://github.com/Nightmare-Eclipse/BlueHammer
    reliability: unverified
    validation_status: unvalidated
    prerequisites: Local code execution on the target host
    execution_environment: windows-target
    detection_notes: Touches windefend RPC surface.
    execution_adapter: manual
    operator_notes: Community PoC, no assigned CVE.
`

const WEB_YAML = `exploits:
  - id: log4shell
    cve: CVE-2021-44228
    name: Log4Shell — Apache Log4j2 JNDI RCE
    exploit_type: rce
    affected_versions: Apache Log4j2 2.0-beta9 – 2.14.1
    references:
      - https://nvd.nist.gov/vuln/detail/CVE-2021-44228
    source: https://nvd.nist.gov/vuln/detail/CVE-2021-44228
    reliability: high
    validation_status: unvalidated
    prerequisites: An app field whose value reaches a vulnerable Log4j2 logger
    execution_environment: network
    detection_notes: CISA KEV.
    execution_adapter: nuclei
    operator_notes: Confirm blind hits with the oob-verification skill.
`

async function seedArsenal(cwd: string): Promise<void> {
  const dir = getArsenalIndexDir(cwd)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'windows.yaml'), WINDOWS_YAML, 'utf8')
  await writeFile(join(dir, 'web-and-appliance.yaml'), WEB_YAML, 'utf8')
}

describe('arsenal loader', () => {
  let cwd: string

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'nr-arsenal-'))
  })
  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true })
  })

  it('returns empty result when no arsenal directory exists', async () => {
    const out = await loadArsenal(cwd)
    expect(out.entries).toEqual([])
    expect(out.errors).toEqual([])
  })

  it('loads every entry across surfaces and tags surface from filename', async () => {
    await seedArsenal(cwd)
    const out = await loadArsenal(cwd)
    expect(out.errors).toEqual([])
    expect(out.entries).toHaveLength(3)
    const surfaces = new Set(out.entries.map(e => e.surface))
    expect(surfaces).toEqual(new Set(['windows', 'web-and-appliance']))
  })

  it('reports missing required fields without throwing', async () => {
    const dir = getArsenalIndexDir(cwd)
    await mkdir(dir, { recursive: true })
    await writeFile(
      join(dir, 'bad.yaml'),
      `exploits:\n  - id: oops\n    cve: none\n`,
      'utf8',
    )
    const out = await loadArsenal(cwd)
    expect(out.entries).toEqual([])
    expect(out.errors).toHaveLength(1)
    expect(out.errors[0]!.reason).toContain('missing field')
  })
})

describe('arsenal matcher', () => {
  let cwd: string
  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'nr-arsenal-'))
    await seedArsenal(cwd)
  })
  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true })
  })

  it('matches by exact CVE', async () => {
    const { entries } = await loadArsenal(cwd)
    const hits = matchArsenal(entries, { cve: 'CVE-2021-44228' })
    expect(hits).toHaveLength(1)
    expect(hits[0]!.id).toBe('log4shell')
  })

  it('matches by product substring across name + affected_versions', async () => {
    const { entries } = await loadArsenal(cwd)
    const hits = matchArsenal(entries, { product: 'log4j' })
    expect(hits.map(h => h.id)).toEqual(['log4shell'])
  })

  it('restricts by surface', async () => {
    const { entries } = await loadArsenal(cwd)
    const hits = matchArsenal(entries, { surface: 'windows' })
    expect(hits).toHaveLength(2)
    expect(new Set(hits.map(h => h.id))).toEqual(
      new Set(['clfs-lpe-2023-28252', 'bluehammer']),
    )
  })

  it('filters by exploit_type', async () => {
    const { entries } = await loadArsenal(cwd)
    const hits = matchArsenal(entries, { exploit_type: 'rce' })
    expect(hits.map(h => h.id)).toEqual(['log4shell'])
  })

  it('honours min_reliability threshold', async () => {
    const { entries } = await loadArsenal(cwd)
    const hits = matchArsenal(entries, { min_reliability: 'high' })
    expect(hits.map(h => h.id).sort()).toEqual(['clfs-lpe-2023-28252', 'log4shell'])
  })

  it('AND-combines product + exploit_type filters', async () => {
    const { entries } = await loadArsenal(cwd)
    const hits = matchArsenal(entries, {
      product: 'windows',
      exploit_type: 'privilege-escalation',
    })
    expect(hits.map(h => h.id)).toEqual(['clfs-lpe-2023-28252'])
  })

  it('sortArsenalHits orders by reliability descending', async () => {
    const { entries } = await loadArsenal(cwd)
    const sorted = sortArsenalHits(entries)
    // BlueHammer (unverified) should land after the two high-reliability entries.
    expect(sorted[sorted.length - 1]!.id).toBe('bluehammer')
  })
})

describe('discovered.jsonl append', () => {
  let cwd: string
  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'nr-arsenal-'))
  })
  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true })
  })

  it('appends one JSON object per line and creates the parent dir', async () => {
    const path = await appendDiscoveredArsenal(cwd, {
      engagement: 'demo',
      target: 'https://target/',
      cve: 'CVE-2021-44228',
      name: 'Log4Shell',
      exploit_type: 'rce',
      reliability: 'high',
      validation_status: 'validated-target',
      execution_adapter: 'nuclei',
      evidence: '.netrunner/findings/abc.json',
      operator_notes: 'blind hit confirmed via OOB',
    })
    expect(path).toBe(getDiscoveredArsenalPath(cwd))
    const body = await readFile(path, 'utf8')
    const lines = body.trim().split('\n')
    expect(lines).toHaveLength(1)
    const record = JSON.parse(lines[0]!)
    expect(record.cve).toBe('CVE-2021-44228')
    expect(record.operator_notes).toBe('blind hit confirmed via OOB')
    expect(typeof record.ts).toBe('string')
  })

  it('omits operator_notes when not supplied', async () => {
    const path = await appendDiscoveredArsenal(cwd, {
      engagement: 'demo',
      target: '10.0.0.1',
      cve: 'none',
      name: 'PoC',
      exploit_type: 'rce',
      reliability: 'unverified',
      validation_status: 'validated-lab',
      execution_adapter: 'manual',
      evidence: '.netrunner/findings/x.json',
    })
    const record = JSON.parse((await readFile(path, 'utf8')).trim())
    expect('operator_notes' in record).toBe(false)
  })
})
