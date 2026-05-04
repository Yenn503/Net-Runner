export type NetRunnerSkillName =
  | 'engagement-setup'
  | 'scope-guard'
  | 'recon-plan'
  | 'digital-footprint-assessment'
  | 'identity-correlation'
  | 'c2-infrastructure'
  | 'c2-operations'
  | 'wordpress-attack-tree'
  | 'headless-browser-validation'
  | 'bug-bounty-validation'
  | 'http-smuggling-cache-poisoning'
  | 'serverless-edge-recon'
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
  | 'caveman-harness'

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
    name: 'digital-footprint-assessment',
    title: 'Digital Footprint Assessment',
    description:
      'Run username and profile OSINT with Maigret-backed checks, recursive identity pivoting, report exports, and evidence-safe correlation.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'identity-correlation',
    title: 'Identity Correlation',
    description:
      'Correlate employee, username, email, and public-account signals using LinkedInDumper, Maigret, Holehe, and GHunt to build evidence-backed target identity graphs.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'c2-infrastructure',
    title: 'C2 Infrastructure',
    description:
      'Plan and validate adversary-emulation command-and-control infrastructure: redirectors, listener transports, domain approvals, profile parameters, payload generation, and teardown requirements.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'c2-operations',
    title: 'C2 Operations',
    description:
      'Run guarded C2 operator workflows for payload handling, listener lifecycle, callback operations, pivot enablement, evidence capture, and operator-role separation.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'wordpress-attack-tree',
    title: 'WordPress Attack Tree',
    description:
      'Run WordPress-specific fingerprinting, enumeration, guarded credential testing, XML-RPC and REST exposure checks, and plugin/theme attack-path validation with WPScan-backed evidence capture.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'headless-browser-validation',
    title: 'Headless Browser Validation',
    description:
      'Validate findings inside a real rendering engine using a Camofox stealth-browser REST endpoint or local Playwright/Chromium so DOM XSS, CSP behaviour, SPA routes, and anti-bot OSINT can be confirmed beyond static HTTP scrapes.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'bug-bounty-validation',
    title: 'Bug Bounty Validation Pipeline',
    description:
      'Orchestrate a real bug-bounty validation pipeline: recon, parameter mining, dalfox/qsreplace XSS candidates, headless browser DOM confirmation, OOB verification, and evidence-first triage with false-positive notes.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'http-smuggling-cache-poisoning',
    title: 'HTTP Smuggling & Cache Poisoning',
    description:
      'Probe authorized web targets for HTTP request smuggling (CL.TE/TE.CL/TE.TE) and cache poisoning vectors using smuggler, header fuzzing, and OOB confirmation, with strict guardrails around impact and evidence capture.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'serverless-edge-recon',
    title: 'Serverless & Edge Recon',
    description:
      'Map Vercel, Netlify, Cloudflare Workers, AWS Lambda, and Azure Functions exposure: app deployments, function endpoints, environment leakage, edge route enumeration, and SSRF/AC misconfigs with nuclei-template-driven validation.',
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
  {
    name: 'caveman-harness',
    title: 'Caveman Harness',
    description:
      'Compress agent communication and handoffs using caveman-style brevity while preserving exact technical terms, evidence refs, commands, paths, URLs, and code.',
    primaryExecutionModel: 'skills-and-tools',
  },
] as const

export function getNetRunnerSkillDefinition(
  name: NetRunnerSkillName,
): NetRunnerSkillDefinition | undefined {
  return NET_RUNNER_SKILL_DEFINITIONS.find(skill => skill.name === name)
}
