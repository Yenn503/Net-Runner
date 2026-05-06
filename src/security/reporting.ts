import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import type { EngagementManifest } from './engagement.js'
import type {
  ArtifactEntry,
  ComplianceReference,
  EvidenceEntry,
  EvidenceSeverity,
  ExecutionStepEntry,
  FindingEntry,
  GuardrailEntry,
  ValidationEntry,
} from './evidence.js'
import { getReportsDir } from './paths.js'

const SEVERITY_ORDER: Record<EvidenceSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}

const SEVERITY_LABEL: Record<EvidenceSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
}

const SEVERITY_COLOR: Record<EvidenceSeverity, string> = {
  critical: '#b42318',
  high: '#d92d20',
  medium: '#dc6803',
  low: '#1570ef',
  info: '#475467',
}

type SeverityCounts = Record<EvidenceSeverity, number>

type ReportModel = {
  manifest: EngagementManifest
  findings: FindingEntry[]
  notes: Extract<EvidenceEntry, { type: 'note' }>[]
  artifacts: ArtifactEntry[]
  guardrails: GuardrailEntry[]
  executionSteps: ExecutionStepEntry[]
  approvals: Extract<EvidenceEntry, { type: 'approval' }>[]
  validations: ValidationEntry[]
  validationsByFindingId: Map<string, ValidationEntry>
  severityCounts: SeverityCounts
  complianceRows: ComplianceSummaryRow[]
  mitreRows: MitreSummaryRow[]
}

type FindingEvidenceStatus = 'Validated' | 'Disputed' | 'Inconclusive' | 'Unvalidated'

type ComplianceSummaryRow = {
  framework: string
  controls: string
  findings: string[]
}

type MitreSummaryRow = {
  technique: string
  tactic: string
  findings: string[]
}

function getFindings(entries: EvidenceEntry[]): FindingEntry[] {
  return entries
    .filter((entry): entry is FindingEntry => entry.type === 'finding')
    .sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity])
}

function buildSeverityCounts(findings: FindingEntry[]): SeverityCounts {
  return findings.reduce<SeverityCounts>(
    (counts, finding) => {
      counts[finding.severity] += 1
      return counts
    },
    {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    },
  )
}

function formatList(items: string[] | undefined, fallback = 'Not recorded'): string {
  return items && items.length > 0 ? items.join(', ') : fallback
}

function formatMitreAttack(finding: FindingEntry): string {
  if (!finding.mitreAttack || finding.mitreAttack.length === 0) {
    const techniques = finding.mitreAttackTechniques ?? []
    return techniques.length > 0 ? techniques.join(', ') : 'Not recorded'
  }

  return finding.mitreAttack
    .map(reference => {
      const parts = [reference.techniqueId]
      if (reference.subtechniqueId) {
        parts.push(reference.subtechniqueId)
      }

      let label = parts.join(' / ')
      if (reference.techniqueName) {
        label += ` ${reference.techniqueName}`
      }
      if (reference.tacticName) {
        label += ` (${reference.tacticName})`
      }

      return label
    })
    .join(', ')
}

function formatComplianceReferences(
  references: ComplianceReference[] | undefined,
): string {
  if (!references || references.length === 0) {
    return 'Not recorded'
  }

  return references
    .map(reference => `${reference.framework}: ${reference.controls.join(', ')}`)
    .join(' | ')
}

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildComplianceRows(findings: FindingEntry[]): ComplianceSummaryRow[] {
  const rows = new Map<string, ComplianceSummaryRow>()
  for (const finding of findings) {
    for (const reference of finding.compliance ?? []) {
      const key = `${reference.framework}:${reference.controls.join(',')}`
      const existing = rows.get(key) ?? {
        framework: reference.framework,
        controls: reference.controls.join(', '),
        findings: [],
      }
      existing.findings.push(finding.title)
      rows.set(key, existing)
    }
  }
  return [...rows.values()].sort((left, right) =>
    `${left.framework}:${left.controls}`.localeCompare(`${right.framework}:${right.controls}`),
  )
}

function buildMitreRows(findings: FindingEntry[]): MitreSummaryRow[] {
  const rows = new Map<string, MitreSummaryRow>()
  for (const finding of findings) {
    if (finding.mitreAttack && finding.mitreAttack.length > 0) {
      for (const reference of finding.mitreAttack) {
        const key = reference.subtechniqueId
          ? `${reference.techniqueId}/${reference.subtechniqueId}`
          : reference.techniqueId
        const existing = rows.get(key) ?? {
          technique: reference.techniqueName
            ? `${key} ${reference.techniqueName}`
            : key,
          tactic: reference.tacticName ?? 'Not recorded',
          findings: [],
        }
        existing.findings.push(finding.title)
        rows.set(key, existing)
      }
      continue
    }

    for (const technique of finding.mitreAttackTechniques ?? []) {
      const existing = rows.get(technique) ?? {
        technique,
        tactic: 'Not recorded',
        findings: [],
      }
      existing.findings.push(finding.title)
      rows.set(technique, existing)
    }
  }
  return [...rows.values()].sort((left, right) =>
    left.technique.localeCompare(right.technique),
  )
}

function buildValidationMap(entries: EvidenceEntry[]): Map<string, ValidationEntry> {
  const map = new Map<string, ValidationEntry>()
  for (const entry of entries) {
    if (entry.type === 'validation') {
      map.set(entry.findingId, entry)
    }
  }
  return map
}

function getEvidenceStatus(
  finding: FindingEntry,
  validationsByFindingId: Map<string, ValidationEntry>,
): FindingEvidenceStatus {
  const validation = validationsByFindingId.get(finding.id)
  if (!validation) return 'Unvalidated'
  if (validation.verdict === 'reproduces') return 'Validated'
  if (validation.verdict === 'differs' || validation.verdict === 'not_reproducible') {
    return 'Disputed'
  }
  return 'Inconclusive'
}

function formatValidation(
  finding: FindingEntry,
  validationsByFindingId: Map<string, ValidationEntry>,
): string {
  const validation = validationsByFindingId.get(finding.id)
  if (!validation) {
    return 'Unvalidated: no replay, statistical, OOB, or artifact-review validation recorded.'
  }
  const score =
    typeof validation.confidenceScore === 'number'
      ? `; confidence ${Math.round(validation.confidenceScore * 100)}%`
      : ''
  return `${getEvidenceStatus(finding, validationsByFindingId)}: ${validation.method}; verdict ${validation.verdict}${score}; ${validation.summary}`
}

function buildReportModel(
  manifest: EngagementManifest,
  entries: EvidenceEntry[],
): ReportModel {
  const findings = getFindings(entries)
  const validationsByFindingId = buildValidationMap(entries)
  return {
    manifest,
    findings,
    notes: entries.filter((entry): entry is Extract<EvidenceEntry, { type: 'note' }> => entry.type === 'note'),
    artifacts: entries.filter((entry): entry is ArtifactEntry => entry.type === 'artifact'),
    guardrails: entries.filter((entry): entry is GuardrailEntry => entry.type === 'guardrail'),
    executionSteps: entries.filter((entry): entry is ExecutionStepEntry => entry.type === 'execution_step'),
    approvals: entries.filter((entry): entry is Extract<EvidenceEntry, { type: 'approval' }> => entry.type === 'approval'),
    validations: entries.filter((entry): entry is ValidationEntry => entry.type === 'validation'),
    validationsByFindingId,
    severityCounts: buildSeverityCounts(findings),
    complianceRows: buildComplianceRows(findings),
    mitreRows: buildMitreRows(findings),
  }
}

function buildFindingSummary(model: ReportModel): string {
  const { findings, severityCounts } = model
  if (findings.length === 0) {
    return '- No findings recorded'
  }

  const cvssBreakdown = findings
    .filter(finding => finding.cvss)
    .map(
      finding =>
        `${finding.title}: ${finding.cvss?.baseScore.toFixed(1)} ${finding.cvss?.baseSeverity.toUpperCase()}`,
    )

  const validationCounts = findings.reduce<Record<FindingEvidenceStatus, number>>(
    (counts, finding) => {
      counts[getEvidenceStatus(finding, model.validationsByFindingId)] += 1
      return counts
    },
    { Validated: 0, Disputed: 0, Inconclusive: 0, Unvalidated: 0 },
  )

  return [
    `- Total findings: ${findings.length}`,
    `- Severity counts: critical=${severityCounts.critical}, high=${severityCounts.high}, medium=${severityCounts.medium}, low=${severityCounts.low}, info=${severityCounts.info}`,
    `- Evidence status: validated=${validationCounts.Validated}, unvalidated=${validationCounts.Unvalidated}, inconclusive=${validationCounts.Inconclusive}, disputed=${validationCounts.Disputed}`,
    `- CVSS coverage: ${cvssBreakdown.length > 0 ? cvssBreakdown.join(' | ') : 'No CVSS metadata recorded'}`,
  ].join('\n')
}

function buildExecutiveNarrative(model: ReportModel): string {
  if (model.findings.length === 0) {
    return 'No validated findings are currently recorded in the evidence ledger. The report is ready to update as findings are captured.'
  }

  const top = model.findings[0]
  const criticalHigh = model.severityCounts.critical + model.severityCounts.high
  const targetText =
    model.manifest.targets.length > 0
      ? model.manifest.targets.join(', ')
      : 'the scoped target set'
  return [
    `Net-Runner assessed ${targetText} under the ${model.manifest.workflowId} workflow and recorded ${model.findings.length} finding(s).`,
    `${criticalHigh} finding(s) are Critical or High priority.`,
    `The highest-priority issue is "${top.title}" (${SEVERITY_LABEL[top.severity]}), currently marked ${getEvidenceStatus(top, model.validationsByFindingId).toLowerCase()} by the evidence ledger.`,
    'Remediation should start with externally reachable, unauthenticated, privilege-boundary, or credential-impacting issues, then proceed through lower-severity hardening work.',
  ].join(' ')
}

function buildPriorityRows(model: ReportModel): string[][] {
  return model.findings
    .filter(finding => finding.severity !== 'info')
    .slice(0, 5)
    .map(finding => [
      finding.severity.toUpperCase(),
      finding.title,
      getEvidenceStatus(finding, model.validationsByFindingId),
      finding.cvss ? finding.cvss.baseScore.toFixed(1) : 'Not scored',
      finding.recommendation ?? 'Define remediation owner and implement fix.',
      finding.replayRequest ?? finding.replayCommand ?? 'Retest with recorded evidence path.',
    ])
}

function findingMetadataRows(
  finding: FindingEntry,
  validationsByFindingId: Map<string, ValidationEntry>,
): string {
  return [
    `| Severity | ${finding.severity.toUpperCase()}${finding.cvss ? `; CVSS ${finding.cvss.baseScore.toFixed(1)} (${finding.cvss.baseSeverity.toUpperCase()})` : ''} |`,
    `| Evidence Status | ${escapeMarkdownTableCell(formatValidation(finding, validationsByFindingId))} |`,
    `| Evidence Source | ${finding.evidenceSource ?? 'Not recorded'} |`,
    `| Affected Assets | ${formatList(finding.affectedAssets)} |`,
    `| Analyst Confidence | ${finding.confidence ?? 'Not recorded'} |`,
    `| CVSS Vector | ${finding.cvss?.vector ?? 'Not recorded'} |`,
    `| CWE | ${formatList(finding.cweIds)} |`,
    `| OWASP | ${formatList(finding.owaspCategory)} |`,
    `| MITRE ATT&CK | ${escapeMarkdownTableCell(formatMitreAttack(finding))} |`,
    `| Compliance | ${escapeMarkdownTableCell(formatComplianceReferences(finding.compliance))} |`,
  ].join('\n')
}

function buildMarkdownFindingSection(model: ReportModel): string {
  if (model.findings.length === 0) {
    return 'No findings have been recorded yet.'
  }

  return model.findings
    .map(
      finding =>
        `## [${finding.severity.toUpperCase()}] ${finding.title}

| Field | Value |
|---|---|
${findingMetadataRows(finding, model.validationsByFindingId)}

**Evidence**

${finding.evidence}

**Reproduction**

${finding.replayRequest ? `- Request: \`${finding.replayRequest}\`` : '- Request: Not recorded'}
${finding.replayCommand ? `- Command: \`${finding.replayCommand}\`` : '- Command: Not recorded'}

**Impact**

${finding.cvss ? `${finding.cvss.baseSeverity.toUpperCase()} impact, CVSS ${finding.cvss.baseScore.toFixed(1)}.` : 'Impact pending CVSS scoring.'}

**Remediation**

${finding.recommendation ?? 'Pending'}

**Retest Criteria**

- Replay the recorded request or command.
- Confirm vulnerable signal is absent.
- Save current evidence and update finding status.
`,
    )
    .join('\n')
}

function markdownTable(
  headers: string[],
  rows: string[][],
  empty = '- None',
): string {
  if (rows.length === 0) {
    return empty
  }
  return [
    `| ${headers.join(' |')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.map(escapeMarkdownTableCell).join(' | ')} |`),
  ].join('\n')
}

function buildMarkdownReport(model: ReportModel): string {
  const findingSummary = buildFindingSummary(model)
  const notesSection =
    model.notes.length === 0
      ? '- None'
      : model.notes.map(note => `- ${note.note}`).join('\n')
  const artifactsSection = markdownTable(
    ['Label', 'Path', 'Description'],
    model.artifacts.map(artifact => [
      artifact.label,
      artifact.path,
      artifact.description ?? '',
    ]),
  )
  const guardrailSection = markdownTable(
    ['Decision', 'Action', 'Reason'],
    model.guardrails.map(entry => [
      entry.decision.action.toUpperCase(),
      entry.plannedAction,
      entry.decision.reason,
    ]),
  )
  const executionSection = markdownTable(
    ['Agent', 'Status', 'Tools', 'Duration ms', 'Summary'],
    model.executionSteps.map(entry => [
      entry.agentType,
      entry.status,
      String(entry.totalToolUseCount ?? 0),
      String(entry.totalDurationMs ?? 0),
      entry.summary ?? '',
    ]),
  )
  const approvalSection = markdownTable(
    ['Status', 'Review ID', 'Action', 'Reason'],
    model.approvals.map(entry => [
      entry.status.toUpperCase(),
      entry.reviewId,
      entry.plannedAction,
      entry.reason,
    ]),
  )
  const complianceSection = markdownTable(
    ['Framework', 'Controls', 'Findings'],
    model.complianceRows.map(row => [
      row.framework,
      row.controls,
      row.findings.join(', '),
    ]),
  )
  const mitreSection = markdownTable(
    ['Technique', 'Tactic', 'Findings'],
    model.mitreRows.map(row => [
      row.technique,
      row.tactic,
      row.findings.join(', '),
    ]),
  )
  const remediationRows = model.findings
    .filter(finding => finding.severity !== 'info')
    .map(finding => [
      finding.severity.toUpperCase(),
      finding.title,
      finding.recommendation ?? 'Pending',
      finding.replayRequest ?? finding.replayCommand ?? 'Not recorded',
    ])

  return `# Net-Runner Report

## Executive Summary

${buildExecutiveNarrative(model)}

${findingSummary}

## Priority Actions

${markdownTable(['Severity', 'Finding', 'Evidence Status', 'CVSS', 'Action', 'Retest Signal'], buildPriorityRows(model))}

## Engagement

- Name: ${model.manifest.name}
- Workflow: ${model.manifest.workflowId}
- Targets: ${model.manifest.targets.length > 0 ? model.manifest.targets.join(', ') : 'Not recorded'}
- Scope basis: ${model.manifest.authorization.scopeSummary}
- Max impact: ${model.manifest.authorization.maxImpact}

## Severity Dashboard

| Critical | High | Medium | Low | Info |
|---:|---:|---:|---:|---:|
| ${model.severityCounts.critical} | ${model.severityCounts.high} | ${model.severityCounts.medium} | ${model.severityCounts.low} | ${model.severityCounts.info} |

## Attack Path & Execution Narrative

${executionSection}

## Detailed Findings

${buildMarkdownFindingSection(model)}

## Remediation Backlog

${markdownTable(['Severity', 'Finding', 'Remediation', 'Retest Signal'], remediationRows)}

## Compliance Summary

${complianceSection}

## MITRE ATT&CK Coverage

${mitreSection}

## Notes

${notesSection}

## Artifacts

${artifactsSection}

## Guardrail Decisions

${guardrailSection}

## Review Decisions

${approvalSection}
`
}

function htmlList(items: string[]): string {
  if (items.length === 0) {
    return '<p class="muted">None recorded</p>'
  }
  return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function htmlTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) {
    return '<p class="muted">None recorded</p>'
  }
  return `<table><thead><tr>${headers
    .map(header => `<th>${escapeHtml(header)}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map(
      row =>
        `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
    )
    .join('')}</tbody></table>`
}

function buildHtmlFindingCards(model: ReportModel): string {
  if (model.findings.length === 0) {
    return '<p class="muted">No findings have been recorded yet.</p>'
  }

  return model.findings
    .map(finding => {
      const severityColor = SEVERITY_COLOR[finding.severity]
      return `<article class="finding">
  <div class="finding-head">
    <span class="pill" style="background:${severityColor}">${escapeHtml(SEVERITY_LABEL[finding.severity])}</span>
    <h3>${escapeHtml(finding.title)}</h3>
  </div>
  <div class="metadata-grid">
    <div><b>CVSS</b><span>${escapeHtml(finding.cvss ? `${finding.cvss.baseScore.toFixed(1)} ${finding.cvss.baseSeverity.toUpperCase()}` : 'Not recorded')}</span></div>
    <div><b>Evidence Status</b><span>${escapeHtml(formatValidation(finding, model.validationsByFindingId))}</span></div>
    <div><b>Evidence Source</b><span>${escapeHtml(finding.evidenceSource ?? 'Not recorded')}</span></div>
    <div><b>Affected Assets</b><span>${escapeHtml(formatList(finding.affectedAssets))}</span></div>
    <div><b>Analyst Confidence</b><span>${escapeHtml(finding.confidence ?? 'Not recorded')}</span></div>
    <div><b>Vector</b><span>${escapeHtml(finding.cvss?.vector ?? 'Not recorded')}</span></div>
    <div><b>CWE</b><span>${escapeHtml(formatList(finding.cweIds))}</span></div>
    <div><b>OWASP</b><span>${escapeHtml(formatList(finding.owaspCategory))}</span></div>
    <div><b>MITRE</b><span>${escapeHtml(formatMitreAttack(finding))}</span></div>
    <div><b>Compliance</b><span>${escapeHtml(formatComplianceReferences(finding.compliance))}</span></div>
  </div>
  <h4>Evidence</h4>
  <p>${escapeHtml(finding.evidence)}</p>
  <h4>Reproduction</h4>
  ${htmlList([
    finding.replayRequest ? `Request: ${finding.replayRequest}` : 'Request: Not recorded',
    finding.replayCommand ? `Command: ${finding.replayCommand}` : 'Command: Not recorded',
  ])}
  <h4>Remediation</h4>
  <p>${escapeHtml(finding.recommendation ?? 'Pending')}</p>
  <h4>Retest Criteria</h4>
  ${htmlList([
    'Replay the recorded request or command.',
    'Confirm vulnerable signal is absent.',
    'Save current evidence and update finding status.',
  ])}
</article>`
    })
    .join('\n')
}

function buildHtmlReport(model: ReportModel): string {
  const severityCards = (Object.keys(SEVERITY_ORDER) as EvidenceSeverity[])
    .map(
      severity =>
        `<div class="metric"><span>${escapeHtml(SEVERITY_LABEL[severity])}</span><strong style="color:${SEVERITY_COLOR[severity]}">${model.severityCounts[severity]}</strong></div>`,
    )
    .join('')
  const artifactRows = model.artifacts.map(artifact => [
    artifact.label,
    artifact.path,
    artifact.description ?? '',
  ])
  const executionRows = model.executionSteps.map(entry => [
    entry.agentType,
    entry.status,
    String(entry.totalToolUseCount ?? 0),
    String(entry.totalDurationMs ?? 0),
    entry.summary ?? '',
  ])
  const remediationRows = model.findings
    .filter(finding => finding.severity !== 'info')
    .map(finding => [
      SEVERITY_LABEL[finding.severity],
      finding.title,
      finding.recommendation ?? 'Pending',
      finding.replayRequest ?? finding.replayCommand ?? 'Not recorded',
    ])

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Net-Runner Report - ${escapeHtml(model.manifest.name)}</title>
  <style>
    :root { color-scheme: light; --ink:#101828; --muted:#667085; --line:#d0d5dd; --panel:#ffffff; --bg:#f2f4f7; --accent:#155eef; }
    * { box-sizing: border-box; }
    body { margin:0; background:var(--bg); color:var(--ink); font-family: Inter, Arial, sans-serif; line-height:1.5; }
    main { width:min(1120px, calc(100vw - 32px)); margin:0 auto; padding:32px 0 56px; }
    .hero { background:#0b1220; color:white; padding:34px; border-bottom:6px solid var(--accent); }
    .hero h1 { margin:0 0 8px; font-size:34px; letter-spacing:0; }
    .hero p { margin:0; color:#cbd5e1; }
    section, .finding { background:var(--panel); border:1px solid var(--line); margin-top:18px; padding:24px; }
    h2 { margin:0 0 16px; font-size:22px; }
    h3 { margin:0; font-size:18px; }
    h4 { margin:18px 0 6px; font-size:13px; text-transform:uppercase; color:var(--muted); letter-spacing:.04em; }
    .grid { display:grid; grid-template-columns:repeat(5, 1fr); gap:12px; }
    .metric { border:1px solid var(--line); padding:14px; background:#fcfcfd; }
    .metric span { display:block; color:var(--muted); font-size:12px; text-transform:uppercase; }
    .metric strong { display:block; font-size:30px; margin-top:4px; }
    .metadata-grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:10px; margin-top:16px; }
    .metadata-grid div { border:1px solid var(--line); padding:10px; background:#fcfcfd; }
    .metadata-grid b { display:block; font-size:12px; color:var(--muted); margin-bottom:4px; }
    .finding-head { display:flex; gap:12px; align-items:center; }
    .pill { color:white; padding:5px 10px; font-weight:700; font-size:12px; text-transform:uppercase; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    th, td { border:1px solid var(--line); padding:9px 10px; text-align:left; vertical-align:top; }
    th { background:#f8fafc; color:#344054; }
    .muted { color:var(--muted); }
    code { background:#eef4ff; padding:2px 4px; }
    @media (max-width: 760px) { .grid, .metadata-grid { grid-template-columns:1fr; } .hero { padding:24px; } }
  </style>
</head>
<body>
  <main>
    <div class="hero">
      <h1>Net-Runner Security Assessment</h1>
      <p>${escapeHtml(model.manifest.name)} | ${escapeHtml(model.manifest.workflowId)} | ${escapeHtml(model.manifest.authorization.scopeSummary)}</p>
    </div>
    <section>
      <h2>Executive Dashboard</h2>
      <div class="grid">${severityCards}</div>
      <p>${escapeHtml(buildExecutiveNarrative(model))}</p>
    </section>
    <section>
      <h2>Engagement</h2>
      ${htmlTable(['Field', 'Value'], [
        ['Name', model.manifest.name],
        ['Workflow', model.manifest.workflowId],
        ['Targets', model.manifest.targets.length > 0 ? model.manifest.targets.join(', ') : 'Not recorded'],
        ['Scope Basis', model.manifest.authorization.scopeSummary],
        ['Max Impact', model.manifest.authorization.maxImpact],
      ])}
    </section>
    <section>
      <h2>Attack Path & Execution Narrative</h2>
      ${htmlTable(['Agent', 'Status', 'Tools', 'Duration ms', 'Summary'], executionRows)}
    </section>
    <section>
      <h2>Priority Actions</h2>
      ${htmlTable(['Severity', 'Finding', 'Evidence Status', 'CVSS', 'Action', 'Retest Signal'], buildPriorityRows(model))}
    </section>
    <section>
      <h2>Detailed Findings</h2>
      ${buildHtmlFindingCards(model)}
    </section>
    <section>
      <h2>Remediation Backlog</h2>
      ${htmlTable(['Severity', 'Finding', 'Remediation', 'Retest Signal'], remediationRows)}
    </section>
    <section>
      <h2>Compliance Summary</h2>
      ${htmlTable(['Framework', 'Controls', 'Findings'], model.complianceRows.map(row => [row.framework, row.controls, row.findings.join(', ')]))}
    </section>
    <section>
      <h2>MITRE ATT&amp;CK Coverage</h2>
      ${htmlTable(['Technique', 'Tactic', 'Findings'], model.mitreRows.map(row => [row.technique, row.tactic, row.findings.join(', ')]))}
    </section>
    <section>
      <h2>Evidence Artifacts</h2>
      ${htmlTable(['Label', 'Path', 'Description'], artifactRows)}
    </section>
  </main>
</body>
</html>
`
}

export function generateMarkdownReport(
  manifest: EngagementManifest,
  entries: EvidenceEntry[],
): string {
  return buildMarkdownReport(buildReportModel(manifest, entries))
}

export function generateHtmlReport(
  manifest: EngagementManifest,
  entries: EvidenceEntry[],
): string {
  return buildHtmlReport(buildReportModel(manifest, entries))
}

export async function writeMarkdownReport(
  cwd: string,
  manifest: EngagementManifest,
  entries: EvidenceEntry[],
  fileName = 'latest.md',
): Promise<string> {
  const reportsDir = getReportsDir(cwd)
  await mkdir(reportsDir, { recursive: true })
  const reportPath = join(reportsDir, fileName)
  await writeFile(reportPath, generateMarkdownReport(manifest, entries), 'utf8')
  return reportPath
}

export async function writeHtmlReport(
  cwd: string,
  manifest: EngagementManifest,
  entries: EvidenceEntry[],
  fileName = 'latest.html',
): Promise<string> {
  const reportsDir = getReportsDir(cwd)
  await mkdir(reportsDir, { recursive: true })
  const reportPath = join(reportsDir, fileName)
  await writeFile(reportPath, generateHtmlReport(manifest, entries), 'utf8')
  return reportPath
}
