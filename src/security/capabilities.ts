import type { NetRunnerAgentType } from './agentTypes.js'
import { execa } from 'execa'
import {
  findWorkflow,
  type CapabilityPackName,
  type SecurityWorkflow,
} from './workflows.js'

export type NetRunnerCapabilityId =
  | 'linux-command-execution'
  | 'code-execution'
  | 'filesystem-enumeration'
  | 'scripting-automation'
  | 'security-header-inspection'
  | 'google-search-intel'
  | 'retrieval-augmented-research'
  | 'http-curl'
  | 'http-wget'
  | 'nmap-enumeration'
  | 'netcat-probing'
  | 'netstat-enumeration'
  | 'shodan-search'
  | 'shodan-host-info'
  | 'web-request-analysis'
  | 'js-surface-mapping'
  | 'web-search-intel'
  | 'ssh-credential-command'
  | 'network-traffic-capture'
  | 'exploitation-webshell-simulation'
  | 'privilege-escalation-validation'
  | 'lateral-movement-validation'
  | 'exfiltration-channel-review'
  | 'report-export-generation'
  | 'crypto-enumeration'
  | 'structured-reasoning-log'
  | 'command-and-control-session'
  | 'mcp-api-endpoint-integration'

export type CapabilityExecutionModel =
  | 'skills-and-tools'
  | 'mcp-integration'
  | 'hybrid'

export type NetRunnerCapabilityDefinition = {
  id: NetRunnerCapabilityId
  label: string
  description: string
  implementationPath: string
  capabilityPacks: CapabilityPackName[]
  recommendedAgents: NetRunnerAgentType[]
  executionModel: CapabilityExecutionModel
  netRunnerTools: string[]
  requiredCommands?: string[]
  requiredEnv?: string[]
  optionalMcpServers?: string[]
  commandExamples?: string[]
}

export type CapabilityReadiness = {
  capabilityId: NetRunnerCapabilityId
  available: boolean
  missingCommands: string[]
  missingEnv: string[]
}

export type CapabilityReadinessSnapshot = {
  checks: CapabilityReadiness[]
  generatedAt: string
}

type CapabilityReadinessOptions = {
  env?: Record<string, string | undefined>
  commandExists?: (command: string) => Promise<boolean>
}

const CAPABILITY_DEFINITIONS: NetRunnerCapabilityDefinition[] = [
  {
    id: 'linux-command-execution',
    label: 'Linux Command Execution',
    description:
      'Baseline generic Linux command capability for reconnaissance, triage, and workflow scripting.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['recon', 'network', 'api', 'web'],
    recommendedAgents: [
      'engagement-lead',
      'recon-specialist',
      'web-testing-specialist',
      'api-testing-specialist',
      'network-testing-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
      'retest-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash', 'Read', 'Grep', 'Glob', 'TodoWrite'],
    requiredCommands: ['bash'],
    commandExamples: [
      'nmap -sV target',
      'curl -i https://target/api/health',
      'grep -R "token" .',
    ],
  },
  {
    id: 'code-execution',
    label: 'Code Execution',
    description:
      'Baseline execute_code capability for short helper scripts and payload shaping.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['recon', 'web', 'api', 'network', 'evidence'],
    recommendedAgents: [
      'recon-specialist',
      'web-testing-specialist',
      'api-testing-specialist',
      'network-testing-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
      'retest-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash', 'Write', 'Edit', 'Read'],
    requiredCommands: ['python3'],
  },
  {
    id: 'filesystem-enumeration',
    label: 'Filesystem Enumeration',
    description:
      'Structured filesystem traversal and artifact triage for source, config, and secret-surface discovery.',
    implementationPath: 'src/tools/FileReadTool/FileReadTool.ts',
    capabilityPacks: ['recon', 'evidence', 'web', 'api', 'binary'],
    recommendedAgents: [
      'recon-specialist',
      'evidence-specialist',
      'web-testing-specialist',
      'api-testing-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
      'retest-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Read', 'Glob', 'Grep', 'Bash'],
  },
  {
    id: 'scripting-automation',
    label: 'Scripting Automation',
    description:
      'Scripting capability for repeatable recon, parsing, and workflow automation tasks.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['recon', 'coordination', 'evidence', 'network'],
    recommendedAgents: [
      'engagement-lead',
      'recon-specialist',
      'network-testing-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
      'reporting-specialist',
      'evidence-specialist',
      'retest-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash', 'Write', 'Edit', 'Read'],
    requiredCommands: ['python3'],
  },
  {
    id: 'security-header-inspection',
    label: 'Security Header Inspection',
    description:
      'HTTP header analysis capability for CSP/HSTS/cookie and transport-hardening validation.',
    implementationPath: 'src/tools/WebFetchTool/WebFetchTool.ts',
    capabilityPacks: ['web', 'api', 'reporting', 'recon'],
    recommendedAgents: [
      'web-testing-specialist',
      'api-testing-specialist',
      'retest-specialist',
      'reporting-specialist',
      'evidence-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['WebFetch', 'Bash', 'Read'],
    requiredCommands: ['curl'],
  },
  {
    id: 'google-search-intel',
    label: 'Google Search Intelligence',
    description:
      'Search-engine-led reconnaissance capability for endpoint exposure, leaked docs, and target metadata.',
    implementationPath: 'src/tools/WebSearchTool/WebSearchTool.ts',
    capabilityPacks: ['recon', 'web', 'api'],
    recommendedAgents: [
      'recon-specialist',
      'web-testing-specialist',
      'api-testing-specialist',
      'exploit-specialist',
      'reporting-specialist',
      'engagement-lead',
    ],
    executionModel: 'hybrid',
    netRunnerTools: ['WebSearch', 'WebFetch'],
    optionalMcpServers: ['search', 'intel'],
  },
  {
    id: 'retrieval-augmented-research',
    label: 'Retrieval-Augmented Research',
    description:
      'Context retrieval and evidence-grounded research capability for workflow planning and reporting support.',
    implementationPath: 'src/tools/SkillTool/SkillTool.ts',
    capabilityPacks: ['coordination', 'reporting', 'evidence', 'recon'],
    recommendedAgents: [
      'engagement-lead',
      'evidence-specialist',
      'reporting-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
      'recon-specialist',
    ],
    executionModel: 'hybrid',
    netRunnerTools: ['Skill', 'Read', 'WebSearch'],
    optionalMcpServers: ['vector-store', 'knowledge-base', 'intel'],
  },
  {
    id: 'http-curl',
    label: 'HTTP Curl Probing',
    description: 'Baseline curl wrapper capability for controlled HTTP inspection.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['web', 'api', 'recon'],
    recommendedAgents: [
      'recon-specialist',
      'web-testing-specialist',
      'api-testing-specialist',
      'exploit-specialist',
      'reporting-specialist',
      'retest-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash', 'WebFetch'],
    requiredCommands: ['curl'],
  },
  {
    id: 'http-wget',
    label: 'HTTP Wget Retrieval',
    description: 'Baseline wget wrapper capability for recursive or file retrieval.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['web', 'recon'],
    recommendedAgents: [
      'recon-specialist',
      'web-testing-specialist',
      'api-testing-specialist',
      'exploit-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash', 'WebFetch'],
    requiredCommands: ['wget'],
  },
  {
    id: 'nmap-enumeration',
    label: 'Nmap Enumeration',
    description: 'Baseline nmap capability for service discovery and version mapping.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['network', 'recon', 'lab-control'],
    recommendedAgents: [
      'recon-specialist',
      'network-testing-specialist',
      'retest-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash', 'TodoWrite'],
    requiredCommands: ['nmap'],
  },
  {
    id: 'netcat-probing',
    label: 'Netcat Probing',
    description: 'Baseline netcat capability for low-level socket and banner checks.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['network', 'recon'],
    recommendedAgents: ['network-testing-specialist', 'recon-specialist'],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash'],
    requiredCommands: ['nc'],
  },
  {
    id: 'netstat-enumeration',
    label: 'Netstat Enumeration',
    description: 'Baseline netstat capability for listening services and active sockets.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['network', 'recon', 'lab-control'],
    recommendedAgents: ['network-testing-specialist', 'recon-specialist'],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash'],
    requiredCommands: ['netstat'],
  },
  {
    id: 'shodan-search',
    label: 'Shodan Search',
    description: 'Baseline Shodan query capability for internet-exposed asset discovery.',
    implementationPath: 'src/tools/WebSearchTool/WebSearchTool.ts',
    capabilityPacks: ['recon', 'network'],
    recommendedAgents: ['recon-specialist', 'network-testing-specialist'],
    executionModel: 'hybrid',
    netRunnerTools: ['WebSearch', 'Bash'],
    requiredEnv: ['SHODAN_API_KEY'],
    optionalMcpServers: ['shodan', 'threat-intel'],
  },
  {
    id: 'shodan-host-info',
    label: 'Shodan Host Info',
    description:
      'Baseline Shodan host detail capability for service fingerprints and exposure review.',
    implementationPath: 'src/tools/WebSearchTool/WebSearchTool.ts',
    capabilityPacks: ['recon', 'network'],
    recommendedAgents: ['recon-specialist', 'network-testing-specialist'],
    executionModel: 'hybrid',
    netRunnerTools: ['WebSearch', 'Bash'],
    requiredEnv: ['SHODAN_API_KEY'],
    optionalMcpServers: ['shodan', 'threat-intel'],
  },
  {
    id: 'web-request-analysis',
    label: 'Web Request Analysis',
    description:
      'Baseline web_request_framework capability for HTTP response and security-header analysis.',
    implementationPath: 'src/tools/WebFetchTool/WebFetchTool.ts',
    capabilityPacks: ['web', 'api', 'reporting'],
    recommendedAgents: [
      'web-testing-specialist',
      'api-testing-specialist',
      'exploit-specialist',
      'reporting-specialist',
      'retest-specialist',
      'evidence-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['WebFetch', 'Bash', 'Read'],
    requiredCommands: ['curl'],
  },
  {
    id: 'js-surface-mapping',
    label: 'JavaScript Surface Mapping',
    description:
      'Baseline JS surface mapper capability for endpoint extraction and GraphQL hints.',
    implementationPath: 'src/tools/WebFetchTool/WebFetchTool.ts',
    capabilityPacks: ['web', 'api', 'recon'],
    recommendedAgents: [
      'web-testing-specialist',
      'api-testing-specialist',
      'recon-specialist',
      'exploit-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['WebFetch', 'Bash', 'Write', 'Read'],
    requiredCommands: ['python3'],
  },
  {
    id: 'web-search-intel',
    label: 'Web Search Intel',
    description:
      'Baseline search_web capability for contextual security research and OSINT.',
    implementationPath: 'src/tools/WebSearchTool/WebSearchTool.ts',
    capabilityPacks: ['recon', 'web', 'api', 'network'],
    recommendedAgents: [
      'engagement-lead',
      'recon-specialist',
      'web-testing-specialist',
      'api-testing-specialist',
      'network-testing-specialist',
    ],
    executionModel: 'hybrid',
    netRunnerTools: ['WebSearch', 'WebFetch'],
    requiredEnv: ['PERPLEXITY_API_KEY'],
    optionalMcpServers: ['search', 'intel'],
  },
  {
    id: 'ssh-credential-command',
    label: 'SSH Credential Command',
    description:
      'Baseline sshpass capability for authenticated remote command execution in scoped labs.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['lab-control', 'network'],
    recommendedAgents: ['network-testing-specialist', 'engagement-lead'],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash'],
    requiredCommands: ['sshpass', 'ssh'],
  },
  {
    id: 'network-traffic-capture',
    label: 'Network Traffic Capture',
    description:
      'Baseline capture_traffic capability for packet collection and protocol inspection.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['network', 'lab-control', 'evidence'],
    recommendedAgents: [
      'network-testing-specialist',
      'evidence-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
    ],
    executionModel: 'hybrid',
    netRunnerTools: ['Bash', 'Write', 'Read'],
    requiredCommands: ['tcpdump', 'tshark'],
    optionalMcpServers: ['burp', 'wireshark', 'pcap'],
  },
  {
    id: 'exploitation-webshell-simulation',
    label: 'Exploitation Path Simulation',
    description:
      'Baseline webshell_suit capability reference for controlled exploit-path and upload-path validation.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['exploitation', 'web'],
    recommendedAgents: [
      'exploit-specialist',
      'web-testing-specialist',
      'retest-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash', 'WebFetch', 'Write', 'Read'],
    requiredCommands: ['curl'],
  },
  {
    id: 'privilege-escalation-validation',
    label: 'Privilege Escalation Validation',
    description:
      'Baseline post-access escalation capability using scoped command execution and enumeration.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['privilege-escalation', 'network'],
    recommendedAgents: [
      'privilege-escalation-specialist',
      'exploit-specialist',
      'lateral-movement-specialist',
      'network-testing-specialist',
      'retest-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash', 'Read', 'TodoWrite'],
    requiredCommands: ['bash'],
  },
  {
    id: 'lateral-movement-validation',
    label: 'Lateral Movement Validation',
    description:
      'Baseline credentialed remote command and session capability for segmented-target pivot validation.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['lateral-movement', 'network', 'lab-control'],
    recommendedAgents: [
      'lateral-movement-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'retest-specialist',
      'network-testing-specialist',
      'engagement-lead',
    ],
    executionModel: 'hybrid',
    netRunnerTools: ['Bash', 'Task', 'Agent'],
    requiredCommands: ['sshpass', 'ssh'],
    optionalMcpServers: ['lab-control', 'remote-shell'],
  },
  {
    id: 'exfiltration-channel-review',
    label: 'Exfiltration Channel Review',
    description:
      'Baseline-aligned egress-path inspection capability for data-flow and outbound-channel validation.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['exfiltration', 'network', 'reporting'],
    recommendedAgents: [
      'lateral-movement-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'retest-specialist',
      'reporting-specialist',
      'evidence-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash', 'WebFetch', 'TodoWrite'],
    requiredCommands: ['curl'],
  },
  {
    id: 'report-export-generation',
    label: 'Report Export Generation',
    description:
      'Net-Runner report export capability aligned with Baseline evidence-first findings workflows.',
    implementationPath: 'src/security/reporting.ts',
    capabilityPacks: ['reporting', 'evidence', 'coordination'],
    recommendedAgents: [
      'reporting-specialist',
      'evidence-specialist',
      'engagement-lead',
      'retest-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Read', 'Write', 'Edit', 'TodoWrite'],
  },
  {
    id: 'crypto-enumeration',
    label: 'Crypto Enumeration',
    description:
      'Baseline crypto_tools capability for common cryptographic utility workflows.',
    implementationPath: 'src/tools/BashTool/BashTool.tsx',
    capabilityPacks: ['recon', 'binary', 'network'],
    recommendedAgents: ['recon-specialist', 'network-testing-specialist'],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['Bash'],
    requiredCommands: ['openssl'],
  },
  {
    id: 'structured-reasoning-log',
    label: 'Structured Reasoning Log',
    description:
      'Baseline reasoning tools for explicit thought/reflection logging and key findings tracking.',
    implementationPath: 'src/skills/bundled/scopeGuard.ts',
    capabilityPacks: ['coordination', 'evidence', 'reporting'],
    recommendedAgents: [
      'engagement-lead',
      'retest-specialist',
      'evidence-specialist',
      'reporting-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
    ],
    executionModel: 'skills-and-tools',
    netRunnerTools: ['TodoWrite', 'Write', 'Read'],
  },
  {
    id: 'command-and-control-session',
    label: 'Command and Control Session',
    description:
      'Baseline reverse shell session orchestration capability for controlled C2-style interactions.',
    implementationPath: 'src/tools/AgentTool/AgentTool.tsx',
    capabilityPacks: ['lab-control', 'network', 'coordination'],
    recommendedAgents: [
      'engagement-lead',
      'network-testing-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
    ],
    executionModel: 'hybrid',
    netRunnerTools: ['Bash', 'Task', 'Agent'],
    optionalMcpServers: ['lab-control', 'remote-shell'],
  },
  {
    id: 'mcp-api-endpoint-integration',
    label: 'MCP API / Endpoint Integration',
    description:
      'Documented Baseline MCP capability for API and endpoint integrations through typed servers.',
    implementationPath: 'src/tools/MCPTool/MCPTool.ts',
    capabilityPacks: ['api', 'lab-control', 'reporting', 'coordination'],
    recommendedAgents: [
      'engagement-lead',
      'api-testing-specialist',
      'network-testing-specialist',
      'evidence-specialist',
      'reporting-specialist',
      'exploit-specialist',
      'privilege-escalation-specialist',
      'lateral-movement-specialist',
    ],
    executionModel: 'mcp-integration',
    netRunnerTools: ['MCPTool', 'ReadMcpResource', 'ListMcpResources'],
    optionalMcpServers: ['burp', 'postman', 'jira', 'notion', 'evidence-store'],
  },
] as const

export function getNetRunnerCapabilities(): NetRunnerCapabilityDefinition[] {
  return [...CAPABILITY_DEFINITIONS]
}

export function getNetRunnerCapability(
  id: NetRunnerCapabilityId,
): NetRunnerCapabilityDefinition | undefined {
  return CAPABILITY_DEFINITIONS.find(capability => capability.id === id)
}

export function getCapabilitiesForWorkflow(
  workflowId: SecurityWorkflow['id'],
): NetRunnerCapabilityDefinition[] {
  const workflow = findWorkflow(workflowId)
  if (!workflow) return []

  return CAPABILITY_DEFINITIONS.filter(capability =>
    capability.capabilityPacks.some(pack =>
      workflow.capabilityPacks.includes(pack),
    ),
  )
}

export function getCapabilitiesForAgent(
  agentType: NetRunnerAgentType,
): NetRunnerCapabilityDefinition[] {
  return CAPABILITY_DEFINITIONS.filter(capability =>
    capability.recommendedAgents.includes(agentType),
  )
}

async function defaultCommandExists(command: string): Promise<boolean> {
  const checkCommand =
    process.platform === 'win32'
      ? `where ${command}`
      : `command -v ${command}`
  const result = await execa(checkCommand, {
    shell: true,
    reject: false,
    stderr: 'ignore',
  })
  return result.exitCode === 0
}

export async function getCapabilityReadinessSnapshot(
  options: CapabilityReadinessOptions = {},
): Promise<CapabilityReadinessSnapshot> {
  const env = options.env ?? process.env
  const commandExists = options.commandExists ?? defaultCommandExists

  const commandCache = new Map<string, boolean>()
  async function getCommandAvailability(command: string): Promise<boolean> {
    const cached = commandCache.get(command)
    if (cached !== undefined) return cached
    const exists = await commandExists(command)
    commandCache.set(command, exists)
    return exists
  }

  const checks: CapabilityReadiness[] = []
  for (const capability of CAPABILITY_DEFINITIONS) {
    const requiredCommands = capability.requiredCommands ?? []
    const requiredEnv = capability.requiredEnv ?? []

    const missingCommands: string[] = []
    for (const command of requiredCommands) {
      if (!(await getCommandAvailability(command))) {
        missingCommands.push(command)
      }
    }

    const missingEnv = requiredEnv.filter(
      key => !(env[key] && String(env[key]).trim().length > 0),
    )

    checks.push({
      capabilityId: capability.id,
      available: missingCommands.length === 0 && missingEnv.length === 0,
      missingCommands,
      missingEnv,
    })
  }

  return {
    checks,
    generatedAt: new Date().toISOString(),
  }
}

export function summarizeWorkflowCapabilityReadiness(
  workflowId: SecurityWorkflow['id'],
  snapshot: CapabilityReadinessSnapshot,
): {
  total: number
  ready: number
  missing: number
  missingCapabilityIds: NetRunnerCapabilityId[]
} {
  const workflowCapabilities = getCapabilitiesForWorkflow(workflowId)
  const readinessById = new Map(snapshot.checks.map(check => [check.capabilityId, check]))
  const relevantChecks = workflowCapabilities
    .map(capability => readinessById.get(capability.id))
    .filter((check): check is CapabilityReadiness => Boolean(check))

  const ready = relevantChecks.filter(check => check.available).length
  const total = relevantChecks.length
  const missingCapabilityIds = relevantChecks
    .filter(check => !check.available)
    .map(check => check.capabilityId)

  return {
    total,
    ready,
    missing: total - ready,
    missingCapabilityIds,
  }
}

export function renderWorkflowCapabilityReadiness(
  workflowId: SecurityWorkflow['id'],
  snapshot: CapabilityReadinessSnapshot,
): string {
  const workflow = findWorkflow(workflowId)
  if (!workflow) {
    return `Unknown workflow: ${workflowId}`
  }

  const readinessById = new Map(snapshot.checks.map(check => [check.capabilityId, check]))
  const capabilities = getCapabilitiesForWorkflow(workflowId)
  const summary = summarizeWorkflowCapabilityReadiness(workflowId, snapshot)

  const lines = [
    `workflow: ${workflow.id} (${workflow.label})`,
    `capabilities ready: ${summary.ready}/${summary.total}`,
    '',
  ]

  for (const capability of capabilities) {
    const readiness = readinessById.get(capability.id)
    if (!readiness) continue

    const status = readiness.available ? 'READY' : 'MISSING'
    lines.push(`- [${status}] ${capability.label} (${capability.id})`)
    if (readiness.missingCommands.length > 0) {
      lines.push(`  missing commands: ${readiness.missingCommands.join(', ')}`)
    }
    if (readiness.missingEnv.length > 0) {
      lines.push(`  missing env: ${readiness.missingEnv.join(', ')}`)
    }
  }

  return lines.join('\n')
}
