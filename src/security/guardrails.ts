export type GuardrailAction = 'allow' | 'review' | 'block'

export type ImpactLevel = 'read-only' | 'limited' | 'intrusive'

export type GuardrailDecision = {
  action: GuardrailAction
  reason: string
  matchedPatterns: string[]
  tripwireTriggered: boolean
  reviewId?: string
}

export type GuardrailContext = {
  engagementStatus?: 'draft' | 'active' | 'paused' | 'closed'
  targets?: string[]
  restrictions?: string[]
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

function normalizeTarget(value: string): string {
  const trimmed = value.trim().replace(/[),.;:!?]+$/, '').toLowerCase()
  if (trimmed.length === 0) {
    return ''
  }

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return parsed.hostname.toLowerCase()
  } catch {
    return trimmed.replace(/\/.*$/, '').replace(/:\d{2,5}$/, '')
  }
}

function extractReferencedTargets(plannedAction: string): string[] {
  const matches =
    plannedAction.match(
      /\bhttps?:\/\/[^\s)]+|\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b|\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d{2,5})?(?:\/[^\s)]*)?\b/g,
    ) ?? []
  return matches
    .map(normalizeTarget)
    .filter(candidate => candidate.length > 0)
}

function isTargetInScope(
  referencedTarget: string,
  allowedTargets: string[],
): boolean {
  return allowedTargets.some(allowedTarget => {
    if (allowedTarget === referencedTarget) {
      return true
    }
    // Allow subdomains when a parent domain is declared in scope.
    return referencedTarget.endsWith(`.${allowedTarget}`)
  })
}

export function assessActionAgainstImpact(
  plannedAction: string,
  maxImpact: ImpactLevel,
  authorizationStatus: 'confirmed' | 'unconfirmed',
  context?: GuardrailContext,
): GuardrailDecision {
  if (context?.engagementStatus && context.engagementStatus !== 'active') {
    return {
      action: 'block',
      reason: `Engagement status is ${context.engagementStatus}; execution is blocked until status is active.`,
      matchedPatterns: ['engagement-inactive'],
      tripwireTriggered: true,
    }
  }

  if (authorizationStatus !== 'confirmed') {
    return {
      action: 'review',
      reason: 'Authorization state is not confirmed for this engagement.',
      matchedPatterns: [],
      tripwireTriggered: true,
    }
  }

  const normalizedTargets = (context?.targets ?? [])
    .map(normalizeTarget)
    .filter(target => target.length > 0)
  if (normalizedTargets.length > 0) {
    const referencedTargets = extractReferencedTargets(plannedAction)
    const outOfScopeTargets = referencedTargets.filter(
      target => !isTargetInScope(target, normalizedTargets),
    )
    if (outOfScopeTargets.length > 0) {
      return {
        action: 'review',
        reason: `Planned action references targets outside the declared scope: ${outOfScopeTargets.join(', ')}.`,
        matchedPatterns: ['scope-mismatch'],
        tripwireTriggered: true,
      }
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
  const restrictionsText = (context?.restrictions ?? []).join(' ').toLowerCase()
  const restrictionsBlockPersistence =
    /\b(no|do not|never|forbid|forbidden)\b[\s\S]{0,80}\b(persist|persistence|cron|authorized_keys|useradd|adduser)\b/.test(
      restrictionsText,
    )
  if (persistenceMatches.length > 0) {
    return {
      action:
        maxImpact === 'read-only' || restrictionsBlockPersistence
          ? 'block'
          : 'review',
      reason:
        maxImpact === 'read-only'
          ? 'Persistence changes are blocked in read-only engagements.'
          : restrictionsBlockPersistence
            ? 'Persistence changes are blocked by declared engagement restrictions.'
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
