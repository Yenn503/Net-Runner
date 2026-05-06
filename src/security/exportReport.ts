import { randomUUID } from 'crypto'
import type { FindingEntry, ValidationEntry } from './evidence.js'

export type ExportFormat = 'markdown' | 'html' | 'sarif' | 'stix' | 'misp'

export type ExportMeta = {
  engagementName: string
  version: string
  startTimeUtc: string
  endTimeUtc: string
}

type SarifLevel = 'error' | 'warning' | 'note' | 'none'
type ValidationMap = Map<string, ValidationEntry>

function evidenceStatusFor(finding: FindingEntry, validations?: ValidationMap): string {
  const validation = validations?.get(finding.id)
  if (!validation) return 'unvalidated'
  if (validation.verdict === 'reproduces') return 'validated'
  if (validation.verdict === 'differs' || validation.verdict === 'not_reproducible') return 'disputed'
  return 'inconclusive'
}

function validationSummaryFor(finding: FindingEntry, validations?: ValidationMap): string {
  const validation = validations?.get(finding.id)
  if (!validation) return 'No typed validation entry recorded.'
  return `${validation.method}:${validation.verdict} ${validation.summary}`
}

function severityToSarifLevel(severity: string): SarifLevel {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error'
    case 'medium':
      return 'warning'
    case 'low':
    case 'info':
      return 'note'
    default:
      return 'none'
  }
}

function collectUniqueRules(findings: FindingEntry[]): Array<{
  id: string
  name: string
  shortDescription: { text: string }
  helpUri?: string
}> {
  const seen = new Map<string, { id: string; name: string; shortDescription: { text: string }; helpUri?: string }>()
  for (const f of findings) {
    const cweIds = f.cweIds ?? []
    if (cweIds.length > 0) {
      for (const cwe of cweIds) {
        if (!seen.has(cwe)) {
          seen.set(cwe, {
            id: cwe,
            name: cwe,
            shortDescription: { text: cwe },
            helpUri: `https://cwe.mitre.org/data/definitions/${cwe.replace(/^CWE-/i, '')}.html`,
          })
        }
      }
    } else if (!seen.has(f.id)) {
      seen.set(f.id, {
        id: f.id,
        name: f.title,
        shortDescription: { text: f.title },
      })
    }
  }
  return Array.from(seen.values())
}

export function buildSarif(
  findings: FindingEntry[],
  meta: ExportMeta,
  validations?: ValidationMap,
): Record<string, unknown> {
  const rules = collectUniqueRules(findings)

  const results = findings.map(f => {
    const ruleId =
      f.cweIds && f.cweIds.length > 0 ? f.cweIds[0]! : f.id

    const tags: string[] = []
    const techniques = f.mitreAttackTechniques ?? f.mitreAttack?.map(m => m.techniqueId) ?? []
    tags.push(...techniques)
    const owaspArr = Array.isArray(f.owaspCategory) ? f.owaspCategory : f.owaspCategory ? [f.owaspCategory] : []
    tags.push(...owaspArr)

    const messageText = f.evidence
      ? `${f.title}\n\n${f.evidence}`
      : f.title

    const result: Record<string, unknown> = {
      ruleId,
      level: severityToSarifLevel(f.severity),
      message: { text: messageText },
    }

    result.properties = {
      tags,
      evidenceStatus: evidenceStatusFor(f, validations),
      validation: validationSummaryFor(f, validations),
      evidenceSource: f.evidenceSource ?? 'not-recorded',
      affectedAssets: f.affectedAssets ?? [],
      confidence: f.confidence ?? 'not-recorded',
    }

    if (f.replayRequest) {
      try {
        const url = new URL(f.replayRequest)
        result.locations = [
          {
            physicalLocation: {
              artifactLocation: { uri: url.toString() },
            },
          },
        ]
      } catch {
        // not a parseable URL — omit locations
      }
    }

    return result
  })

  return {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'Net-Runner',
            version: meta.version,
            informationUri: 'https://github.com/net-runner/net-runner',
            rules,
          },
        },
        results,
        invocations: [
          {
            executionSuccessful: true,
            startTimeUtc: meta.startTimeUtc,
            endTimeUtc: meta.endTimeUtc,
          },
        ],
      },
    ],
  }
}

function stixTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toISOString().replace(/(\.\d{3})Z$/, '$1Z')
}

function buildExternalRefs(f: FindingEntry): Array<Record<string, unknown>> {
  const refs: Array<Record<string, unknown>> = []

  for (const cwe of f.cweIds ?? []) {
    refs.push({
      source_name: 'cwe',
      url: `https://cwe.mitre.org/data/definitions/${cwe.replace(/^CWE-/i, '')}.html`,
      external_id: cwe,
    })
  }

  const techniques = f.mitreAttackTechniques ?? f.mitreAttack?.map(m => m.techniqueId) ?? []
  for (const tid of techniques) {
    refs.push({
      source_name: 'mitre-attack',
      url: `https://attack.mitre.org/techniques/${tid.replace('.', '/')}`,
      external_id: tid,
    })
  }

  if (f.cvss) {
    refs.push({
      source_name: 'cvss',
      description: `CVSS ${f.cvss.version} ${f.cvss.vector} score=${f.cvss.baseScore}`,
      external_id: f.cvss.vector,
    })
  }

  return refs
}

export function buildStix(
  findings: FindingEntry[],
  meta: ExportMeta,
  validations?: ValidationMap,
): Record<string, unknown> {
  const now = stixTimestamp(meta.endTimeUtc)
  const vulnerabilityObjects: Array<Record<string, unknown>> = []
  const vulnIds: string[] = []

  for (const f of findings) {
    const vulnId = `vulnerability--${randomUUID()}`
    vulnIds.push(vulnId)
    const refs = buildExternalRefs(f)

    const vuln: Record<string, unknown> = {
      type: 'vulnerability',
      spec_version: '2.1',
      id: vulnId,
      created: stixTimestamp(f.createdAt),
      modified: stixTimestamp(f.createdAt),
      name: f.title,
      description: `[evidence-status:${evidenceStatusFor(f, validations)}] ${f.evidence}`,
      x_net_runner_validation: validationSummaryFor(f, validations),
    }

    if (refs.length > 0) {
      vuln.external_references = refs
    }

    vulnerabilityObjects.push(vuln)
  }

  const report: Record<string, unknown> = {
    type: 'report',
    spec_version: '2.1',
    id: `report--${randomUUID()}`,
    created: now,
    modified: now,
    name: meta.engagementName,
    report_types: ['threat-report'],
    object_refs: vulnIds,
    published: now,
  }

  return {
    type: 'bundle',
    id: `bundle--${randomUUID()}`,
    objects: [...vulnerabilityObjects, report],
  }
}

function severityToMispThreatLevel(severity: string): number {
  switch (severity) {
    case 'critical':
    case 'high':
      return 1
    case 'medium':
      return 2
    case 'low':
    case 'info':
      return 3
    default:
      return 4
  }
}

function parsableUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function buildMisp(
  findings: FindingEntry[],
  meta: ExportMeta,
  validations?: ValidationMap,
): Record<string, unknown> {
  const maxLevel = findings.reduce((acc, f) => {
    const lvl = severityToMispThreatLevel(f.severity)
    return lvl < acc ? lvl : acc
  }, 4)

  const attributes: Array<Record<string, unknown>> = []
  const tagSet = new Set<string>()

  for (const f of findings) {
    const attrBase = {
      uuid: randomUUID(),
      to_ids: false,
      comment: f.recommendation ?? '',
    }

    attributes.push({
      ...attrBase,
      category: 'External analysis',
      type: 'text',
      value: `[${f.severity.toUpperCase()}][${evidenceStatusFor(f, validations).toUpperCase()}] ${f.title}\n${f.evidence}\nValidation: ${validationSummaryFor(f, validations)}`,
    })

    if (f.replayRequest && parsableUrl(f.replayRequest)) {
      attributes.push({
        ...attrBase,
        uuid: randomUUID(),
        category: 'Network activity',
        type: 'url',
        value: f.replayRequest,
      })
    }

    const techniques = f.mitreAttackTechniques ?? f.mitreAttack?.map(m => m.techniqueId) ?? []
    for (const tid of techniques) {
      tagSet.add(`misp-galaxy:mitre-attack-pattern="${tid}"`)
    }
    const owaspArr = Array.isArray(f.owaspCategory) ? f.owaspCategory : f.owaspCategory ? [f.owaspCategory] : []
    for (const cat of owaspArr) {
      tagSet.add(`owasp:${cat}`)
    }
    for (const cwe of f.cweIds ?? []) {
      tagSet.add(`vulnerability:${cwe}`)
    }
  }

  const tags = Array.from(tagSet).map(name => ({ name }))

  return {
    Event: {
      info: meta.engagementName,
      threat_level_id: maxLevel,
      analysis: 2,
      distribution: 0,
      date: meta.endTimeUtc.slice(0, 10),
      Attribute: attributes,
      Tag: tags,
    },
  }
}
