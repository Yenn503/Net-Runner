import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { AGENT_PATHS } from '../components/agents/types.ts'
import { getNetRunnerConfigHomeDir } from '../utils/envUtils.ts'
import {
  getPrimaryProjectSettingsPath,
  getProjectInstructionDirCandidates,
  getProjectInstructionFileCandidates,
} from '../utils/projectConfigPaths.ts'
import { filterInjectedMemoryFiles } from '../utils/netRunnerMd.ts'
import { getScheduledTasksFilePath } from '../utils/scheduledTasksPaths.ts'
import {
  getEngagementAgentMemoryDir,
  getEngagementMemoryDir,
} from './paths.ts'

test('Net-Runner config home defaults can be redirected through NETRUNNER_CONFIG_DIR', () => {
  const originalNetRunnerConfigDir = process.env.NETRUNNER_CONFIG_DIR

  process.env.NETRUNNER_CONFIG_DIR = '/tmp/net-runner-home'

  assert.equal(getNetRunnerConfigHomeDir(), '/tmp/net-runner-home')

  if (originalNetRunnerConfigDir === undefined) {
    delete process.env.NETRUNNER_CONFIG_DIR
  } else {
    process.env.NETRUNNER_CONFIG_DIR = originalNetRunnerConfigDir
  }
})

test('engagement memory helpers resolve inside the .netrunner envelope', () => {
  assert.equal(
    getEngagementMemoryDir('/tmp/net-runner-workspace'),
    join('/tmp/net-runner-workspace', '.netrunner', 'memory'),
  )
  assert.equal(
    getEngagementAgentMemoryDir('/tmp/net-runner-workspace', 'engagement-lead'),
    join('/tmp/net-runner-workspace', '.netrunner', 'memory', 'agents', 'engagement-lead'),
  )
})

test('project runtime paths resolve only through the .netrunner envelope', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'net-runner-config-'))

  try {
    mkdirSync(join(workspace, '.netrunner', 'rules'), { recursive: true })
    mkdirSync(join(workspace, '.netrunner', 'instructions'), {
      recursive: true,
    })
    writeFileSync(join(workspace, 'NETRUNNER.md'), '# root netrunner')
    writeFileSync(join(workspace, '.netrunner', 'NETRUNNER.md'), '# netrunner')

    assert.deepEqual(getProjectInstructionDirCandidates(workspace), [
      join(workspace, '.netrunner', 'rules'),
      join(workspace, '.netrunner', 'instructions'),
    ])
    assert.deepEqual(getProjectInstructionFileCandidates(workspace), [
      join(workspace, 'NETRUNNER.md'),
      join(workspace, '.netrunner', 'NETRUNNER.md'),
    ])
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
})

test('project runtime paths ignore legacy project config when .netrunner is absent', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'net-runner-legacy-'))

  try {
    assert.deepEqual(getProjectInstructionDirCandidates(workspace), [])
    assert.deepEqual(getProjectInstructionFileCandidates(workspace), [
      join(workspace, 'NETRUNNER.md'),
      join(workspace, '.netrunner', 'NETRUNNER.md'),
    ])
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
})

test('project settings paths resolve only to the .netrunner envelope', () => {
  assert.equal(
    getPrimaryProjectSettingsPath(
      '/tmp/net-runner-workspace',
      'projectSettings',
    ),
    join('/tmp/net-runner-workspace', '.netrunner', 'settings.json'),
  )
  assert.equal(
    getPrimaryProjectSettingsPath(
      '/tmp/net-runner-workspace',
      'localSettings',
    ),
    join('/tmp/net-runner-workspace', '.netrunner', 'settings.local.json'),
  )
})

test('scheduled tasks and agent files default to the .netrunner envelope', () => {
  assert.equal(
    getScheduledTasksFilePath('/tmp/net-runner-workspace'),
    join('/tmp/net-runner-workspace', '.netrunner', 'scheduled_tasks.json'),
  )
  assert.equal(AGENT_PATHS.FOLDER_NAME, '.netrunner')
})

test('relevant-memory prefetch suppresses legacy auto-memory injection when enabled', () => {
  const originalEnablePrefetch =
    process.env.NETRUNNER_ENABLE_RELEVANT_MEMORY_PREFETCH
  const originalDisablePrefetch =
    process.env.NETRUNNER_DISABLE_RELEVANT_MEMORY_PREFETCH

  process.env.NETRUNNER_ENABLE_RELEVANT_MEMORY_PREFETCH = '1'
  delete process.env.NETRUNNER_DISABLE_RELEVANT_MEMORY_PREFETCH

  try {
    const filtered = filterInjectedMemoryFiles([
      {
        path: '/tmp/auto/MEMORY.md',
        type: 'AutoMem',
        content: '# auto memory',
      },
      {
        path: '/tmp/project/NETRUNNER.md',
        type: 'Project',
        content: '# project instructions',
      },
      {
        path: '/tmp/project/.netrunner/NETRUNNER.md',
        type: 'Local',
        content: '# local instructions',
      },
    ])

    assert.deepEqual(
      filtered.map(file => file.type),
      ['Project', 'Local'],
    )
  } finally {
    if (originalEnablePrefetch === undefined) {
      delete process.env.NETRUNNER_ENABLE_RELEVANT_MEMORY_PREFETCH
    } else {
      process.env.NETRUNNER_ENABLE_RELEVANT_MEMORY_PREFETCH =
        originalEnablePrefetch
    }

    if (originalDisablePrefetch === undefined) {
      delete process.env.NETRUNNER_DISABLE_RELEVANT_MEMORY_PREFETCH
    } else {
      process.env.NETRUNNER_DISABLE_RELEVANT_MEMORY_PREFETCH =
        originalDisablePrefetch
    }
  }
})
