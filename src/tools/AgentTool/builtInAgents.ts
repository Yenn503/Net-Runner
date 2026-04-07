// @ts-nocheck
import { feature } from 'bun:bundle'
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
import { isAutoMemoryEnabled } from '../../memdir/paths.js'
import { isEnvTruthy } from '../../utils/envUtils.js'
import { loadAgentMemoryPrompt } from './agentMemory.js'
import { NET_RUNNER_GUIDE_AGENT } from './built-in/netRunnerGuideAgent.js'
import { ENGAGEMENT_LEAD_AGENT } from './built-in/engagementLeadAgent.js'
import { EXPLORE_AGENT } from './built-in/exploreAgent.js'
import { API_TESTING_SPECIALIST_AGENT } from './built-in/apiTestingSpecialistAgent.js'
import { EVIDENCE_SPECIALIST_AGENT } from './built-in/evidenceSpecialistAgent.js'
import { EXPLOIT_SPECIALIST_AGENT } from './built-in/exploitSpecialistAgent.js'
import { GENERAL_PURPOSE_AGENT } from './built-in/generalPurposeAgent.js'
import { AD_SPECIALIST_AGENT } from './built-in/adSpecialistAgent.js'
import { LATERAL_MOVEMENT_SPECIALIST_AGENT } from './built-in/lateralMovementSpecialistAgent.js'
import { NETWORK_TESTING_SPECIALIST_AGENT } from './built-in/networkTestingSpecialistAgent.js'
import { PLAN_AGENT } from './built-in/planAgent.js'
import { PRIVILEGE_ESCALATION_SPECIALIST_AGENT } from './built-in/privilegeEscalationSpecialistAgent.js'
import { RECON_SPECIALIST_AGENT } from './built-in/reconSpecialistAgent.js'
import { REPORTING_SPECIALIST_AGENT } from './built-in/reportingSpecialistAgent.js'
import { RETEST_SPECIALIST_AGENT } from './built-in/retestSpecialistAgent.js'
import { STATUSLINE_SETUP_AGENT } from './built-in/statuslineSetup.js'
import { VERIFICATION_AGENT } from './built-in/verificationAgent.js'
import { WEB_TESTING_SPECIALIST_AGENT } from './built-in/webTestingSpecialistAgent.js'
import type { AgentDefinition, BuiltInAgentDefinition } from './loadAgentsDir.js'

export function areExplorePlanAgentsEnabled(): boolean {
  return true
}

export function isVerificationAgentEnabled(): boolean {
  return true
}

export function areNetRunnerSecurityAgentsEnabled(): boolean {
  return true
}

const NET_RUNNER_SECURITY_AGENT_TYPES = new Set([
  'engagement-lead',
  'recon-specialist',
  'web-testing-specialist',
  'api-testing-specialist',
  'network-testing-specialist',
  'exploit-specialist',
  'privilege-escalation-specialist',
  'lateral-movement-specialist',
  'ad-specialist',
  'retest-specialist',
  'evidence-specialist',
  'reporting-specialist',
])

function withNetRunnerSecurityMemory(
  agent: AgentDefinition,
): AgentDefinition {
  if (!NET_RUNNER_SECURITY_AGENT_TYPES.has(agent.agentType)) {
    return agent
  }

  if (agent.source !== 'built-in') {
    return agent
  }

  const builtIn = agent as BuiltInAgentDefinition
  const baseGetSystemPrompt = builtIn.getSystemPrompt
  return {
    ...builtIn,
    memory: 'project',
    getSystemPrompt: (params: { toolUseContext: Pick<import('../../Tool.js').ToolUseContext, 'options'> }) => {
      const basePrompt = baseGetSystemPrompt(params)
      if (!isAutoMemoryEnabled()) {
        return basePrompt
      }
      return `${basePrompt}\n\n${loadAgentMemoryPrompt(builtIn.agentType, 'project')}`
    },
  }
}

export function getBuiltInAgents(): AgentDefinition[] {
  // Allow disabling all built-in agents via env var (useful for SDK users who want a blank slate)
  // Only applies in noninteractive mode (SDK/API usage)
  if (
    isEnvTruthy(
      process.env.NETRUNNER_AGENT_SDK_DISABLE_BUILTIN_AGENTS ??
        process.env.CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS,
    ) &&
    getIsNonInteractiveSession()
  ) {
    return []
  }

  // Use lazy require inside the function body to avoid circular dependency
  // issues at module init time. The coordinatorMode module depends on tools
  // which depend on AgentTool which imports this file.
  if (feature('COORDINATOR_MODE')) {
    if (isEnvTruthy(process.env.NETRUNNER_COORDINATOR_MODE)) {
      /* eslint-disable @typescript-eslint/no-require-imports */
      const { getCoordinatorAgents } =
        require('../../coordinator/workerAgent.js') as typeof import('../../coordinator/workerAgent.js')
      /* eslint-enable @typescript-eslint/no-require-imports */
      return getCoordinatorAgents()
    }
  }

  const agents: AgentDefinition[] = [
    GENERAL_PURPOSE_AGENT,
    STATUSLINE_SETUP_AGENT,
  ]

  if (areNetRunnerSecurityAgentsEnabled()) {
    agents.push(
      ENGAGEMENT_LEAD_AGENT,
      RECON_SPECIALIST_AGENT,
      WEB_TESTING_SPECIALIST_AGENT,
      API_TESTING_SPECIALIST_AGENT,
      NETWORK_TESTING_SPECIALIST_AGENT,
      EXPLOIT_SPECIALIST_AGENT,
      PRIVILEGE_ESCALATION_SPECIALIST_AGENT,
      LATERAL_MOVEMENT_SPECIALIST_AGENT,
      AD_SPECIALIST_AGENT,
      RETEST_SPECIALIST_AGENT,
      EVIDENCE_SPECIALIST_AGENT,
      REPORTING_SPECIALIST_AGENT,
    )
  }

  if (areExplorePlanAgentsEnabled()) {
    agents.push(EXPLORE_AGENT, PLAN_AGENT)
  }

  // Include Code Guide agent for non-SDK entrypoints
  const isNonSdkEntrypoint =
    process.env.NETRUNNER_ENTRYPOINT !== 'sdk-ts' &&
    process.env.NETRUNNER_ENTRYPOINT !== 'sdk-py' &&
    process.env.NETRUNNER_ENTRYPOINT !== 'sdk-cli'

  if (isNonSdkEntrypoint) {
    agents.push(NET_RUNNER_GUIDE_AGENT)
  }

  if (isVerificationAgentEnabled()) {
    agents.push(VERIFICATION_AGENT)
  }

  return agents.map(withNetRunnerSecurityMemory)
}
