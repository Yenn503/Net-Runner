import type { NetRunnerSkillName } from './skillDefinitions.js'
import {
  NET_RUNNER_AGENT_TYPES,
  type NetRunnerAgentType,
} from './agentTypes.js'

export type CapabilityPackName =
  | 'recon'
  | 'web'
  | 'api'
  | 'mobile'
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
  | 'active-directory'
  | 'wifi'
  | 'database'

export type CapabilityPack = {
  name: CapabilityPackName
  description: string
  primaryExecutionModel: 'skills-and-tools' | 'mcp-integration'
  optionalIntegrations?: string[]
}

export type SecurityWorkflow = {
  id:
    | 'web-app-testing'
    | 'api-testing'
    | 'mobile-app-testing'
    | 'lab-target-testing'
    | 'ctf-mode'
    | 'ad-testing'
    | 'wifi-testing'
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
    name: 'mobile',
    description: 'Mobile application static, dynamic, and device-assisted testing workflows.',
    primaryExecutionModel: 'skills-and-tools',
    optionalIntegrations: ['proxying', 'device-bridge'],
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
  {
    name: 'active-directory',
    description: 'Active Directory domain enumeration, Kerberos attacks, credential abuse, and trust exploitation.',
    primaryExecutionModel: 'skills-and-tools',
    optionalIntegrations: ['bloodhound', 'active-directory'],
  },
  {
    name: 'wifi',
    description: 'Wireless network testing, WPA/WPA2 attacks, rogue AP, and 802.11 analysis.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'database',
    description: 'Database enumeration, post-exploitation querying, and data access validation.',
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
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'vuln-assessment', 'report-generation', 'feedback-loop', 'waf-detection', 'statistical-verification', 'oob-verification'],
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
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'vuln-assessment', 'report-generation', 'feedback-loop', 'waf-detection', 'statistical-verification', 'oob-verification'],
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
    id: 'mobile-app-testing',
    label: 'Mobile App Testing',
    description: 'Security testing workflow for Android and mobile application targets.',
    capabilityPacks: [
      'recon',
      'mobile',
      'api',
      'binary',
      'exploitation',
      'evidence',
      'reporting',
      'coordination',
    ],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'vuln-assessment', 'report-generation'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'web-testing-specialist',
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
      'exploitation',
      'privilege-escalation',
      'lateral-movement',
      'active-directory',
      'lab-control',
      'evidence',
      'reporting',
      'coordination',
    ],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'report-generation', 'feedback-loop', 'waf-detection', 'statistical-verification', 'oob-verification', 'mcts-planning'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'network-testing-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
      'ad-specialist',
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
      'api',
      'network',
      'binary',
      'exploitation',
      'privilege-escalation',
      'lateral-movement',
      'exfiltration',
      'evidence',
      'coordination',
    ],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'feedback-loop', 'statistical-verification', 'oob-verification', 'mcts-planning'],
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
  {
    id: 'ad-testing',
    label: 'Active Directory Testing',
    description: 'Structured testing workflow for Active Directory domain environments.',
    capabilityPacks: [
      'recon',
      'active-directory',
      'network',
      'database',
      'privilege-escalation',
      'lateral-movement',
      'exploitation',
      'evidence',
      'reporting',
      'coordination',
    ],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'report-generation', 'feedback-loop', 'waf-detection', 'statistical-verification', 'oob-verification', 'mcts-planning'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'ad-specialist',
      'network-testing-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
      'exploit-specialist',
      'retest-specialist',
      'evidence-specialist',
      'reporting-specialist',
    ],
  },
  {
    id: 'wifi-testing',
    label: 'WiFi Testing',
    description: 'Wireless network security assessment workflow for 802.11 environments.',
    capabilityPacks: [
      'recon',
      'wifi',
      'network',
      'exploitation',
      'evidence',
      'reporting',
      'coordination',
    ],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'vuln-assessment', 'report-generation'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'network-testing-specialist',
      'exploit-specialist',
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
