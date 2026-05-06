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
  systemPrompt?: string
}

function getBuiltInAgentsViaBun(): SerializedBuiltInAgent[] {
  const modulePath = join(process.cwd(), 'src/tools/AgentTool/builtInAgents.ts')
  const script = `
    import { getBuiltInAgents } from '${modulePath.replaceAll('\\', '\\\\')}'
    const netRunnerTypes = new Set([
      'engagement-lead',
      'recon-specialist',
      'app-testing-specialist',
      'infra-specialist',
      'code-forensics-specialist',
      'evidence-reporting-specialist',
    ])
    const agents = getBuiltInAgents().map(agent => ({
      agentType: agent.agentType,
      whenToUse: agent.whenToUse,
      tools: agent.tools,
      disallowedTools: agent.disallowedTools,
      memory: agent.memory,
      systemPrompt: agent.source === 'built-in' && netRunnerTypes.has(agent.agentType)
        ? agent.getSystemPrompt({ toolUseContext: { options: {} } })
        : undefined,
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
      'app-testing-specialist',
      'infra-specialist',
      'code-forensics-specialist',
      'evidence-reporting-specialist',
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

test('Net-Runner specialists load role contracts and scoped toolsets', () => {
  const agents = getBuiltInAgentMap()
  const engagementLead = agents.get('engagement-lead')
  const recon = agents.get('recon-specialist')
  const appTesting = agents.get('app-testing-specialist')
  const infra = agents.get('infra-specialist')
  const codeForensics = agents.get('code-forensics-specialist')
  const evidenceReporting = agents.get('evidence-reporting-specialist')

  assert.ok(engagementLead?.systemPrompt?.includes('Net-Runner role contract:'))
  assert.ok(engagementLead?.systemPrompt?.includes('Net-Runner domain expert standard:'))
  assert.ok(engagementLead?.systemPrompt?.includes('Runnable capability catalog:'))
  assert.ok(engagementLead?.systemPrompt?.includes('Eval dimensions: task-adherence'))

  assert.ok(recon?.systemPrompt?.includes('maigret-digital-footprint'))
  assert.ok(recon?.systemPrompt?.includes('kali-'))
  assert.ok(recon?.systemPrompt?.includes('Completion criteria:'))

  assert.ok(appTesting?.systemPrompt?.includes('indirect-prompt-injection-resistance'))

  assert.ok(evidenceReporting?.systemPrompt?.includes('chain-of-custody evidence'))
  assert.ok(evidenceReporting?.systemPrompt?.includes('Cite ledger/artifact refs'))
  assert.ok(evidenceReporting?.systemPrompt?.includes('Evidence Gaps'))
  assert.ok(evidenceReporting?.systemPrompt?.includes('Validation status comes from typed validation entries'))

  assert.equal(engagementLead?.tools?.includes('Agent'), true)
  assert.equal(recon?.tools?.includes('Bash'), true)
  assert.equal(recon?.tools?.includes('WebSearch'), true)
  assert.equal(appTesting?.tools?.includes('Bash'), true)
  assert.equal(evidenceReporting?.tools?.includes('Write'), true)
  assert.equal(evidenceReporting?.tools?.includes('Bash'), true)
  assert.equal(evidenceReporting?.tools?.includes('Edit'), true)

  assert.ok(codeForensics)
  assert.ok(codeForensics?.systemPrompt?.includes('Net-Runner role contract:'))
  assert.ok(codeForensics?.systemPrompt?.includes('chain-of-custody') || codeForensics?.systemPrompt?.includes('hash'))
  assert.ok(codeForensics?.systemPrompt?.includes('semgrep') || codeForensics?.systemPrompt?.includes('SAST'))
  assert.equal(codeForensics?.tools?.includes('Bash'), true)
  assert.equal(codeForensics?.tools?.includes('Write'), true)
  assert.equal(codeForensics?.tools?.includes('Edit'), true)
  assert.equal(codeForensics?.memory, 'project')

  assert.ok(infra)
  assert.ok(infra?.systemPrompt?.includes('Net-Runner role contract:'))
  assert.equal(infra?.tools?.includes('Bash'), true)
  assert.equal(infra?.memory, 'project')
})
