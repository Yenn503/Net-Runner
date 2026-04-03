export type GuardrailAction = 'allow' | 'review' | 'block'

export type ImpactLevel = 'read-only' | 'limited' | 'intrusive'

export type GuardrailDecision = {
  action: GuardrailAction
  reason: string
  matchedPatterns: string[]
  tripwireTriggered: boolean
}

type PatternMatcher = {
  name: string
  pattern: RegExp
}

const HIGH_IMPACT_PATTERNS: PatternMatcher[] = [
  { name: 'destructive-delete', pattern: /\b(?:rm\s+-rf|del\s+\/|mkfs|shutdown|reboot)\b/i },
  {
    name: 'service-disruption',
    pattern: /\b(?:systemctl\s+(?:stop|disable)|service\s+\S+\s+stop|killall)\b/i,
  },
]

const PERSISTENCE_PATTERNS: PatternMatcher[] = [
  {
    name: 'persistence-change',
    pattern:
      /\b(?:crontab|cron job|authorized_keys|systemctl\s+enable|schtasks|useradd|adduser)\b/i,
  },
]

const STATE_CHANGE_PATTERNS: PatternMatcher[] = [
  {
    name: 'state-change',
    pattern: /\b(?:write|modify|change|delete|upload|create|drop|exploit)\b/i,
  },
]

function matchPatterns(
  plannedAction: string,
  patterns: PatternMatcher[],
): string[] {
  return patterns
    .filter(candidate => candidate.pattern.test(plannedAction))
    .map(candidate => candidate.name)
}

export function assessActionAgainstImpact(
  plannedAction: string,
  maxImpact: ImpactLevel,
  authorizationStatus: 'confirmed' | 'unconfirmed',
): GuardrailDecision {
  if (authorizationStatus !== 'confirmed') {
    return {
      action: 'review',
      reason: 'Authorization state is not confirmed for this engagement.',
      matchedPatterns: [],
      tripwireTriggered: true,
    }
  }

  const highImpactMatches = matchPatterns(plannedAction, HIGH_IMPACT_PATTERNS)
  if (highImpactMatches.length > 0) {
    return {
      action: maxImpact === 'intrusive' ? 'review' : 'block',
      reason:
        maxImpact === 'intrusive'
          ? 'Planned action is high impact and requires an explicit operator checkpoint.'
          : 'Planned action exceeds the engagement impact boundary.',
      matchedPatterns: highImpactMatches,
      tripwireTriggered: true,
    }
  }

  const persistenceMatches = matchPatterns(plannedAction, PERSISTENCE_PATTERNS)
  if (persistenceMatches.length > 0) {
    return {
      action: maxImpact === 'read-only' ? 'block' : 'review',
      reason:
        maxImpact === 'read-only'
          ? 'Persistence changes are blocked in read-only engagements.'
          : 'Persistence-related changes require a guardrail review before execution.',
      matchedPatterns: persistenceMatches,
      tripwireTriggered: true,
    }
  }

  const stateChangeMatches = matchPatterns(plannedAction, STATE_CHANGE_PATTERNS)
  if (maxImpact === 'read-only' && stateChangeMatches.length > 0) {
    return {
      action: 'review',
      reason: 'The action appears to change target state inside a read-only engagement.',
      matchedPatterns: stateChangeMatches,
      tripwireTriggered: true,
    }
  }

  return {
    action: 'allow',
    reason: 'No impact tripwires were triggered for the planned action.',
    matchedPatterns: [],
    tripwireTriggered: false,
  }
}

export function wrapUntrustedData(value: string): string {
  return [
    'BEGIN UNTRUSTED DATA',
    value.trim(),
    'END UNTRUSTED DATA',
  ].join('\n')
}
