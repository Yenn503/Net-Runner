import assert from 'node:assert/strict'
import test from 'node:test'

import { initBundledSkills } from '../skills/bundled/index.js'
import { clearBundledSkills, getBundledSkills } from '../skills/bundledSkills.js'
import { getCapabilitiesForWorkflow } from './capabilities.ts'
import {
  getNetRunnerSkillDefinition,
  NET_RUNNER_SKILL_DEFINITIONS,
} from './skillDefinitions.ts'
import { findWorkflow } from './workflows.ts'

test('Net-Runner registers bundled security workflow skills', () => {
  const skillNames = NET_RUNNER_SKILL_DEFINITIONS.map(skill => skill.name)

  assert.deepEqual(skillNames, [
    'engagement-setup',
    'scope-guard',
    'recon-plan',
    'digital-footprint-assessment',
    'identity-correlation',
    'c2-infrastructure',
    'c2-operations',
    'wordpress-attack-tree',
    'headless-browser-validation',
    'bug-bounty-validation',
    'http-smuggling-cache-poisoning',
    'serverless-edge-recon',
    'target-fingerprinting',
    'evidence-capture',
    'vuln-assessment',
    'exploit-validation',
    'post-exploitation-plan',
    'report-generation',
    'attack-path-analysis',
    'apt-simulation',
    'feedback-loop',
    'statistical-verification',
    'waf-detection',
    'mcts-planning',
    'oob-verification',
    'caveman-harness',
    'dfir-triage',
    'code-audit-review',
    'threat-intel-enrichment',
    'wifi-assessment',
    'mobile-app-testing',
    'binary-exploitation',
    'memory-search',
    'memory-save',
  ])
  assert.equal(
    getNetRunnerSkillDefinition('scope-guard')?.primaryExecutionModel,
    'skills-and-tools',
  )
  assert.equal(
    getNetRunnerSkillDefinition('target-fingerprinting')?.primaryExecutionModel,
    'skills-and-tools',
  )
})

test('workflow-declared Net-Runner skills are actually registered as bundled skills', () => {
  clearBundledSkills()
  initBundledSkills()

  const bundledSkillNames = new Set(getBundledSkills().map(skill => skill.name))

  for (const skill of NET_RUNNER_SKILL_DEFINITIONS) {
    assert.equal(
      bundledSkillNames.has(skill.name),
      true,
      `Missing bundled skill registration for ${skill.name}`,
    )
  }

  clearBundledSkills()
})

test('digital footprint and caveman harness skills expose real execution guidance', async () => {
  clearBundledSkills()
  initBundledSkills()

  const skills = new Map(getBundledSkills().map(skill => [skill.name, skill]))
  const digitalFootprint = skills.get('digital-footprint-assessment')
  const identityCorrelation = skills.get('identity-correlation')
  const c2Infrastructure = skills.get('c2-infrastructure')
  const c2Operations = skills.get('c2-operations')
  const wordpressAttackTree = skills.get('wordpress-attack-tree')
  const cavemanHarness = skills.get('caveman-harness')

  assert.ok(digitalFootprint)
  assert.equal(digitalFootprint.type, 'prompt')
  assert.ok(digitalFootprint.allowedTools?.includes('Bash'))
  assert.ok(digitalFootprint.allowedTools?.includes('Write'))
  assert.ok(identityCorrelation)
  assert.equal(identityCorrelation.type, 'prompt')
  assert.ok(identityCorrelation.allowedTools?.includes('WebSearch'))
  assert.ok(c2Infrastructure)
  assert.equal(c2Infrastructure.type, 'prompt')
  assert.ok(c2Infrastructure.allowedTools?.includes('Bash'))
  assert.ok(c2Infrastructure.allowedTools?.includes('ReadMcpResourceTool'))
  assert.ok(c2Operations)
  assert.equal(c2Operations.type, 'prompt')
  assert.ok(c2Operations.allowedTools?.includes('Agent'))
  assert.ok(c2Operations.allowedTools?.includes('SendMessage'))
  assert.ok(wordpressAttackTree)
  assert.equal(wordpressAttackTree.type, 'prompt')
  assert.ok(wordpressAttackTree.allowedTools?.includes('WebFetch'))
  assert.ok(cavemanHarness)
  assert.equal(cavemanHarness.type, 'prompt')
  assert.ok(cavemanHarness.allowedTools?.includes('Read'))

  const digitalPrompt = await digitalFootprint.getPromptForCommand('exampleuser', {} as never)
  const identityPrompt = await identityCorrelation.getPromptForCommand('https://www.linkedin.com/company/example', {} as never)
  const c2InfrastructurePrompt = await c2Infrastructure.getPromptForCommand('operation red-team-1 domain c2.example stack sliver', {} as never)
  const c2OperationsPrompt = await c2Operations.getPromptForCommand('operation red-team-1 payload apollo http', {} as never)
  const wordpressPrompt = await wordpressAttackTree.getPromptForCommand('https://target.example', {} as never)
  const cavemanPrompt = await cavemanHarness.getPromptForCommand('Long handoff', {} as never)
  const digitalText = digitalPrompt[0]?.type === 'text' ? digitalPrompt[0].text : ''
  const identityText = identityPrompt[0]?.type === 'text' ? identityPrompt[0].text : ''
  const c2InfrastructureText = c2InfrastructurePrompt[0]?.type === 'text' ? c2InfrastructurePrompt[0].text : ''
  const c2OperationsText = c2OperationsPrompt[0]?.type === 'text' ? c2OperationsPrompt[0].text : ''
  const wordpressText = wordpressPrompt[0]?.type === 'text' ? wordpressPrompt[0].text : ''
  const cavemanText = cavemanPrompt[0]?.type === 'text' ? cavemanPrompt[0].text : ''

  assert.match(digitalText, /maigret <username>/)
  assert.match(digitalText, /Do not simulate results/)
  assert.match(identityText, /linkedindumper\.py/)
  assert.match(identityText, /\$LINKEDIN_COOKIE_LI_AT/)
  assert.match(identityText, /identity-correlation\.json/)
  assert.match(c2InfrastructureText, /sliver-client/)
  assert.match(c2InfrastructureText, /mythic-cli/)
  assert.match(c2InfrastructureText, /operator, lead, spectator/)
  assert.match(c2OperationsText, /mTLS, WireGuard, HTTP\(S\), or DNS/)
  assert.match(c2OperationsText, /payload type and C2 profile/)
  assert.match(wordpressText, /wpscan --url <url> -e vp,vt,tt,cb,dbe,u,m --plugins-detection mixed --random-user-agent/)
  assert.match(wordpressText, /xmlrpc\.php/)
  const headlessBrowser = skills.get('headless-browser-validation')
  const bugBounty = skills.get('bug-bounty-validation')
  assert.ok(headlessBrowser)
  assert.equal(headlessBrowser.type, 'prompt')
  assert.ok(headlessBrowser.allowedTools?.includes('Bash'))
  assert.ok(bugBounty)
  assert.equal(bugBounty.type, 'prompt')
  assert.ok(bugBounty.allowedTools?.includes('WebSearch'))
  const headlessPrompt = await headlessBrowser.getPromptForCommand('https://target.example/?q=<x>', {} as never)
  const bugBountyPrompt = await bugBounty.getPromptForCommand('program example.com', {} as never)
  const headlessText = headlessPrompt[0]?.type === 'text' ? headlessPrompt[0].text : ''
  const bugBountyText = bugBountyPrompt[0]?.type === 'text' ? bugBountyPrompt[0].text : ''
  assert.match(headlessText, /CAMOFOX_URL/)
  assert.match(headlessText, /localhost:9377/)
  assert.match(headlessText, /Playwright/)
  assert.match(bugBountyText, /subfinder -d <root>/)
  assert.match(bugBountyText, /katana -list <dir>\/subdomains\.txt -d 3 -jc -kf all/)
  assert.match(bugBountyText, /interactsh-client/)
  assert.match(bugBountyText, /dom-confirmed/)
  assert.ok(findWorkflow('web-app-testing')?.defaultSkills.includes('headless-browser-validation'))
  assert.ok(findWorkflow('api-testing')?.defaultSkills.includes('headless-browser-validation'))
  assert.ok(findWorkflow('bug-bounty-recon-validation')?.defaultSkills.includes('bug-bounty-validation'))
  assert.ok(findWorkflow('bug-bounty-recon-validation')?.defaultSkills.includes('headless-browser-validation'))
  assert.ok(
    getCapabilitiesForWorkflow('bug-bounty-recon-validation').some(
      capability => capability.id === 'bug-bounty-validation-pipeline',
    ),
  )
  assert.ok(
    getCapabilitiesForWorkflow('web-app-testing').some(
      capability => capability.id === 'headless-browser-validation',
    ),
  )
  const smuggling = skills.get('http-smuggling-cache-poisoning')
  const serverless = skills.get('serverless-edge-recon')
  assert.ok(smuggling)
  assert.equal(smuggling.type, 'prompt')
  assert.ok(serverless)
  assert.equal(serverless.type, 'prompt')
  const smugglingPrompt = await smuggling.getPromptForCommand('https://target.example', {} as never)
  const serverlessPrompt = await serverless.getPromptForCommand('example.com', {} as never)
  const smugglingText = smugglingPrompt[0]?.type === 'text' ? smugglingPrompt[0].text : ''
  const serverlessText = serverlessPrompt[0]?.type === 'text' ? serverlessPrompt[0].text : ''
  assert.match(smugglingText, /smuggler -u <url> -m all/)
  assert.match(smugglingText, /X-Forwarded-Host/)
  assert.match(smugglingText, /interactsh-client/)
  assert.match(serverlessText, /\*\.vercel\.app/)
  assert.match(serverlessText, /\.netlify\/functions/)
  assert.match(serverlessText, /lambda-url/)
  assert.ok(findWorkflow('web-app-testing')?.defaultSkills.includes('serverless-edge-recon'))
  assert.ok(findWorkflow('web-app-testing')?.defaultSkills.includes('http-smuggling-cache-poisoning'))
  assert.ok(findWorkflow('api-testing')?.defaultSkills.includes('serverless-edge-recon'))
  assert.ok(findWorkflow('bug-bounty-recon-validation')?.defaultSkills.includes('serverless-edge-recon'))
  assert.ok(findWorkflow('bug-bounty-recon-validation')?.defaultSkills.includes('http-smuggling-cache-poisoning'))
  assert.match(cavemanText, /Keep exact commands/)
  assert.ok(findWorkflow('web-app-testing')?.defaultSkills.includes('identity-correlation'))
  assert.ok(findWorkflow('api-testing')?.defaultSkills.includes('identity-correlation'))
  assert.ok(findWorkflow('mobile-app-testing')?.defaultSkills.includes('identity-correlation'))
  assert.ok(findWorkflow('adversary-emulation')?.defaultSkills.includes('c2-infrastructure'))
  assert.ok(findWorkflow('adversary-emulation')?.defaultSkills.includes('c2-operations'))
  assert.ok(findWorkflow('web-app-testing')?.defaultSkills.includes('wordpress-attack-tree'))
  assert.ok(
    getCapabilitiesForWorkflow('web-app-testing').some(
      capability => capability.id === 'identity-correlation-graph',
    ),
  )
  assert.ok(
    getCapabilitiesForWorkflow('api-testing').some(
      capability => capability.id === 'identity-correlation-graph',
    ),
  )
  assert.ok(
    getCapabilitiesForWorkflow('adversary-emulation').some(
      capability => capability.id === 'c2-redirector-fronting',
    ),
  )
  assert.ok(
    getCapabilitiesForWorkflow('adversary-emulation').some(
      capability => capability.id === 'c2-implant-generation',
    ),
  )
  assert.ok(
    getCapabilitiesForWorkflow('adversary-emulation').some(
      capability => capability.id === 'c2-beacon-operations',
    ),
  )
  assert.ok(
    getCapabilitiesForWorkflow('web-app-testing').some(
      capability => capability.id === 'wordpress-attack-chain',
    ),
  )

  clearBundledSkills()
})
