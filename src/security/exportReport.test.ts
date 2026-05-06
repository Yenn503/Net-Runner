import assert from 'node:assert/strict'
import test from 'node:test'

import { buildSarif, buildStix, buildMisp } from './exportReport.ts'
import type { FindingEntry } from './evidence.ts'

const now = new Date().toISOString()

const sampleFindings: FindingEntry[] = [
  {
    id: 'find-001',
    type: 'finding',
    createdAt: now,
    title: 'SQL Injection in login endpoint',
    severity: 'critical',
    evidence: "Parameter 'username' reflected raw SQL error: syntax error near '1=1'",
    recommendation: 'Use parameterized queries.',
    cweIds: ['CWE-89'],
    mitreAttackTechniques: ['T1190'],
    owaspCategory: ['A03:2021-Injection'],
    replayRequest: 'https://target.lab/api/login?username=admin%27--',
  },
  {
    id: 'find-002',
    type: 'finding',
    createdAt: now,
    title: 'Missing HSTS header',
    severity: 'low',
    evidence: 'Response headers do not include Strict-Transport-Security.',
    cweIds: ['CWE-319'],
  },
]

const meta = {
  engagementName: 'test-engagement',
  version: '0.1.6',
  startTimeUtc: now,
  endTimeUtc: now,
}

test('buildSarif: produces valid SARIF 2.1.0 skeleton', () => {
  const sarif = buildSarif(sampleFindings, meta) as any

  assert.equal(sarif.version, '2.1.0')
  assert.equal(sarif.$schema, 'https://json.schemastore.org/sarif-2.1.0.json')
  assert.ok(Array.isArray(sarif.runs))
  assert.equal(sarif.runs.length, 1)

  const run = sarif.runs[0]
  assert.equal(run.tool.driver.name, 'Net-Runner')
  assert.equal(run.tool.driver.version, meta.version)
  assert.ok(Array.isArray(run.tool.driver.rules))
  assert.ok(run.tool.driver.rules.length >= 2)

  assert.ok(Array.isArray(run.results))
  assert.equal(run.results.length, 2)

  const critical = run.results[0]
  assert.equal(critical.ruleId, 'CWE-89')
  assert.equal(critical.level, 'error')
  assert.ok(critical.message.text.includes('SQL Injection'))
  assert.deepEqual(critical.properties.tags, ['T1190', 'A03:2021-Injection'])
  assert.ok(critical.locations[0].physicalLocation.artifactLocation.uri.includes('target.lab'))

  const low = run.results[1]
  assert.equal(low.level, 'note')
  assert.equal(low.ruleId, 'CWE-319')

  assert.equal(run.invocations[0].executionSuccessful, true)
})

test('buildStix: produces valid STIX 2.1 bundle', () => {
  const bundle = buildStix(sampleFindings, meta) as any

  assert.equal(bundle.type, 'bundle')
  assert.ok(bundle.id.startsWith('bundle--'))
  assert.ok(Array.isArray(bundle.objects))

  const vulns = bundle.objects.filter((o: any) => o.type === 'vulnerability')
  assert.equal(vulns.length, 2)

  for (const v of vulns) {
    assert.equal(v.spec_version, '2.1')
    assert.ok(v.id.startsWith('vulnerability--'))
    assert.ok(typeof v.name === 'string' && v.name.length > 0)
    assert.ok(typeof v.created === 'string')
    assert.ok(typeof v.modified === 'string')
  }

  const firstVuln = vulns[0]
  assert.ok(Array.isArray(firstVuln.external_references))
  const cweRef = firstVuln.external_references.find((r: any) => r.source_name === 'cwe')
  assert.ok(cweRef, 'expected CWE external_reference')
  assert.equal(cweRef.external_id, 'CWE-89')

  const reports = bundle.objects.filter((o: any) => o.type === 'report')
  assert.equal(reports.length, 1)
  const report = reports[0]
  assert.equal(report.spec_version, '2.1')
  assert.ok(report.id.startsWith('report--'))
  assert.deepEqual(report.report_types, ['threat-report'])
  assert.equal(report.object_refs.length, 2)
  assert.ok(typeof report.published === 'string')
})

test('buildMisp: produces valid MISP event JSON', () => {
  const misp = buildMisp(sampleFindings, meta) as any

  assert.ok(misp.Event, 'expected Event key')
  const evt = misp.Event

  assert.equal(evt.info, meta.engagementName)
  assert.equal(evt.threat_level_id, 1)
  assert.equal(evt.analysis, 2)
  assert.equal(evt.distribution, 0)
  assert.ok(typeof evt.date === 'string')

  assert.ok(Array.isArray(evt.Attribute) && evt.Attribute.length >= 2)
  const textAttr = evt.Attribute.find((a: any) => a.category === 'External analysis')
  assert.ok(textAttr, 'expected External analysis attribute')
  assert.equal(textAttr.type, 'text')

  const urlAttr = evt.Attribute.find((a: any) => a.category === 'Network activity')
  assert.ok(urlAttr, 'expected Network activity attribute for URL finding')
  assert.equal(urlAttr.type, 'url')

  assert.ok(Array.isArray(evt.Tag))
  const tagNames = evt.Tag.map((t: any) => t.name)
  assert.ok(tagNames.some((n: string) => n.includes('T1190')))
  assert.ok(tagNames.some((n: string) => n.includes('A03:2021-Injection')))
})
