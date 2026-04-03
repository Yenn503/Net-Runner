import { isEnvTruthy } from '../utils/envUtils.js'
import {
  initializeNetRunnerProject,
  readEngagementManifest,
  writeEngagementManifest,
  type EngagementManifest,
} from './engagement.js'
import { appendEvidenceEntry } from './evidence.js'
import type { ImpactLevel } from './guardrails.js'
import type { SecurityWorkflow } from './workflows.js'

const ASSESSMENT_INTENT_PATTERN =
  /\b(assess|assessment|pentest|penetration test|red[ -]?team|security test|attack|recon|enumerat|scan|probe|exploit|vulnerability test|audit)\b/i

const URL_TARGET_PATTERN = /\bhttps?:\/\/[^\s)]+/i
const IPV4_TARGET_PATTERN =
  /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/
const DOMAIN_TARGET_PATTERN =
  /\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d{2,5})?(?:\/[^\s)]*)?\b/

export type AutoEngagementBootstrapResult = {
  initialized: boolean
  reason:
    | 'initialized'
    | 'disabled'
    | 'already-initialized'
    | 'no-assessment-intent'
    | 'no-target'
  manifest?: EngagementManifest
  target?: string
}

export type AutoEngagementContextSyncResult = {
  updated: boolean
  reason:
    | 'updated'
    | 'no-engagement'
    | 'no-impact-signal'
    | 'unchanged'
  manifest?: EngagementManifest
}

function normalizeTarget(raw: string): string {
  return raw.trim().replace(/[),.;:!?]+$/, '')
}

function hasAssessmentIntent(prompt: string): boolean {
  return ASSESSMENT_INTENT_PATTERN.test(prompt)
}

function extractTargetFromPrompt(prompt: string): string | null {
  const urlMatch = prompt.match(URL_TARGET_PATTERN)
  if (urlMatch?.[0]) {
    return normalizeTarget(urlMatch[0])
  }

  const ipMatch = prompt.match(IPV4_TARGET_PATTERN)
  if (ipMatch?.[0]) {
    return normalizeTarget(ipMatch[0])
  }

  const domainMatch = prompt.match(DOMAIN_TARGET_PATTERN)
  if (domainMatch?.[0]) {
    return normalizeTarget(domainMatch[0])
  }

  return null
}

function inferWorkflow(prompt: string): SecurityWorkflow['id'] {
  if (/\b(ctf|capture the flag|challenge)\b/i.test(prompt)) {
    return 'ctf-mode'
  }
  if (
    /\b(lab|htb|hack the box|internal host|subnet|lateral movement|privilege escalation|nmap|port scan)\b/i.test(
      prompt,
    )
  ) {
    return 'lab-target-testing'
  }
  if (/\b(api|endpoint|openapi|swagger|graphql)\b/i.test(prompt)) {
    return 'api-testing'
  }
  return 'web-app-testing'
}

function inferMaxImpact(prompt: string): 'read-only' | 'limited' | 'intrusive' {
  if (/\b(read[ -]?only|passive|recon only)\b/i.test(prompt)) {
    return 'read-only'
  }
  if (
    /\b(exploit|intrusive|rce|write access|command execution|lateral movement|privilege escalation)\b/i.test(
      prompt,
    )
  ) {
    return 'intrusive'
  }
  return 'limited'
}

function inferExplicitImpactSignal(prompt: string): ImpactLevel | null {
  if (/\b(read[ -]?only|passive|recon only|non-invasive)\b/i.test(prompt)) {
    return 'read-only'
  }

  if (
    /\b(intrusive|active exploit|exploit|rce|write access|command execution|lateral movement|privilege escalation)\b/i.test(
      prompt,
    )
  ) {
    return 'intrusive'
  }

  if (
    /\b(limited|non-destructive|controlled|safe testing)\b/i.test(prompt)
  ) {
    return 'limited'
  }

  return null
}

export async function maybeAutoBootstrapEngagement(
  cwd: string,
  prompt: string,
): Promise<AutoEngagementBootstrapResult> {
  if (isEnvTruthy(process.env.NET_RUNNER_DISABLE_AUTO_ENGAGEMENT)) {
    return { initialized: false, reason: 'disabled' }
  }

  if (!hasAssessmentIntent(prompt)) {
    return { initialized: false, reason: 'no-assessment-intent' }
  }

  const target = extractTargetFromPrompt(prompt)
  if (!target) {
    return { initialized: false, reason: 'no-target' }
  }

  const existing = await readEngagementManifest(cwd)
  if (existing) {
    return { initialized: false, reason: 'already-initialized' }
  }

  const workflowId = inferWorkflow(prompt)
  const requestedMaxImpact = inferMaxImpact(prompt)
  const summary = normalizeTarget(prompt).slice(0, 240)
  const manifest = await initializeNetRunnerProject({
    cwd,
    workflowId,
    authorizationStatus: 'confirmed',
    targets: [target],
    maxImpact: requestedMaxImpact,
    scopeSummary: `Auto-initialized from operator prompt: ${summary}`,
    authorizedBy: 'operator (natural-language session)',
    restrictions: [
      'Do not exceed the declared target scope.',
      'Require guardrail review before destructive or persistence-heavy actions.',
    ],
  })

  await appendEvidenceEntry(cwd, {
    type: 'session_start',
    summary: `Auto-initialized ${workflowId} engagement for target ${target}.`,
  })
  await appendEvidenceEntry(cwd, {
    type: 'note',
    note: `auto_bootstrap=true | workflow=${workflowId} | target=${target} | authorization=confirmed | max_impact=${requestedMaxImpact} | operator_mode=natural-language`,
  })

  return {
    initialized: true,
    reason: 'initialized',
    manifest,
    target,
  }
}

export async function maybeAutoSyncEngagementContext(
  cwd: string,
  prompt: string,
): Promise<AutoEngagementContextSyncResult> {
  const manifest = await readEngagementManifest(cwd)
  if (!manifest) {
    return { updated: false, reason: 'no-engagement' }
  }

  const impactOverride = inferExplicitImpactSignal(prompt)
  if (!impactOverride) {
    return {
      updated: false,
      reason: 'no-impact-signal',
      manifest,
    }
  }

  if (manifest.authorization.maxImpact === impactOverride) {
    return {
      updated: false,
      reason: 'unchanged',
      manifest,
    }
  }

  const nextManifest: EngagementManifest = {
    ...manifest,
    authorization: {
      ...manifest.authorization,
      status: 'confirmed',
      authorizedBy: 'operator (natural-language session)',
      maxImpact: impactOverride,
    },
  }

  await writeEngagementManifest(cwd, nextManifest)
  await appendEvidenceEntry(cwd, {
    type: 'note',
    note: `operator_intent_sync=true | source=chat | max_impact=${nextManifest.authorization.maxImpact}`,
  })

  return {
    updated: true,
    reason: 'updated',
    manifest: (await readEngagementManifest(cwd)) ?? nextManifest,
  }
}
