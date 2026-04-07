import { afterEach, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  getAllowedSettingSources,
  getCwdState,
  getOriginalCwd,
  getProjectRoot,
  setAllowedSettingSources,
  setCwdState,
  setOriginalCwd,
  setProjectRoot,
} from '../bootstrap/state.ts'
import { resetSettingsCache } from './settings/settingsCache.ts'
import { isAgentSwarmsEnabled } from './agentSwarmsEnabled.ts'

const originalEnv = {
  NETRUNNER_EXPERIMENTAL_AGENT_TEAMS:
    process.env.NETRUNNER_EXPERIMENTAL_AGENT_TEAMS,
  USER_TYPE: process.env.USER_TYPE,
}
const originalArgv = [...process.argv]
const originalOriginalCwd = getOriginalCwd()
const originalCwdState = getCwdState()
const originalProjectRoot = getProjectRoot()
const originalAllowedSettingSources = [...getAllowedSettingSources()]

afterEach(() => {
  if (originalEnv.NETRUNNER_EXPERIMENTAL_AGENT_TEAMS === undefined) {
    delete process.env.NETRUNNER_EXPERIMENTAL_AGENT_TEAMS
  } else {
    process.env.NETRUNNER_EXPERIMENTAL_AGENT_TEAMS =
      originalEnv.NETRUNNER_EXPERIMENTAL_AGENT_TEAMS
  }

  if (originalEnv.USER_TYPE === undefined) {
    delete process.env.USER_TYPE
  } else {
    process.env.USER_TYPE = originalEnv.USER_TYPE
  }

  process.argv.splice(0, process.argv.length, ...originalArgv)
  setOriginalCwd(originalOriginalCwd)
  setCwdState(originalCwdState)
  setProjectRoot(originalProjectRoot)
  setAllowedSettingSources([...originalAllowedSettingSources])
  resetSettingsCache()
})

async function setupProjectSettings(settings: Record<string, unknown>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'nr-agent-swarm-'))
  const configDir = join(dir, '.netrunner')
  const settingsPath = join(configDir, 'settings.json')

  await mkdir(configDir, { recursive: true })
  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`)

  setOriginalCwd(dir)
  setCwdState(dir)
  setProjectRoot(dir)
  setAllowedSettingSources(['userSettings', 'projectSettings', 'localSettings'])
  resetSettingsCache()

  return dir
}

test('agent swarms stay off by default for external builds', () => {
  delete process.env.USER_TYPE
  delete process.env.NETRUNNER_EXPERIMENTAL_AGENT_TEAMS
  process.argv.splice(0, process.argv.length, ...originalArgv.filter(arg => arg !== '--agent-teams'))
  resetSettingsCache()

  expect(isAgentSwarmsEnabled()).toBe(false)
})

test('agent swarms can be enabled from project settings', async () => {
  delete process.env.USER_TYPE
  delete process.env.NETRUNNER_EXPERIMENTAL_AGENT_TEAMS
  process.argv.splice(0, process.argv.length, ...originalArgv.filter(arg => arg !== '--agent-teams'))

  const dir = await setupProjectSettings({ agentTeamsEnabled: true })

  try {
    expect(isAgentSwarmsEnabled()).toBe(true)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('agent swarms can be enabled from env or CLI for external builds', () => {
  delete process.env.USER_TYPE
  delete process.env.NETRUNNER_EXPERIMENTAL_AGENT_TEAMS
  process.argv.splice(0, process.argv.length, ...originalArgv.filter(arg => arg !== '--agent-teams'))
  resetSettingsCache()

  process.env.NETRUNNER_EXPERIMENTAL_AGENT_TEAMS = '1'
  expect(isAgentSwarmsEnabled()).toBe(true)

  delete process.env.NETRUNNER_EXPERIMENTAL_AGENT_TEAMS
  process.argv.push('--agent-teams')
  expect(isAgentSwarmsEnabled()).toBe(true)
})
