import assert from 'node:assert/strict'
import test from 'node:test'

import { call } from './mode.ts'
import {
  SECURITY_WORKFLOWS,
  WORKFLOW_CATEGORIES,
  getWorkflowsByCategory,
} from '../../security/workflows.ts'

async function run(args: string): Promise<string> {
  const result = await call(args, {} as never)
  assert.equal(result.type, 'text')
  return result.type === 'text' ? result.value : ''
}

test('/mode with no argument lists every category and workflow', async () => {
  const out = await run('')
  for (const category of WORKFLOW_CATEGORIES) {
    assert.ok(
      out.includes(category.label.toUpperCase()),
      `menu missing category ${category.label}`,
    )
  }
  for (const workflow of SECURITY_WORKFLOWS) {
    assert.ok(out.includes(workflow.id), `menu missing workflow ${workflow.id}`)
  }
})

test('/mode <category> filters to that category only', async () => {
  const out = await run('pentest')
  for (const workflow of getWorkflowsByCategory('pentest')) {
    assert.ok(out.includes(workflow.id))
  }
  // ctf-mode is not a pentest workflow — must not appear
  assert.ok(!out.includes('ctf-mode'))
})

test('/mode <workflow-id> shows workflow detail with kickoff line', async () => {
  const out = await run('web-app-testing')
  assert.ok(out.includes('web-app-testing'))
  assert.ok(out.includes('/engagement init web-app-testing'))
})

test('/mode with unknown argument returns a guidance message', async () => {
  const out = await run('definitely-not-real')
  assert.ok(out.toLowerCase().includes('unknown'))
  assert.ok(out.includes('/mode'))
})
