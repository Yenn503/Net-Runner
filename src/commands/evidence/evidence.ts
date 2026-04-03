import type { LocalCommandCall } from '../../types/command.js'
import { readEngagementManifest } from '../../security/engagement.js'
import {
  appendEvidenceEntry,
  countEvidenceEntriesByType,
  readEvidenceEntries,
  type EvidenceSeverity,
} from '../../security/evidence.js'
import { getCwd } from '../../utils/cwd.js'

const VALID_SEVERITIES: EvidenceSeverity[] = [
  'info',
  'low',
  'medium',
  'high',
  'critical',
]

function getHelpText(): string {
  return `Net-Runner evidence commands:
- /evidence status
- /evidence note <text>
- /evidence finding <severity> <title> | <evidence> | [recommendation]
- /evidence artifact <label> | <path> | [description]
- /evidence close [summary]`
}

function parsePipeFields(value: string): string[] {
  return value
    .split('|')
    .map(field => field.trim())
    .filter(field => field.length > 0)
}

const call: LocalCommandCall = async args => {
  const cwd = getCwd()
  const trimmed = args.trim()

  if (!trimmed) {
    return { type: 'text', value: getHelpText() }
  }

  const [subcommand, ...rest] = trimmed.split(/\s+/)
  const manifest = await readEngagementManifest(cwd)
  if (!manifest) {
    return {
      type: 'text',
      value:
        'No Net-Runner engagement found in this workspace. Run `/engagement init` first.',
    }
  }

  if (subcommand === 'status') {
    const counts = countEvidenceEntriesByType(await readEvidenceEntries(cwd))
    return {
      type: 'text',
      value: `Net-Runner evidence status:
- session starts: ${counts.session_start}
- session ends: ${counts.session_end}
- findings: ${counts.finding}
- notes: ${counts.note}
- artifacts: ${counts.artifact}
- guardrails: ${counts.guardrail}
- execution steps: ${counts.execution_step}
- approvals: ${counts.approval}`,
    }
  }

  if (subcommand === 'note') {
    const note = rest.join(' ').trim()
    if (!note) {
      return { type: 'text', value: 'Usage: /evidence note <text>' }
    }
    await appendEvidenceEntry(cwd, { type: 'note', note })
    return { type: 'text', value: 'Added evidence note.' }
  }

  if (subcommand === 'finding') {
    const severity = (rest[0] ?? '').toLowerCase()
    if (!VALID_SEVERITIES.includes(severity as EvidenceSeverity)) {
      return {
        type: 'text',
        value:
          'Usage: /evidence finding <severity> <title> | <evidence> | [recommendation]\nValid severities: info, low, medium, high, critical',
      }
    }

    const fields = parsePipeFields(rest.slice(1).join(' '))
    const [title, evidence, recommendation] = fields
    if (!title || !evidence) {
      return {
        type: 'text',
        value:
          'Usage: /evidence finding <severity> <title> | <evidence> | [recommendation]',
      }
    }

    await appendEvidenceEntry(cwd, {
      type: 'finding',
      severity: severity as EvidenceSeverity,
      title,
      evidence,
      recommendation,
    })
    return { type: 'text', value: 'Added evidence finding.' }
  }

  if (subcommand === 'artifact') {
    const fields = parsePipeFields(rest.join(' '))
    const [label, path, description] = fields
    if (!label || !path) {
      return {
        type: 'text',
        value: 'Usage: /evidence artifact <label> | <path> | [description]',
      }
    }

    await appendEvidenceEntry(cwd, {
      type: 'artifact',
      label,
      path,
      description,
    })
    return { type: 'text', value: 'Added evidence artifact.' }
  }

  if (subcommand === 'close') {
    const summary = rest.join(' ').trim() || 'Engagement session closed.'
    await appendEvidenceEntry(cwd, { type: 'session_end', summary })
    return { type: 'text', value: 'Recorded session end in evidence ledger.' }
  }

  return { type: 'text', value: getHelpText() }
}

export { call }
