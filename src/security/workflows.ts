import type { NetRunnerSkillName } from './skillDefinitions.js'
import {
  NET_RUNNER_AGENT_TYPES,
  type NetRunnerAgentType,
} from './agentTypes.js'

export type CapabilityPackName =
  | 'recon'
  | 'web'
  | 'api'
  | 'exploitation'
  | 'privilege-escalation'
  | 'lateral-movement'
  | 'exfiltration'
  | 'cloud'
  | 'binary'
  | 'network'
  | 'reporting'
  | 'lab-control'
  | 'evidence'
  | 'coordination'

export type CapabilityPack = {
  name: CapabilityPackName
  description: string
  primaryExecutionModel: 'skills-and-tools' | 'mcp-integration'
  optionalIntegrations?: string[]
}

export type SecurityWorkflow = {
  id: 'web-app-testing' | 'api-testing' | 'lab-target-testing' | 'ctf-mode'
  label: string
  description: string
  capabilityPacks: CapabilityPackName[]
  defaultSkills: NetRunnerSkillName[]
  specialistAgents: NetRunnerAgentType[]
}

export const CAPABILITY_PACKS: CapabilityPack[] = [
  {
    name: 'recon',
    description: 'Discovery and enumeration using built-in search, shell, and skill flows.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'web',
    description: 'HTTP, app surface, and browser-assisted testing workflows.',
    primaryExecutionModel: 'skills-and-tools',
    optionalIntegrations: ['proxying', 'capture'],
  },
  {
    name: 'api',
    description: 'Endpoint validation and API exploration workflows.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'exploitation',
    description:
      'Controlled exploit-path validation for confirmed weaknesses and proof-of-impact checks.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'privilege-escalation',
    description:
      'Post-access privilege-boundary validation with explicit guardrail checkpoints.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'lateral-movement',
    description:
      'Scoped pivot-path and segmentation testing in multi-host environments.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'exfiltration',
    description:
      'Data-flow and egress-path validation under explicit operator-approved constraints.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'cloud',
    description: 'Cloud posture and platform testing workflows.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'binary',
    description: 'Binary, reverse-engineering, and exploit-dev oriented workflows.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'network',
    description: 'Network enumeration and service validation workflows.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'reporting',
    description: 'Evidence-backed findings capture and reporting workflows.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'lab-control',
    description: 'Optional lab orchestration and environment control integrations.',
    primaryExecutionModel: 'mcp-integration',
    optionalIntegrations: ['htb', 'lab-control'],
  },
  {
    name: 'evidence',
    description: 'Artifact capture, note-taking, and traceable session outputs.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'coordination',
    description: 'Multi-agent orchestration and specialist routing.',
    primaryExecutionModel: 'skills-and-tools',
  },
]

export const SECURITY_WORKFLOWS: SecurityWorkflow[] = [
  {
    id: 'web-app-testing',
    label: 'Web App Testing',
    description: 'Security testing workflow for web application targets.',
    capabilityPacks: [
      'recon',
      'web',
      'exploitation',
      'evidence',
      'reporting',
      'coordination',
    ],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'evidence-capture'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'web-testing-specialist',
      'exploit-specialist',
      'retest-specialist',
      'evidence-specialist',
      'reporting-specialist',
    ],
  },
  {
    id: 'api-testing',
    label: 'API Testing',
    description: 'Security testing workflow for HTTP and programmatic APIs.',
    capabilityPacks: [
      'recon',
      'api',
      'exploitation',
      'evidence',
      'reporting',
      'coordination',
    ],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'evidence-capture'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'api-testing-specialist',
      'exploit-specialist',
      'retest-specialist',
      'evidence-specialist',
      'reporting-specialist',
    ],
  },
  {
    id: 'lab-target-testing',
    label: 'Lab Target Testing',
    description: 'Structured testing workflow for labs, HTB, and internal targets.',
    capabilityPacks: [
      'recon',
      'network',
      'privilege-escalation',
      'lateral-movement',
      'lab-control',
      'evidence',
      'reporting',
      'coordination',
    ],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'evidence-capture'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'network-testing-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
      'retest-specialist',
      'evidence-specialist',
      'reporting-specialist',
    ],
  },
  {
    id: 'ctf-mode',
    label: 'CTF Mode',
    description: 'Time-boxed testing workflow for challenge environments.',
    capabilityPacks: [
      'recon',
      'web',
      'network',
      'exploitation',
      'privilege-escalation',
      'lateral-movement',
      'exfiltration',
      'evidence',
      'coordination',
    ],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'evidence-capture'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'web-testing-specialist',
      'network-testing-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
      'retest-specialist',
      'evidence-specialist',
      'reporting-specialist',
    ],
  },
]

export function findWorkflow(id: SecurityWorkflow['id']): SecurityWorkflow | undefined {
  return SECURITY_WORKFLOWS.find(workflow => workflow.id === id)
}

export function getCapabilityPack(name: CapabilityPackName): CapabilityPack | undefined {
  return CAPABILITY_PACKS.find(pack => pack.name === name)
}

export function getNetRunnerBuiltInAgentTypes(): string[] {
  return [...NET_RUNNER_AGENT_TYPES]
}
