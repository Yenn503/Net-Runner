import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import type { EngagementManifest } from './engagement.js'
import type { EvidenceEntry, FindingEntry } from './evidence.js'
import { getReportsDir } from './paths.js'

const SEVERITY_ORDER: Record<FindingEntry['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}

function getFindings(entries: EvidenceEntry[]): FindingEntry[] {
  return entries
    .filter((entry): entry is FindingEntry => entry.type === 'finding')
    .sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity])
}

export function generateMarkdownReport(
  manifest: EngagementManifest,
  entries: EvidenceEntry[],
): string {
  const findings = getFindings(entries)
  const notes = entries.filter(entry => entry.type === 'note')
  const artifacts = entries.filter(entry => entry.type === 'artifact')
  const guardrails = entries.filter(entry => entry.type === 'guardrail')
  const executionSteps = entries.filter(entry => entry.type === 'execution_step')
  const approvals = entries.filter(entry => entry.type === 'approval')

  const findingSection =
    findings.length === 0
      ? 'No findings have been recorded yet.'
      : findings
          .map(
            finding =>
              `## [${finding.severity.toUpperCase()}] ${finding.title}

Evidence: ${finding.evidence}
${finding.recommendation ? `Recommendation: ${finding.recommendation}` : 'Recommendation: pending'}
`,
          )
          .join('\n')

  const notesSection =
    notes.length === 0
      ? '- None'
      : notes.map(note => `- ${note.note}`).join('\n')

  const artifactsSection =
    artifacts.length === 0
      ? '- None'
      : artifacts
          .map(artifact => `- ${artifact.label}: ${artifact.path}`)
          .join('\n')

  const guardrailSection =
    guardrails.length === 0
      ? '- None'
      : guardrails
          .map(
            entry =>
              `- ${entry.decision.action.toUpperCase()}: ${entry.plannedAction} (${entry.decision.reason})`,
          )
          .join('\n')

  const executionSection =
    executionSteps.length === 0
      ? '- None'
      : executionSteps
          .map(
            entry =>
              `- ${entry.agentType} | ${entry.status} | tools=${entry.totalToolUseCount ?? 0} | duration_ms=${entry.totalDurationMs ?? 0}${entry.summary ? ` | ${entry.summary}` : ''}`,
          )
          .join('\n')

  const approvalSection =
    approvals.length === 0
      ? '- None'
      : approvals
          .map(
            entry =>
              `- ${entry.status.toUpperCase()} (${entry.reviewId}): ${entry.plannedAction} (${entry.reason})`,
          )
          .join('\n')

  return `# Net-Runner Report

## Engagement

- Name: ${manifest.name}
- Workflow: ${manifest.workflowId}
- Targets: ${manifest.targets.length > 0 ? manifest.targets.join(', ') : 'Not recorded'}
- Authorization: ${manifest.authorization.status} by ${manifest.authorization.authorizedBy}
- Max impact: ${manifest.authorization.maxImpact}
- Scope: ${manifest.authorization.scopeSummary}

## Findings

${findingSection}

## Notes

${notesSection}

## Artifacts

${artifactsSection}

## Guardrail Decisions

${guardrailSection}

## Execution Steps

${executionSection}

## Review Decisions

${approvalSection}
`
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
