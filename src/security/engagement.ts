import { mkdir, readFile, writeFile } from 'fs/promises'
import { basename, dirname } from 'path'
import { findWorkflow, type SecurityWorkflow } from './workflows.js'
import type { NetRunnerSkillName } from './skillDefinitions.js'
import { assessActionAgainstImpact, type GuardrailDecision, type ImpactLevel } from './guardrails.js'
import {
  getEngagementAgentMemoryRoot,
  getArtifactsDir,
  getEngagementInstructionsDir,
  getEngagementManifestPath,
  getEngagementMemoryDir,
  getEngagementSecretsPath,
  getEngagementVariablesPath,
  getEvidenceLedgerPath,
  getFindingsDir,
  getNetRunnerProjectDir,
  getReportsDir,
  getRunStatePath,
} from './paths.js'
import { createDefaultSecurityRunState, writeSecurityRunState } from './runState.js'

export type EngagementStatus = 'draft' | 'active' | 'paused' | 'closed'

export type EngagementManifest = {
  schemaVersion: 1
  name: string
  workflowId: SecurityWorkflow['id']
  status: EngagementStatus
  targets: string[]
  objectives: string[]
  createdAt: string
  updatedAt: string
  authorization: {
    status: 'confirmed' | 'unconfirmed'
    authorizedBy: string
    scopeSummary: string
    maxImpact: ImpactLevel
    restrictions: string[]
  }
  execution: {
    preferredMode: 'skills-and-tools'
    allowMcpForIntegrations: boolean
    defaultSkills: NetRunnerSkillName[]
  }
}

export type InitializeEngagementOptions = {
  cwd: string
  name?: string
  workflowId?: SecurityWorkflow['id']
  authorizationStatus?: 'confirmed' | 'unconfirmed'
  targets?: string[]
  objectives?: string[]
  scopeSummary?: string
  authorizedBy?: string
  maxImpact?: ImpactLevel
  restrictions?: string[]
}

function getDefaultEngagementName(cwd: string): string {
  const baseName = basename(cwd).trim()
  const normalizedBaseName = baseName.toLowerCase()
  if (
    normalizedBaseName.length === 0 ||
    normalizedBaseName.includes('net-runner') ||
    normalizedBaseName.includes('net_runner') ||
    normalizedBaseName.includes('netrunner') ||
    normalizedBaseName.includes('claude')
  ) {
    return 'net-runner-workspace'
  }
  return baseName
}

function buildInstructionsReadme(manifest: EngagementManifest): string {
  return `# Net-Runner Engagement Envelope

This directory is the project-scoped security testing envelope for this workspace.

- Workflow: ${manifest.workflowId}
- Scope: ${manifest.authorization.scopeSummary}
- Authorization: ${manifest.authorization.status} by ${manifest.authorization.authorizedBy}
- Max impact: ${manifest.authorization.maxImpact}

Files:
- engagement.json: engagement manifest and execution defaults
- variables.env: non-secret engagement variables
- secrets.env: secret values that should stay out of transcripts and reports
- memory/private.md: operator-only notes
- memory/team.md: reusable team-safe notes
- memory/agents/: specialist-agent project memory inside the engagement envelope
- evidence/ledger.jsonl: append-only evidence log
- reports/: generated markdown reports
`
}

const DEFAULT_VARIABLES_FILE = `# Non-secret engagement variables
# Example:
# TARGET_BASE_URL=https://target.lab
`

const DEFAULT_SECRETS_FILE = `# Secret engagement values
# Example:
# SESSION_COOKIE=
# API_TOKEN=
`

const DEFAULT_PRIVATE_MEMORY = `# Private Memory

Store operator-only working notes here.
`

const DEFAULT_TEAM_MEMORY = `# Team Memory

Store reusable, non-sensitive findings and workflow notes here.
`

const DEFAULT_MEMORY_README = `# Net-Runner Memory

This directory keeps engagement-scoped memory for the current assessment.

- private.md: operator-only working notes
- team.md: reusable assessment notes safe to share in-project
- agents/: specialist-agent project memory kept inside the same engagement envelope
`

const DEFAULT_AGENT_MEMORY_README = `# Agent Memory

Each Net-Runner specialist stores project-scoped memory in its own subdirectory here.
This keeps engagement notes, evidence context, and agent learnings inside one workspace envelope.
`

export function createDefaultEngagementManifest(
  options: InitializeEngagementOptions,
): EngagementManifest {
  const workflow = findWorkflow(options.workflowId ?? 'web-app-testing')
  if (!workflow) {
    throw new Error(`Unknown Net-Runner workflow: ${options.workflowId}`)
  }

  const now = new Date().toISOString()
  return {
    schemaVersion: 1,
    name: options.name ?? getDefaultEngagementName(options.cwd),
    workflowId: workflow.id,
    status: 'active',
    targets: options.targets ?? [],
    objectives:
      options.objectives && options.objectives.length > 0
        ? options.objectives
        : [`Execute the ${workflow.label.toLowerCase()} workflow safely and keep evidence.`],
    createdAt: now,
    updatedAt: now,
    authorization: {
      status: options.authorizationStatus ?? 'confirmed',
      authorizedBy: options.authorizedBy ?? 'operator',
      scopeSummary:
        options.scopeSummary ??
        'Operator-initialized authorized security testing engagement.',
      maxImpact: options.maxImpact ?? 'limited',
      restrictions:
        options.restrictions && options.restrictions.length > 0
          ? options.restrictions
          : ['Do not exceed the declared scope or persistence boundary.'],
    },
    execution: {
      preferredMode: 'skills-and-tools',
      allowMcpForIntegrations: true,
      defaultSkills: workflow.defaultSkills,
    },
  }
}

async function writeIfMissing(path: string, content: string): Promise<void> {
  try {
    await readFile(path, 'utf8')
  } catch {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content, 'utf8')
  }
}

export async function initializeNetRunnerProject(
  options: InitializeEngagementOptions,
): Promise<EngagementManifest> {
  const manifest = createDefaultEngagementManifest(options)
  const projectDir = getNetRunnerProjectDir(options.cwd)

  await Promise.all([
    mkdir(projectDir, { recursive: true }),
    mkdir(getEngagementInstructionsDir(options.cwd), { recursive: true }),
    mkdir(getEngagementMemoryDir(options.cwd), { recursive: true }),
    mkdir(getEngagementAgentMemoryRoot(options.cwd), { recursive: true }),
    mkdir(dirname(getEvidenceLedgerPath(options.cwd)), { recursive: true }),
    mkdir(getArtifactsDir(options.cwd), { recursive: true }),
    mkdir(getFindingsDir(options.cwd), { recursive: true }),
    mkdir(getReportsDir(options.cwd), { recursive: true }),
  ])

  await writeEngagementManifest(options.cwd, manifest)
  await writeSecurityRunState(
    options.cwd,
    createDefaultSecurityRunState({
      workflowId: manifest.workflowId,
      currentPhase: 'execution',
    }),
  )
  await Promise.all([
    writeIfMissing(
      `${getEngagementInstructionsDir(options.cwd)}/README.md`,
      buildInstructionsReadme(manifest),
    ),
    writeIfMissing(getEngagementVariablesPath(options.cwd), DEFAULT_VARIABLES_FILE),
    writeIfMissing(getEngagementSecretsPath(options.cwd), DEFAULT_SECRETS_FILE),
    writeIfMissing(
      `${getEngagementMemoryDir(options.cwd)}/private.md`,
      DEFAULT_PRIVATE_MEMORY,
    ),
    writeIfMissing(
      `${getEngagementMemoryDir(options.cwd)}/team.md`,
      DEFAULT_TEAM_MEMORY,
    ),
    writeIfMissing(
      `${getEngagementMemoryDir(options.cwd)}/README.md`,
      DEFAULT_MEMORY_README,
    ),
    writeIfMissing(
      `${getEngagementAgentMemoryRoot(options.cwd)}/README.md`,
      DEFAULT_AGENT_MEMORY_README,
    ),
    writeIfMissing(getEvidenceLedgerPath(options.cwd), ''),
    writeIfMissing(
      getRunStatePath(options.cwd),
      JSON.stringify(
        createDefaultSecurityRunState({
          workflowId: manifest.workflowId,
          currentPhase: 'execution',
        }),
        null,
        2,
      ),
    ),
  ])

  return manifest
}

export async function readEngagementManifest(
  cwd: string,
): Promise<EngagementManifest | null> {
  try {
    const raw = await readFile(getEngagementManifestPath(cwd), 'utf8')
    return JSON.parse(raw) as EngagementManifest
  } catch {
    return null
  }
}

export async function writeEngagementManifest(
  cwd: string,
  manifest: EngagementManifest,
): Promise<void> {
  const nextManifest = {
    ...manifest,
    updatedAt: new Date().toISOString(),
  }
  await mkdir(dirname(getEngagementManifestPath(cwd)), { recursive: true })
  await writeFile(
    getEngagementManifestPath(cwd),
    JSON.stringify(nextManifest, null, 2),
    'utf8',
  )
}

export function summarizeEngagement(manifest: EngagementManifest): string {
  const targets =
    manifest.targets.length > 0 ? manifest.targets.join(', ') : 'no explicit targets yet'
  return [
    `name: ${manifest.name}`,
    `workflow: ${manifest.workflowId}`,
    `status: ${manifest.status}`,
    `targets: ${targets}`,
    `authorization: ${manifest.authorization.status} by ${manifest.authorization.authorizedBy}`,
    `max impact: ${manifest.authorization.maxImpact}`,
    `scope: ${manifest.authorization.scopeSummary}`,
    `skills: ${manifest.execution.defaultSkills.join(', ')}`,
  ].join('\n')
}

function truncateContextValue(value: string, maxLength = 240): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }
  return `${normalized.slice(0, maxLength)}...`
}

export function formatEngagementContextForPrompt(
  manifest: EngagementManifest,
): string {
  const targets =
    manifest.targets.length > 0 ? manifest.targets.join(', ') : 'none'
  const restrictions =
    manifest.authorization.restrictions.length > 0
      ? manifest.authorization.restrictions.join(' | ')
      : 'none'
  const defaultBehavior =
    manifest.authorization.maxImpact === 'read-only'
      ? 'Operate in read-only mode unless the operator explicitly requests a higher-impact action.'
      : manifest.authorization.maxImpact === 'limited'
        ? 'Proceed inside scope with controlled validation; require guardrail review before high-impact or persistence actions.'
        : 'Proceed inside scope, but require guardrail review before destructive or persistence-heavy actions.'

  return [
    '[Net-Runner engagement context]',
    `name=${truncateContextValue(manifest.name, 120)}`,
    `workflow=${manifest.workflowId}`,
    `targets=${truncateContextValue(targets)}`,
    `authorization_status=${manifest.authorization.status}`,
    `max_impact=${manifest.authorization.maxImpact}`,
    `scope_summary=${truncateContextValue(manifest.authorization.scopeSummary)}`,
    `restrictions=${truncateContextValue(restrictions)}`,
    `default_skills=${manifest.execution.defaultSkills.join(', ')}`,
    `default_behavior=${defaultBehavior}`,
    '[/Net-Runner engagement context]',
  ].join('\n')
}

export function assessPlannedAction(
  manifest: EngagementManifest,
  plannedAction: string,
): GuardrailDecision {
  return assessActionAgainstImpact(
    plannedAction,
    manifest.authorization.maxImpact,
    manifest.authorization.status,
    {
      engagementStatus: manifest.status,
      targets: manifest.targets,
      restrictions: manifest.authorization.restrictions,
    },
  )
}
