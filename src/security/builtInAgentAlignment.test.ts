import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import test from 'node:test'

type SerializedBuiltInAgent = {
  agentType: string
  whenToUse: string
  tools?: string[]
  disallowedTools?: string[]
  memory?: string
}

function getBuiltInAgentsViaBun(): SerializedBuiltInAgent[] {
  const modulePath = join(process.cwd(), 'src/tools/AgentTool/builtInAgents.ts')
  const script = `
    import { getBuiltInAgents } from '${modulePath.replaceAll('\\', '\\\\')}'
    const agents = getBuiltInAgents().map(agent => ({
      agentType: agent.agentType,
      whenToUse: agent.whenToUse,
      tools: agent.tools,
      disallowedTools: agent.disallowedTools,
      memory: agent.memory,
    }))
    console.log(JSON.stringify(agents))
  `
  const output = execFileSync('bun', ['-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })

  return JSON.parse(output) as SerializedBuiltInAgent[]
}

function getBuiltInAgentMap() {
  return new Map(getBuiltInAgentsViaBun().map(agent => [agent.agentType, agent]))
}

test('default built-in registry includes core runtime and Net-Runner specialist agents', () => {
  const agentTypes = getBuiltInAgentsViaBun().map(agent => agent.agentType)

  assert.equal(
    [
      'general-purpose',
      'statusline-setup',
      'engagement-lead',
      'recon-specialist',
      'web-testing-specialist',
      'api-testing-specialist',
      'network-testing-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
      'retest-specialist',
      'evidence-specialist',
      'reporting-specialist',
      'Explore',
      'Plan',
      'verification',
    ].every(agentType => agentTypes.includes(agentType)),
    true,
  )
})

test('explore, plan, verification, and engagement coordination remain distinct roles', () => {
  const agents = getBuiltInAgentMap()
  const explore = agents.get('Explore')
  const plan = agents.get('Plan')
  const verification = agents.get('verification')
  const engagementLead = agents.get('engagement-lead')
  const recon = agents.get('recon-specialist')

  assert.ok(explore)
  assert.ok(plan)
  assert.ok(verification)
  assert.ok(engagementLead)
  assert.ok(recon)

  assert.match(explore.whenToUse, /exploring codebases/i)
  assert.match(plan.whenToUse, /implementation plans/i)
  assert.match(verification.whenToUse, /verify/i)
  assert.match(engagementLead.whenToUse, /coordinate/i)
  assert.match(recon.whenToUse, /discovery|enumeration|recon/i)

  assert.notEqual(explore.whenToUse, plan.whenToUse)
  assert.notEqual(engagementLead.whenToUse, recon.whenToUse)

  assert.equal(explore.disallowedTools?.includes('Edit'), true)
  assert.equal(explore.disallowedTools?.includes('Write'), true)
  assert.equal(plan.disallowedTools?.includes('Edit'), true)
  assert.equal(plan.disallowedTools?.includes('Write'), true)
  assert.equal(verification.disallowedTools?.includes('Edit'), true)
  assert.equal(verification.disallowedTools?.includes('Write'), true)

  assert.equal(engagementLead.tools?.includes('Agent'), true)
  assert.equal(engagementLead.memory, 'project')
  assert.equal(recon.memory, 'project')
})
