import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { getEmptyToolPermissionContext } from '../Tool.ts'
import { runWithCwdOverride } from '../utils/cwd.ts'
import {
  createFileStateCacheWithSizeLimit,
  READ_FILE_STATE_CACHE_SIZE,
} from '../utils/fileStateCache.ts'
import {
  processUserInput,
  type ProcessUserInputContext,
} from '../utils/processUserInput/processUserInput.ts'

function createTestContext(): ProcessUserInputContext {
  return {
    options: {
      commands: [],
      isNonInteractiveSession: false,
    },
    abortController: new AbortController(),
    readFileState: createFileStateCacheWithSizeLimit(
      READ_FILE_STATE_CACHE_SIZE,
    ),
    getAppState() {
      return {
        toolPermissionContext: getEmptyToolPermissionContext(),
        ultraplanSessionUrl: undefined,
        ultraplanLaunching: false,
        sessionHooks: new Map(),
      } as never
    },
    setAppState() {},
  } as unknown as ProcessUserInputContext
}

function collectUserMessageText(result: Awaited<ReturnType<typeof processUserInput>>): string[] {
  return result.messages
    .filter(message => message.type === 'user')
    .map(message => {
      const content = message.message.content
      if (typeof content === 'string') {
        return content
      }
      return content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n')
    })
}

test('plain-language assessment prompts auto-bootstrap engagement context into the model turn', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-natural-language-'))
  const context = createTestContext()

  const result = await runWithCwdOverride(cwd, () =>
    processUserInput({
      input: 'Assess https://target.example and begin with reconnaissance.',
      mode: 'prompt',
      setToolJSX: () => {},
      context,
      messages: [],
      skipAttachments: true,
    }),
  )

  assert.equal(result.shouldQuery, true)

  const allUserText = collectUserMessageText(result).join('\n')
  assert.match(
    allUserText,
    /\[Net-Runner auto-engagement initialized:/,
  )
  assert.match(allUserText, /\[Net-Runner engagement context\]/)
  assert.match(allUserText, /workflow=web-app-testing/)
  assert.match(allUserText, /authorization_status=confirmed/)
  assert.match(allUserText, /max_impact=limited/)
  assert.match(allUserText, /default_skills=engagement-setup, scope-guard/)
})

test('plain-language impact escalation updates the injected engagement context', async () => {
  const cwd = await mkdtemp(
    join(tmpdir(), 'net-runner-natural-language-confirm-'),
  )
  const context = createTestContext()

  await runWithCwdOverride(cwd, () =>
    processUserInput({
      input: 'Assess https://target.example and begin with reconnaissance.',
      mode: 'prompt',
      setToolJSX: () => {},
      context,
      messages: [],
      skipAttachments: true,
    }),
  )

  const confirmation = await runWithCwdOverride(cwd, () =>
    processUserInput({
      input: 'Escalate to intrusive validation and try controlled exploitation.',
      mode: 'prompt',
      setToolJSX: () => {},
      context,
      messages: [],
      skipAttachments: true,
    }),
  )

  const allUserText = collectUserMessageText(confirmation).join('\n')
  assert.match(
    allUserText,
    /\[Net-Runner engagement impact updated from operator prompt: max_impact=intrusive\]/,
  )
  assert.match(allUserText, /authorization_status=confirmed/)
  assert.match(allUserText, /max_impact=intrusive/)
  assert.match(
    allUserText,
    /default_behavior=Proceed inside scope, but require guardrail review before destructive or persistence-heavy actions\./,
  )
})
