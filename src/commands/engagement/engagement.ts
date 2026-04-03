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
- /engagement guard <planned action>`
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
      authorizationStatus: 'unconfirmed',
      targets: targetSummary ? [targetSummary] : [],
      maxImpact: 'read-only',
      authorizedBy: 'operator (manual init, pending confirmation)',
      restrictions: [
        'Remain in read-only mode until operator authorization is explicitly confirmed.',
        'Do not exceed the declared target scope.',
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

capabilities:
- ready: ${readiness.ready}/${readiness.total}
- missing: ${readiness.missing}`,
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

  return { type: 'text', value: getHelpText() }
}

export { call }
