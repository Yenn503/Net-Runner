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
  | 'forensics'
  | 'code-audit'
  | 'threat-intel'

export type CapabilityPack = {
  name: CapabilityPackName
  description: string
  primaryExecutionModel: 'skills-and-tools' | 'mcp-integration'
  optionalIntegrations?: string[]
}

export type WorkflowCategory = 'ctf' | 'pentest' | 'redteam' | 'blueteam'

export type WorkflowCategoryInfo = {
  id: WorkflowCategory
  label: string
  blurb: string
}

/**
 * Top-level grouping shown by the `/mode` command and the engagement-lead
 * startup menu. Every SecurityWorkflow belongs to exactly one category.
 */
export const WORKFLOW_CATEGORIES: WorkflowCategoryInfo[] = [
  { id: 'ctf', label: 'CTF', blurb: 'Capture-the-flag — fast, time-boxed, no client report.' },
  { id: 'pentest', label: 'Pentest', blurb: 'Scoped penetration tests against apps, networks, and cloud.' },
  { id: 'redteam', label: 'Red Team', blurb: 'Adversary emulation — full-chain, threat-actor TTPs.' },
  { id: 'blueteam', label: 'Blue Team', blurb: 'Defensive work — incident response, forensics, code audit.' },
]

export type SecurityWorkflow = {
  id:
    | 'web-app-testing'
    | 'api-testing'
    | 'mobile-app-testing'
    | 'lab-target-testing'
    | 'adversary-emulation'
    | 'bug-bounty-recon-validation'
    | 'ctf-mode'
    | 'ad-testing'
    | 'wifi-testing'
    | 'dfir-incident-response'
    | 'code-audit-review'
    | 'cloud-assessment'
  category: WorkflowCategory
  label: string
  description: string
  capabilityPacks: CapabilityPackName[]
  defaultSkills: NetRunnerSkillName[]
  specialistAgents: NetRunnerAgentType[]
}

const BASE_WORKFLOW_SKILLS: NetRunnerSkillName[] = [
  'engagement-setup',
  'scope-guard',
  'recon-plan',
  'digital-footprint-assessment',
  'target-fingerprinting',
  'evidence-capture',
  'report-generation',
  'caveman-harness',
]

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
  {
    name: 'forensics',
    description: 'Digital forensics, IR triage, memory/disk/log analysis, malware artifact extraction.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'code-audit',
    description: 'Static code analysis, secret scanning, dependency CVE checks, IaC misconfiguration audits.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'threat-intel',
    description: 'IOC enrichment, threat actor attribution, public reputation lookups, and TI platform integration.',
    primaryExecutionModel: 'skills-and-tools',
  },
]

export const SECURITY_WORKFLOWS: SecurityWorkflow[] = [
  {
    id: 'web-app-testing',
    category: 'pentest',
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
    defaultSkills: [
      ...BASE_WORKFLOW_SKILLS,
      'identity-correlation',
      'wordpress-attack-tree',
      'headless-browser-validation',
      'serverless-edge-recon',
      'http-smuggling-cache-poisoning',
      'vuln-assessment',
      'feedback-loop',
      'waf-detection',
      'statistical-verification',
      'oob-verification',
    ],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'app-testing-specialist',
      'infra-specialist',
      'evidence-reporting-specialist',
    ],
  },
  {
    id: 'api-testing',
    category: 'pentest',
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
    defaultSkills: [
      ...BASE_WORKFLOW_SKILLS,
      'identity-correlation',
      'headless-browser-validation',
      'serverless-edge-recon',
      'vuln-assessment',
      'feedback-loop',
      'waf-detection',
      'statistical-verification',
      'oob-verification',
    ],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'app-testing-specialist',
      'infra-specialist',
      'evidence-reporting-specialist',
    ],
  },
  {
    id: 'mobile-app-testing',
    category: 'pentest',
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
    defaultSkills: [...BASE_WORKFLOW_SKILLS, 'identity-correlation', 'vuln-assessment'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'app-testing-specialist',
      'infra-specialist',
      'evidence-reporting-specialist',
    ],
  },
  {
    id: 'lab-target-testing',
    category: 'pentest',
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
    defaultSkills: [
      ...BASE_WORKFLOW_SKILLS,
      'exploit-validation',
      'post-exploitation-plan',
      'attack-path-analysis',
      'feedback-loop',
      'waf-detection',
      'statistical-verification',
      'oob-verification',
      'mcts-planning',
    ],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'infra-specialist',
      'evidence-reporting-specialist',
    ],
  },
  {
    id: 'adversary-emulation',
    category: 'redteam',
    label: 'Adversary Emulation',
    description: 'Guarded command-and-control and post-compromise workflow for explicitly authorized adversary-emulation operations.',
    capabilityPacks: [
      'recon',
      'coordination',
      'lab-control',
      'network',
      'exploitation',
      'privilege-escalation',
      'lateral-movement',
      'evidence',
      'reporting',
    ],
    defaultSkills: [
      ...BASE_WORKFLOW_SKILLS,
      'identity-correlation',
      'c2-infrastructure',
      'c2-operations',
      'exploit-validation',
      'post-exploitation-plan',
      'attack-path-analysis',
      'feedback-loop',
      'mcts-planning',
    ],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'infra-specialist',
      'evidence-reporting-specialist',
    ],
  },
  {
    id: 'bug-bounty-recon-validation',
    category: 'pentest',
    label: 'Bug Bounty Recon & Validation',
    description: 'External bug-bounty workflow chaining recon, parameter mining, headless DOM XSS confirmation, and OOB verification with evidence-tagged findings.',
    capabilityPacks: [
      'recon',
      'web',
      'api',
      'evidence',
      'reporting',
      'threat-intel',
    ],
    defaultSkills: [
      ...BASE_WORKFLOW_SKILLS,
      'identity-correlation',
      'threat-intel-enrichment',
      'bug-bounty-validation',
      'headless-browser-validation',
      'serverless-edge-recon',
      'http-smuggling-cache-poisoning',
      'vuln-assessment',
      'feedback-loop',
      'waf-detection',
      'statistical-verification',
      'oob-verification',
    ],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'app-testing-specialist',
      'infra-specialist',
      'evidence-reporting-specialist',
    ],
  },
  {
    id: 'ctf-mode',
    category: 'ctf',
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
    defaultSkills: [
      ...BASE_WORKFLOW_SKILLS,
      'exploit-validation',
      'post-exploitation-plan',
      'attack-path-analysis',
      'feedback-loop',
      'statistical-verification',
      'oob-verification',
      'mcts-planning',
    ],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'app-testing-specialist',
      'infra-specialist',
      'evidence-reporting-specialist',
    ],
  },
  {
    id: 'ad-testing',
    category: 'pentest',
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
    defaultSkills: [
      ...BASE_WORKFLOW_SKILLS,
      'exploit-validation',
      'post-exploitation-plan',
      'attack-path-analysis',
      'feedback-loop',
      'waf-detection',
      'statistical-verification',
      'oob-verification',
      'mcts-planning',
    ],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'infra-specialist',
      'evidence-reporting-specialist',
    ],
  },
  {
    id: 'wifi-testing',
    category: 'pentest',
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
    defaultSkills: [...BASE_WORKFLOW_SKILLS, 'vuln-assessment'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'infra-specialist',
      'evidence-reporting-specialist',
    ],
  },
  {
    id: 'dfir-incident-response',
    category: 'blueteam',
    label: 'DFIR Incident Response',
    description: 'Triage and analysis workflow for incident response and forensic investigation engagements.',
    capabilityPacks: ['recon', 'forensics', 'evidence', 'reporting', 'coordination', 'threat-intel'],
    defaultSkills: [...BASE_WORKFLOW_SKILLS, 'dfir-triage', 'threat-intel-enrichment', 'vuln-assessment', 'evidence-capture'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'code-forensics-specialist',
      'evidence-reporting-specialist',
    ],
  },
  {
    id: 'code-audit-review',
    category: 'blueteam',
    label: 'Code Audit Review',
    description: 'Static analysis, secret-scan, dependency, and IaC audit workflow for source code repositories.',
    capabilityPacks: ['code-audit', 'evidence', 'reporting', 'coordination'],
    defaultSkills: [...BASE_WORKFLOW_SKILLS, 'code-audit-review', 'vuln-assessment', 'evidence-capture'],
    specialistAgents: [
      'engagement-lead',
      'code-forensics-specialist',
      'evidence-reporting-specialist',
    ],
  },
  {
    id: 'cloud-assessment',
    category: 'pentest',
    label: 'Cloud Assessment',
    description: 'Cloud posture and platform-security workflow for AWS, Azure, GCP, and Kubernetes targets. Routes to existing specialists; cloud tooling is shell-driven via the catalog.',
    capabilityPacks: ['recon', 'cloud', 'network', 'exploitation', 'evidence', 'reporting', 'coordination'],
    defaultSkills: [...BASE_WORKFLOW_SKILLS, 'vuln-assessment', 'evidence-capture'],
    specialistAgents: [
      'engagement-lead',
      'recon-specialist',
      'infra-specialist',
      'evidence-reporting-specialist',
    ],
  },
]

/**
 * Every workflow id as a non-empty tuple — single source of truth for Zod
 * enums and any other place that needs the exhaustive list. Keeps validators
 * from drifting out of sync with SECURITY_WORKFLOWS.
 */
export const WORKFLOW_IDS = SECURITY_WORKFLOWS.map(w => w.id) as [
  SecurityWorkflow['id'],
  ...SecurityWorkflow['id'][],
]

export function findWorkflow(id: SecurityWorkflow['id']): SecurityWorkflow | undefined {
  return SECURITY_WORKFLOWS.find(workflow => workflow.id === id)
}

/** True when `id` is a valid workflow id. */
export function isWorkflowId(id: string): id is SecurityWorkflow['id'] {
  return SECURITY_WORKFLOWS.some(workflow => workflow.id === id)
}

/** All workflows in a category, in registry order. */
export function getWorkflowsByCategory(
  category: WorkflowCategory,
): SecurityWorkflow[] {
  return SECURITY_WORKFLOWS.filter(workflow => workflow.category === category)
}

export function getCapabilityPack(name: CapabilityPackName): CapabilityPack | undefined {
  return CAPABILITY_PACKS.find(pack => pack.name === name)
}

export function getNetRunnerBuiltInAgentTypes(): string[] {
  return [...NET_RUNNER_AGENT_TYPES]
}
