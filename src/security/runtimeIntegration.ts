import { appendEvidenceEntry } from './evidence.js'
import { assessPlannedAction, readEngagementManifest } from './engagement.js'
import type { GuardrailDecision } from './guardrails.js'
import { NET_RUNNER_AGENT_TYPES, type NetRunnerAgentType } from './agentTypes.js'

const SECURITY_AGENT_TYPES = new Set<string>(NET_RUNNER_AGENT_TYPES)

export function isNetRunnerSecurityAgent(agentType: string): agentType is NetRunnerAgentType {
  return SECURITY_AGENT_TYPES.has(agentType)
}

export async function evaluateEngagementGuardrail(
  cwd: string,
  plannedAction: string,
  options?: {
    recordAllow?: boolean
  },
): Promise<GuardrailDecision | null> {
  const manifest = await readEngagementManifest(cwd)
  if (!manifest) {
    return null
  }

  const decision = assessPlannedAction(manifest, plannedAction)
  if (decision.action !== 'allow' || options?.recordAllow) {
    await appendEvidenceEntry(cwd, {
      type: 'guardrail',
      plannedAction,
      decision,
    })
  }

  return decision
}

export async function evaluateSubagentGuardrail(
  cwd: string,
  plannedAction: string,
): Promise<GuardrailDecision | null> {
  try {
    return await evaluateEngagementGuardrail(cwd, plannedAction, {
      recordAllow: true,
    })
  } catch {
    return null
  }
}

type RecordSubagentExecutionOptions = {
  cwd: string
  agentType: string
  status: 'completed' | 'failed' | 'killed'
  description: string
  prompt: string
  summary?: string
  outputFile?: string
  totalToolUseCount?: number
  totalDurationMs?: number
  model?: string
}

function trimSummary(value: string, max = 400): string {
  const trimmed = value.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= max) {
    return trimmed
  }
  return `${trimmed.slice(0, max)}...`
}

export async function recordSubagentExecution(
  options: RecordSubagentExecutionOptions,
): Promise<void> {
  try {
    const manifest = await readEngagementManifest(options.cwd)
    if (!manifest) {
      return
    }

    const lines = [
      `subagent=${options.agentType}`,
      `status=${options.status}`,
      `description=${trimSummary(options.description, 160)}`,
      `model=${options.model ?? 'inherit'}`,
      `tool_uses=${options.totalToolUseCount ?? 0}`,
      `duration_ms=${options.totalDurationMs ?? 0}`,
      `prompt=${trimSummary(options.prompt, 220)}`,
    ]
    if (options.outputFile) {
      lines.push(`output_file=${options.outputFile}`)
    }

    if (options.summary && options.summary.trim().length > 0) {
      lines.push(`summary=${trimSummary(options.summary)}`)
    }

    await appendEvidenceEntry(options.cwd, {
      type: 'note',
      note: lines.join(' | '),
    })

    if (options.outputFile) {
      await appendEvidenceEntry(options.cwd, {
        type: 'artifact',
        label: `subagent-output:${options.agentType}`,
        path: options.outputFile,
        description: `Captured output transcript for ${options.agentType} (${options.status}).`,
      })
    }
  } catch {
    return
  }
}
