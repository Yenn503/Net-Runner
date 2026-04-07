import { afterEach, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, unlink, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  getAllowedSettingSources,
  getCwdState,
  getProjectRoot,
  setAllowedSettingSources,
  setCwdState,
  setProjectRoot,
} from '../bootstrap/state.ts'
import {
  clearAgentDefinitionsCache,
  getAgentDefinitionsWithOverrides,
} from '../tools/AgentTool/loadAgentsDir.ts'
import { loadMarkdownFilesForSubdir } from './markdownConfigLoader.ts'

const originalEnv = {
  USE_BUILTIN_RIPGREP: process.env.USE_BUILTIN_RIPGREP,
  NETRUNNER_USE_NATIVE_FILE_SEARCH: process.env.NETRUNNER_USE_NATIVE_FILE_SEARCH,
}
const originalAllowedSettingSources = [...getAllowedSettingSources()]
const originalCwdState = getCwdState()
const originalProjectRoot = getProjectRoot()

async function createProjectAgentFile(agentType: string): Promise<{
  dir: string
  filePath: string
}> {
  const dir = await mkdtemp(join(tmpdir(), 'nr-agent-loader-'))
  const agentDir = join(dir, '.netrunner', 'agents')
  const filePath = join(agentDir, `${agentType}.md`)

  await mkdir(agentDir, { recursive: true })
  await writeFile(
    filePath,
    `---\nname: ${agentType}\ndescription: \"${agentType}\"\n---\n\nprompt\n`,
  )

  setAllowedSettingSources(['userSettings', 'projectSettings', 'localSettings'])
  setCwdState(dir)
  setProjectRoot(dir)

  return { dir, filePath }
}

afterEach(() => {
  if (originalEnv.USE_BUILTIN_RIPGREP === undefined) {
    delete process.env.USE_BUILTIN_RIPGREP
  } else {
    process.env.USE_BUILTIN_RIPGREP = originalEnv.USE_BUILTIN_RIPGREP
  }

  if (originalEnv.NETRUNNER_USE_NATIVE_FILE_SEARCH === undefined) {
    delete process.env.NETRUNNER_USE_NATIVE_FILE_SEARCH
  } else {
    process.env.NETRUNNER_USE_NATIVE_FILE_SEARCH =
      originalEnv.NETRUNNER_USE_NATIVE_FILE_SEARCH
  }

  setAllowedSettingSources([...originalAllowedSettingSources])
  setCwdState(originalCwdState)
  setProjectRoot(originalProjectRoot)
  clearAgentDefinitionsCache()
  loadMarkdownFilesForSubdir.cache?.clear?.()
})

test('loads project markdown config even when builtin ripgrep is unavailable', async () => {
  process.env.USE_BUILTIN_RIPGREP = '1'
  delete process.env.NETRUNNER_USE_NATIVE_FILE_SEARCH

  const { dir, filePath } = await createProjectAgentFile('loader-fallback-agent')

  try {
    const loaded = await loadMarkdownFilesForSubdir('agents', dir)

    expect(loaded.map(file => file.filePath)).toContain(filePath)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('clearing agent definitions cache reflects deleted project agents', async () => {
  process.env.NETRUNNER_USE_NATIVE_FILE_SEARCH = '1'

  const { dir, filePath } = await createProjectAgentFile('cache-refresh-agent')

  try {
    clearAgentDefinitionsCache()
    const beforeDelete = await getAgentDefinitionsWithOverrides(dir)
    expect(
      beforeDelete.activeAgents.some(agent => agent.agentType === 'cache-refresh-agent'),
    ).toBe(true)

    await unlink(filePath)

    clearAgentDefinitionsCache()
    const afterDelete = await getAgentDefinitionsWithOverrides(dir)
    expect(
      afterDelete.activeAgents.some(agent => agent.agentType === 'cache-refresh-agent'),
    ).toBe(false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
