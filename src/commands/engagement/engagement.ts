import type { LocalCommandCall } from '../../types/command.js'
import {
  assessPlannedAction,
  initializeNetRunnerProject,
  readEngagementManifest,
  summarizeEngagement,
} from '../../security/engagement.js'
import {
  appendEvidenceEntry,
  countEvidenceEntriesByType,
  readEvidenceEntries,
} from '../../security/evidence.js'
import {
  readSecurityRunState,
  resolvePendingSecurityReview,
} from '../../security/runState.js'
import {
  getCapabilityReadinessSnapshot,
  renderWorkflowCapabilityReadiness,
  summarizeWorkflowCapabilityReadiness,
} from '../../security/capabilities.js'
import { renderNetRunnerSecurityAlignment } from '../../security/alignment.js'
import { findWorkflow, type SecurityWorkflow } from '../../security/workflows.js'
import { getCwd } from '../../utils/cwd.js'

function getHelpText(): string {
  return `Net-Runner engagement commands:
- /engagement init [workflow] [target]
- /engagement status
- /engagement capabilities [workflow]
- /engagement alignment
- /engagement guard <planned action>
- /engagement review
- /engagement approve <review-id>
- /engagement reject <review-id>`
}

const call: LocalCommandCall = async args => {
  const cwd = getCwd()
  const trimmed = args.trim()

  if (!trimmed) {
    return { type: 'text', value: getHelpText() }
  }

  const [subcommand, ...rest] = trimmed.split(/\s+/)

  if (subcommand === 'init') {
    const maybeWorkflow = rest[0]
    const workflow = maybeWorkflow
      ? findWorkflow(maybeWorkflow as SecurityWorkflow['id'])
      : undefined
    const workflowId: SecurityWorkflow['id'] = workflow?.id ?? 'web-app-testing'
    const targetStartIndex = workflowId === maybeWorkflow ? 1 : 0
    const targetSummary = rest.slice(targetStartIndex).join(' ').trim()

    const manifest = await initializeNetRunnerProject({
      cwd,
      workflowId,
      authorizationStatus: 'confirmed',
      targets: targetSummary ? [targetSummary] : [],
      maxImpact: 'limited',
      authorizedBy: 'operator (manual init)',
      restrictions: [
        'Do not exceed the declared target scope.',
        'Require guardrail review before destructive or persistence-heavy actions.',
      ],
    })
    await appendEvidenceEntry(cwd, {
      type: 'session_start',
      summary: `Initialized ${manifest.workflowId} engagement.`,
    })

    return {
      type: 'text',
      value: `Initialized Net-Runner engagement.\n\n${summarizeEngagement(manifest)}`,
    }
  }

  if (subcommand === 'status') {
    const manifest = await readEngagementManifest(cwd)
    if (!manifest) {
      return {
        type: 'text',
        value:
          'No Net-Runner engagement found in this workspace. Run `/engagement init` first.',
      }
    }

    const counts = countEvidenceEntriesByType(await readEvidenceEntries(cwd))
    const runState = await readSecurityRunState(cwd)
    const pendingReviewCount =
      runState?.pendingReviews.filter(review => review.status === 'pending').length ?? 0
    const executionStepCount = runState?.executionSteps.length ?? 0
    const readiness = summarizeWorkflowCapabilityReadiness(
      manifest.workflowId,
      await getCapabilityReadinessSnapshot(),
    )
    return {
      type: 'text',
      value: `${summarizeEngagement(manifest)}

evidence:
- findings: ${counts.finding}
- notes: ${counts.note}
- artifacts: ${counts.artifact}
- guardrails: ${counts.guardrail}
- execution steps: ${counts.execution_step}
- approvals: ${counts.approval}

capabilities:
- ready: ${readiness.ready}/${readiness.total}
- missing: ${readiness.missing}

run state:
- execution steps: ${executionStepCount}
- pending reviews: ${pendingReviewCount}`,
    }
  }

  if (subcommand === 'capabilities') {
    const manifest = await readEngagementManifest(cwd)
    const requestedWorkflow = rest[0]?.trim() || ''
    const parsedWorkflow = requestedWorkflow
      ? findWorkflow(requestedWorkflow as SecurityWorkflow['id'])
      : undefined

    if (requestedWorkflow && !parsedWorkflow) {
      return {
        type: 'text',
        value: `Unknown workflow: ${requestedWorkflow}`,
      }
    }

    const workflowId: SecurityWorkflow['id'] =
      parsedWorkflow?.id ??
      manifest?.workflowId ??
      ('web-app-testing' as SecurityWorkflow['id'])

    return {
      type: 'text',
      value: renderWorkflowCapabilityReadiness(
        workflowId,
        await getCapabilityReadinessSnapshot(),
      ),
    }
  }

  if (subcommand === 'alignment') {
    return {
      type: 'text',
      value: renderNetRunnerSecurityAlignment(),
    }
  }

  if (subcommand === 'guard') {
    const plannedAction = rest.join(' ').trim()
    if (!plannedAction) {
      return {
        type: 'text',
        value: 'Usage: /engagement guard <planned action>',
      }
    }

    const manifest = await readEngagementManifest(cwd)
    if (!manifest) {
      return {
        type: 'text',
        value:
          'No Net-Runner engagement found in this workspace. Run `/engagement init` first.',
      }
    }

    const decision = assessPlannedAction(manifest, plannedAction)
    await appendEvidenceEntry(cwd, {
      type: 'guardrail',
      plannedAction,
      decision,
    })

    return {
      type: 'text',
      value: `Guardrail decision: ${decision.action.toUpperCase()}
reason: ${decision.reason}
matches: ${decision.matchedPatterns.length > 0 ? decision.matchedPatterns.join(', ') : 'none'}`,
    }
  }

  if (subcommand === 'review') {
    const manifest = await readEngagementManifest(cwd)
    if (!manifest) {
      return {
        type: 'text',
        value:
          'No Net-Runner engagement found in this workspace. Run `/engagement init` first.',
      }
    }
    const runState = await readSecurityRunState(cwd)
    const pending = runState?.pendingReviews.filter(review => review.status === 'pending') ?? []
    if (pending.length === 0) {
      return {
        type: 'text',
        value: 'No pending guardrail reviews.',
      }
    }
    const lines = pending.map(
      review =>
        `- ${review.id}\n  action: ${review.plannedAction}\n  reason: ${review.reason}`,
    )
    return {
      type: 'text',
      value: `Pending guardrail reviews:\n${lines.join('\n')}`,
    }
  }

  if (subcommand === 'approve' || subcommand === 'reject') {
    const reviewId = rest[0]?.trim() ?? ''
    if (!reviewId) {
      return {
        type: 'text',
        value: `Usage: /engagement ${subcommand} <review-id>`,
      }
    }
    const resolution = subcommand === 'approve' ? 'approved' : 'rejected'
    const resolved = await resolvePendingSecurityReview(cwd, reviewId, resolution)
    if (!resolved) {
      return {
        type: 'text',
        value: `No pending review found for id: ${reviewId}`,
      }
    }

    await appendEvidenceEntry(cwd, {
      type: 'approval',
      reviewId: resolved.id,
      status: resolved.status,
      plannedAction: resolved.plannedAction,
      reason: resolved.reason,
      decidedBy: resolved.decidedBy ?? 'operator',
    })

    return {
      type: 'text',
      value: `Review ${resolved.id} marked as ${resolved.status}.`,
    }
  }

  return { type: 'text', value: getHelpText() }
}

export { call }
