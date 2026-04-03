import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDeepLink, parseDeepLink } from '../utils/deepLink/parseDeepLink.ts'
import { getScheduledTasksFilePath } from '../utils/scheduledTasksPaths.ts'

test('scheduled tasks default to the .netrunner envelope', () => {
  assert.equal(
    getScheduledTasksFilePath('/tmp/net-runner-workspace'),
    '/tmp/net-runner-workspace/.netrunner/scheduled_tasks.json',
  )
})

test('deep links emit the net-runner:// protocol', () => {
  assert.equal(
    buildDeepLink({ query: 'scan target', cwd: '/tmp/workspace' }),
    'net-runner://open?q=scan+target&cwd=%2Ftmp%2Fworkspace',
  )

  assert.deepEqual(parseDeepLink('net-runner://open?q=test'), {
    query: 'test',
    cwd: undefined,
    repo: undefined,
  })
})
