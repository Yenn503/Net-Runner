// @ts-nocheck
import { feature } from 'bun:bundle'
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
import { isAutoMemoryEnabled } from '../../memdir/paths.js'
import { isEnvTruthy } from '../../utils/envUtils.js'
import { loadAgentMemoryPrompt } from './agentMemory.js'
import { NET_RUNNER_GUIDE_AGENT } from './built-in/netRunnerGuideAgent.js'
import { ENGAGEMENT_LEAD_AGENT } from './built-in/engagementLeadAgent.js'
import { EXPLORE_AGENT } from './built-in/exploreAgent.js'
import { RECON_SPECIALIST_AGENT } from './built-in/reconSpecialistAgent.js'
import { APP_TESTING_SPECIALIST_AGENT } from './built-in/appTestingSpecialistAgent.js'
import { INFRA_SPECIALIST_AGENT } from './built-in/infraSpecialistAgent.js'
import { CODE_FORENSICS_SPECIALIST_AGENT } from './built-in/codeForensicsSpecialistAgent.js'
import { EVIDENCE_REPORTING_SPECIALIST_AGENT } from './built-in/evidenceReportingSpecialistAgent.js'
import { GENERAL_PURPOSE_AGENT } from './built-in/generalPurposeAgent.js'
import { PLAN_AGENT } from './built-in/planAgent.js'
import { STATUSLINE_SETUP_AGENT } from './built-in/statuslineSetup.js'
import { VERIFICATION_AGENT } from './built-in/verificationAgent.js'
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
  'app-testing-specialist',
  'infra-specialist',
  'code-forensics-specialist',
  'evidence-reporting-specialist',
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
      APP_TESTING_SPECIALIST_AGENT,
      INFRA_SPECIALIST_AGENT,
      CODE_FORENSICS_SPECIALIST_AGENT,
      EVIDENCE_REPORTING_SPECIALIST_AGENT,
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
