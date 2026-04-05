export type NetRunnerSkillName =
  | 'engagement-setup'
  | 'scope-guard'
  | 'recon-plan'
  | 'target-fingerprinting'
  | 'evidence-capture'
  | 'vuln-assessment'
  | 'exploit-validation'
  | 'post-exploitation-plan'
  | 'report-generation'
  | 'attack-path-analysis'
  | 'apt-simulation'
  | 'feedback-loop'
  | 'statistical-verification'
  | 'waf-detection'
  | 'mcts-planning'
  | 'oob-verification'

export type NetRunnerSkillDefinition = {
  name: NetRunnerSkillName
  title: string
  description: string
  primaryExecutionModel: 'skills-and-tools'
}

export const NET_RUNNER_SKILL_DEFINITIONS: NetRunnerSkillDefinition[] = [
  {
    name: 'engagement-setup',
    title: 'Engagement Setup',
    description:
      'Collect scope, targets, goals, and testing constraints before work begins.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'scope-guard',
    title: 'Scope Guard',
    description:
      'Re-check authorization, impact, and engagement boundaries before risky actions.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'recon-plan',
    title: 'Recon Plan',
    description:
      'Build a phased reconnaissance and enumeration plan for the current target.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'target-fingerprinting',
    title: 'Target Fingerprinting',
    description:
      'Auto-detect target technology stack, OS, services, frameworks, and exposed attack surface before routing to specialists. Produces a structured fingerprint used for workflow optimization.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'evidence-capture',
    title: 'Evidence Capture',
    description:
      'Capture artifacts, findings, and operator notes in a report-friendly structure.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'vuln-assessment',
    title: 'Vulnerability Assessment',
    description:
      'Systematic vulnerability identification using scanner output correlation, manual validation, and severity classification.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'exploit-validation',
    title: 'Exploit Validation',
    description:
      'Controlled proof-of-impact execution with scope-guard checkpoints, rollback plans, and evidence-first validation.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'post-exploitation-plan',
    title: 'Post-Exploitation Plan',
    description:
      'Build a structured post-access plan: privilege escalation paths, lateral movement options, persistence mechanisms, and data access targets.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'report-generation',
    title: 'Report Generation',
    description:
      'Transform structured evidence and findings into a complete assessment report with executive summary, technical details, and remediation guidance.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'attack-path-analysis',
    title: 'Attack Path Analysis',
    description:
      'Map multi-step attack chains from initial access through privilege escalation to objective completion, identifying critical path dependencies and alternative routes.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'apt-simulation',
    title: 'APT Simulation',
    description:
      'Launch a threat simulation based on a specific APT group or target industry. Follows real-world attack chains mapped to MITRE ATT&CK techniques for realistic red-team exercises.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'feedback-loop',
    title: 'Feedback Loop Engine',
    description:
      'Classify tool and HTTP failures into actionable categories (WAF, rate-limit, auth, timeout), select payload mutation strategies, and produce structured retry guidance with adaptive learning.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'statistical-verification',
    title: 'Statistical Verification',
    description:
      "Confirm time-based and boolean-based blind injection vulnerabilities using Welch's t-test. Reduces false positives by comparing baseline vs payload response times or lengths with formal hypothesis testing.",
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'waf-detection',
    title: 'WAF Detection & Bypass',
    description:
      'Fingerprint Web Application Firewalls from HTTP response data and map detected WAF types to specific bypass techniques. Supports Cloudflare, Akamai, Imperva, ModSecurity, AWS WAF, and 6 more.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'mcts-planning',
    title: 'MCTS Attack Path Planning',
    description:
      'Use Monte Carlo Tree Search to discover optimal attack paths. Models the pentest as a decision tree with UCB1 exploration, simulates outcomes, and ranks next actions with agent assignments.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'oob-verification',
    title: 'Out-of-Band Verification',
    description:
      'Generate and track OOB callback payloads for blind vulnerability confirmation (blind XXE, SSRF, RCE, SQLi, Log4Shell). Produces structured payloads and monitors callback status.',
    primaryExecutionModel: 'skills-and-tools',
  },
] as const

export function getNetRunnerSkillDefinition(
  name: NetRunnerSkillName,
): NetRunnerSkillDefinition | undefined {
  return NET_RUNNER_SKILL_DEFINITIONS.find(skill => skill.name === name)
}
