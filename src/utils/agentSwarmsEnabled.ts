import { isEnvTruthy } from './envUtils.js'
import { getInitialSettings } from './settings/settings.js'

/**
 * Check if --agent-teams flag is provided via CLI.
 * Checks process.argv directly to avoid import cycles with bootstrap/state.
 * Note: The flag is only shown in help for ant users, but if external users
 * pass it anyway, it will work (subject to the killswitch).
 */
function isAgentTeamsFlagSet(): boolean {
  return process.argv.includes('--agent-teams')
}

function isAgentTeamsSettingEnabled(): boolean {
  try {
    return getInitialSettings().agentTeamsEnabled === true
  } catch {
    return false
  }
}

/**
 * Centralized runtime check for agent teams/teammate features.
 * This is the single gate that should be checked everywhere teammates
 * are referenced (prompts, code, tools isEnabled, UI, etc.).
 *
 * Ant builds: always enabled.
 * External builds are pilot-enabled via any of:
 * 1. agentTeamsEnabled setting
 * 2. NETRUNNER_EXPERIMENTAL_AGENT_TEAMS env var
 * 3. --agent-teams flag
 */
export function isAgentSwarmsEnabled(): boolean {
  // Ant: always on
  if (process.env.USER_TYPE === 'ant') {
    return true
  }

  return (
    isAgentTeamsSettingEnabled() ||
    isEnvTruthy(process.env.NETRUNNER_EXPERIMENTAL_AGENT_TEAMS) ||
    isAgentTeamsFlagSet()
  )
}
