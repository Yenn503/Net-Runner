// ---------------------------------------------------------------------------
// APT Simulation Workflows
// ---------------------------------------------------------------------------
// Each workflow pairs an APT group's attack chain with the Net-Runner engine
// components needed to simulate it: capability packs, skills, and specialist
// agents.  The `simulationGuidance` field is injected into the LLM's prompt
// so it follows the correct attack pattern.
//
// Workflow IDs follow the pattern: apt-sim-<group>-<industry>
// ---------------------------------------------------------------------------

import type { AptSimulationWorkflow } from './types.js'

export const APT_SIMULATION_WORKFLOWS: AptSimulationWorkflow[] = [
  // ── Government / Espionage ────────────────────────────────────────────
  {
    id: 'apt-sim-apt29-government',
    label: 'APT29 Government Cloud Espionage Simulation',
    description: 'Simulate APT29 (Cozy Bear / Midnight Blizzard) cloud-focused espionage against government and policy organizations.',
    aptGroupId: 'apt29',
    targetIndustry: 'government',
    attackChainId: 'apt29',
    capabilityPacks: ['recon', 'web', 'exploitation', 'privilege-escalation', 'lateral-movement', 'cloud', 'active-directory', 'evidence', 'reporting', 'coordination'],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'report-generation'],
    specialistAgents: ['engagement-lead', 'recon-specialist', 'app-testing-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'evidence-reporting-specialist', 'evidence-reporting-specialist'],
    recommendedImpact: 'intrusive',
    simulationGuidance: `You are simulating APT29 (Cozy Bear / Midnight Blizzard / NOBELIUM) tradecraft.

ATTACK PATTERN — Cloud-Focused Government Espionage:
1. RECON: Identify target personnel, email addresses, cloud tenant details, and public-facing services. Focus on IT administrators and cloud infrastructure.
2. INITIAL ACCESS: Deliver spearphishing links to credential-harvesting pages targeting cloud SSO. Abuse valid cloud credentials via password spraying or token theft.
3. EXECUTION: Execute through cloud management APIs, PowerShell, and remote management tools.
4. PERSISTENCE: Create additional cloud credentials, register OAuth applications, add cloud accounts.
5. DEFENSE EVASION: Use stolen tokens to bypass MFA, disable security logging, blend into legitimate admin activity.
6. CREDENTIAL ACCESS: Harvest OAuth tokens, steal application access tokens, password spray, MFA fatigue.
7. DISCOVERY: Enumerate cloud infrastructure, tenant configs, privileged accounts, connected services.
8. LATERAL MOVEMENT: Move between cloud tenants, on-prem to cloud, across federated identity boundaries.
9. COLLECTION: Access email via Graph API, download from SharePoint/OneDrive, collect from cloud storage.
10. EXFILTRATION: Exfiltrate over encrypted HTTPS or to attacker-controlled cloud storage.

KEY TECHNIQUES: T1566.002, T1078.004, T1098.001, T1136.003, T1528, T1621, T1114.002, T1530, T1567.002
MITRE ATT&CK: https://attack.mitre.org/groups/G0016/

Follow each phase sequentially. Document findings and evidence at every step. Flag any action that exceeds the declared scope or impact level.`,
  },

  {
    id: 'apt-sim-apt28-government',
    label: 'APT28 Government Credential Harvesting Simulation',
    description: 'Simulate APT28 (Fancy Bear / Forest Blizzard) aggressive credential harvesting and AD exploitation against government/defense targets.',
    aptGroupId: 'apt28',
    targetIndustry: 'government',
    attackChainId: 'apt28',
    capabilityPacks: ['recon', 'web', 'exploitation', 'privilege-escalation', 'lateral-movement', 'active-directory', 'network', 'evidence', 'reporting', 'coordination'],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'report-generation'],
    specialistAgents: ['engagement-lead', 'recon-specialist', 'app-testing-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'evidence-reporting-specialist', 'evidence-reporting-specialist'],
    recommendedImpact: 'intrusive',
    simulationGuidance: `You are simulating APT28 (Fancy Bear / Forest Blizzard / Sofacy) tradecraft.

ATTACK PATTERN — Aggressive Credential Harvesting & AD Exploitation:
1. RECON: Map organization structure, identify key personnel, harvest emails, discover public-facing infra.
2. INITIAL ACCESS: Spearphishing attachments with exploits or credential-harvesting links. Exploit VPN/email appliances.
3. EXECUTION: Macro-enabled documents, PowerShell, client-side exploitation.
4. PERSISTENCE: Registry run keys, Windows services, scheduled tasks.
5. PRIVILEGE ESCALATION: Local exploits, process injection, DLL hijacking.
6. CREDENTIAL ACCESS: LSASS dump, password spraying, credential file harvest, NTLM interception.
7. DISCOVERY: AD enumeration, domain trusts, network shares, connected systems.
8. LATERAL MOVEMENT: RDP, SMB, pass-the-hash, lateral tool transfer.
9. COLLECTION: Email archives, file shares, keylogging, screenshots.
10. C2: HTTPS with encrypted channels and proxy infrastructure.
11. EXFILTRATION: Over C2 channel or alternative protocols.

KEY TECHNIQUES: T1566.001, T1190, T1003.001, T1110.003, T1557, T1021.001, T1550.002
MITRE ATT&CK: https://attack.mitre.org/groups/G0007/

Follow each phase sequentially. Document findings and evidence at every step.`,
  },

  // ── Critical Infrastructure / Energy ──────────────────────────────────
  {
    id: 'apt-sim-volt-typhoon-infrastructure',
    label: 'Volt Typhoon Critical Infrastructure Simulation',
    description: 'Simulate Volt Typhoon living-off-the-land pre-positioning against critical infrastructure, manufacturing, and utilities.',
    aptGroupId: 'volt-typhoon',
    targetIndustry: 'critical-infrastructure',
    attackChainId: 'volt-typhoon',
    capabilityPacks: ['recon', 'network', 'exploitation', 'privilege-escalation', 'lateral-movement', 'evidence', 'reporting', 'coordination'],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'report-generation'],
    specialistAgents: ['engagement-lead', 'recon-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'evidence-reporting-specialist', 'evidence-reporting-specialist'],
    recommendedImpact: 'limited',
    simulationGuidance: `You are simulating Volt Typhoon tradecraft.

ATTACK PATTERN — Living-Off-The-Land Critical Infrastructure Pre-Positioning:
1. RECON: Identify internet-facing network appliances, VPN concentrators, edge devices. Map network perimeter.
2. INITIAL ACCESS: Exploit public-facing appliances (Fortinet, Ivanti, etc.) or abuse valid VPN credentials.
3. EXECUTION: Use ONLY built-in OS tools — PowerShell, cmd.exe, WMI. NO malware deployment.
4. PERSISTENCE: Create local accounts, reuse valid credentials. Minimize forensic artifacts.
5. DEFENSE EVASION: Living-off-the-land only. Use signed OS binaries, clear logs, disable security tools. NO file drops.
6. CREDENTIAL ACCESS: LSASS dump, credential stores, configuration files.
7. DISCOVERY: Extensive internal recon using ONLY native tools — systeminfo, ipconfig, net, nltest, tasklist.
8. LATERAL MOVEMENT: RDP, SSH, pass-the-hash with harvested credentials.
9. COLLECTION: Network diagrams, OT documentation, config files from file shares.
10. C2: Low-profile tunneling over standard ports with encryption.
11. EXFILTRATION: Stage and exfiltrate over C2.

CRITICAL: This simulation emphasizes stealth. Use ONLY built-in OS tools. Do NOT deploy custom tooling or malware.
KEY TECHNIQUES: T1190, T1059.001, T1059.003, T1047, T1218, T1202, T1003.001
MITRE ATT&CK: https://attack.mitre.org/groups/G1017/
CISA Advisory: https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a`,
  },

  {
    id: 'apt-sim-sandworm-ics',
    label: 'Sandworm ICS/OT Destructive Operations Simulation',
    description: 'Simulate Sandworm (APT44) destructive tradecraft against industrial control systems and energy infrastructure.',
    aptGroupId: 'sandworm',
    targetIndustry: 'critical-infrastructure',
    attackChainId: 'sandworm',
    capabilityPacks: ['recon', 'web', 'network', 'exploitation', 'privilege-escalation', 'lateral-movement', 'active-directory', 'evidence', 'reporting', 'coordination'],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'report-generation'],
    specialistAgents: ['engagement-lead', 'recon-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'evidence-reporting-specialist', 'evidence-reporting-specialist'],
    recommendedImpact: 'intrusive',
    simulationGuidance: `You are simulating Sandworm (APT44 / ELECTRUM / IRIDIUM) tradecraft.

ATTACK PATTERN — ICS/OT Destructive Operations:
1. RECON: Identify IT/OT boundary points, SCADA endpoints, engineering workstations.
2. INITIAL ACCESS (IT): Spearphishing, exploit public-facing apps, or supply-chain compromise.
3. EXECUTION: Custom malware, PowerShell, service execution.
4. PRIVILEGE ESCALATION: Escalate to domain admin via exploitation and credential abuse.
5. CREDENTIAL ACCESS: LSASS dump, NTDS.dit extraction, harvest OT-adjacent account creds.
6. DISCOVERY: Map AD, identify OT jump hosts, engineering workstations, SCADA endpoints.
7. LATERAL MOVEMENT (IT → OT): Cross IT/OT boundary using creds, RDP to jump hosts, SMB to eng workstations.
8. COLLECTION: OT network configs, PLC programming files, SCADA documentation.
9. IMPACT: Document what destructive operations WOULD achieve — wiper deployment, service disruption, data destruction. DO NOT actually execute destructive operations.

⚠️ IMPACT PHASE IS SIMULATION/DOCUMENTATION ONLY — describe attack paths and potential impact without executing.
KEY TECHNIQUES: T1190, T1059.001, T1003.001, T1003.003, T1021.001, T1550.002, T1485, T1489, T1490
MITRE ATT&CK: https://attack.mitre.org/groups/G0034/`,
  },

  // ── Financial Services ────────────────────────────────────────────────
  {
    id: 'apt-sim-apt38-financial',
    label: 'APT38 Financial Institution SWIFT Heist Simulation',
    description: 'Simulate APT38 (BeagleBoyz / Bluenoroff) approach to financial institution compromise targeting SWIFT and payment systems.',
    aptGroupId: 'apt38',
    targetIndustry: 'financial-services',
    attackChainId: 'apt38',
    capabilityPacks: ['recon', 'web', 'network', 'exploitation', 'privilege-escalation', 'lateral-movement', 'evidence', 'reporting', 'coordination'],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'report-generation'],
    specialistAgents: ['engagement-lead', 'recon-specialist', 'app-testing-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'evidence-reporting-specialist', 'evidence-reporting-specialist'],
    recommendedImpact: 'intrusive',
    simulationGuidance: `You are simulating APT38 (BeagleBoyz / Bluenoroff / Stardust Chollima) tradecraft.

ATTACK PATTERN — Financial Institution SWIFT Heist:
1. RECON: Identify bank personnel, SWIFT operators, internal network structure. Research SWIFT Alliance Lite2.
2. INITIAL ACCESS: Spearphishing bank employees or exploit public-facing banking web apps.
3. EXECUTION: Backdoors via macro docs, PowerShell, service execution.
4. PERSISTENCE: Registry run keys, scheduled tasks, Windows services.
5. CREDENTIAL ACCESS: LSASS dump, credential files, credential stores — especially for SWIFT terminal accounts.
6. DISCOVERY: Map network to locate SWIFT terminals, payment processing servers, core banking systems.
7. LATERAL MOVEMENT: Move to SWIFT operator workstations and payment infrastructure.
8. COLLECTION: Study SWIFT message formats, capture SWIFT terminal credentials, collect transaction records.
9. IMPACT (FINANCIAL): Document the attack path to SWIFT systems and what fraudulent transactions WOULD be possible. DO NOT execute real transactions.
10. IMPACT (DESTRUCTION): Document how evidence destruction via wiper malware would be conducted.

⚠️ FINANCIAL THEFT AND DESTRUCTION PHASES ARE DOCUMENTATION ONLY.
KEY TECHNIQUES: T1566.001, T1190, T1003.001, T1021.001, T1570, T1657, T1485
MITRE ATT&CK: https://attack.mitre.org/groups/G0082/`,
  },

  {
    id: 'apt-sim-scattered-spider-financial',
    label: 'Scattered Spider Identity-Centric Cloud Simulation',
    description: 'Simulate Scattered Spider (Octo Tempest) social engineering and identity-centric cloud compromise against financial, tech, and telecom targets.',
    aptGroupId: 'scattered-spider',
    targetIndustry: 'financial-services',
    attackChainId: 'scattered-spider',
    capabilityPacks: ['recon', 'web', 'cloud', 'exploitation', 'evidence', 'reporting', 'coordination'],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'attack-path-analysis', 'report-generation'],
    specialistAgents: ['engagement-lead', 'recon-specialist', 'app-testing-specialist', 'infra-specialist', 'infra-specialist', 'evidence-reporting-specialist', 'evidence-reporting-specialist'],
    recommendedImpact: 'intrusive',
    simulationGuidance: `You are simulating Scattered Spider (UNC3944 / Octo Tempest) tradecraft.

ATTACK PATTERN — Identity-Centric Cloud Compromise:
1. RECON: Identify helpdesk procedures, employee social media, MFA implementation, identity provider config.
2. INITIAL ACCESS: Social-engineer helpdesk for password reset, SIM swap for MFA bypass, SMS phishing, abuse MSP portals.
3. CREDENTIAL ACCESS: Steal OAuth/SAML tokens, MFA fatigue (push bombing), session cookie theft, auth interception.
4. PERSISTENCE: Register new cloud creds, add MFA devices, create cloud admin accounts.
5. DEFENSE EVASION: Stolen tokens to bypass MFA, disable security alerting, impersonate legitimate admins.
6. DISCOVERY: Enumerate cloud infra, high-value data stores, federated identity configurations.
7. COLLECTION: Access cloud storage, SaaS platforms, cloud mailboxes, information repositories.
8. EXFILTRATION: To attacker-controlled cloud storage or between cloud accounts.
9. IMPACT: Deploy ransomware for extortion, remove account access. (SIMULATION ONLY)

KEY TECHNIQUES: T1566.003, T1078.004, T1528, T1621, T1557, T1136.003, T1530, T1537, T1486
MITRE ATT&CK: https://attack.mitre.org/groups/G1015/`,
  },

  // ── Telecom ───────────────────────────────────────────────────────────
  {
    id: 'apt-sim-salt-typhoon-telecom',
    label: 'Salt Typhoon Telecom Espionage Simulation',
    description: 'Simulate Salt Typhoon approach to compromising telecom infrastructure for communications intelligence collection.',
    aptGroupId: 'salt-typhoon',
    targetIndustry: 'telecommunications',
    attackChainId: 'salt-typhoon',
    capabilityPacks: ['recon', 'network', 'exploitation', 'privilege-escalation', 'lateral-movement', 'evidence', 'reporting', 'coordination'],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'report-generation'],
    specialistAgents: ['engagement-lead', 'recon-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'evidence-reporting-specialist', 'evidence-reporting-specialist'],
    recommendedImpact: 'intrusive',
    simulationGuidance: `You are simulating Salt Typhoon tradecraft.

ATTACK PATTERN — Telecom Infrastructure Espionage:
1. RECON: Identify telecom infrastructure, network management systems, internet-facing network appliances.
2. INITIAL ACCESS: Exploit network appliances and telecom management interfaces. Abuse external remote services.
3. EXECUTION: Commands through compromised appliance CLIs and management interfaces.
4. PERSISTENCE: Web shells on management interfaces, modify network device configs.
5. CREDENTIAL ACCESS: Extract credentials from device configs and management databases.
6. DISCOVERY: Map core network — CDR databases, lawful-intercept systems, subscriber management, interconnections.
7. LATERAL MOVEMENT: Pivot from management plane to data plane and interconnection systems.
8. COLLECTION: Harvest call detail records, intercept communications data, collect subscriber info.
9. EXFILTRATION: Over encrypted channels.

KEY TECHNIQUES: T1190, T1133, T1505.003, T1003.001, T1046, T1021.004, T1119
MITRE ATT&CK: https://attack.mitre.org/groups/G1045/
CISA Guidance: https://www.cisa.gov/news-events/alerts/2024/12/04/cisa-and-partners-release-joint-guide-securing-communications-infrastructure`,
  },

  // ── Technology / Supply Chain ──────────────────────────────────────────
  {
    id: 'apt-sim-silk-typhoon-technology',
    label: 'Silk Typhoon Supply Chain & Cloud Simulation',
    description: 'Simulate Silk Typhoon (HAFNIUM) mass exploitation and IT supply-chain compromise targeting technology, healthcare, and education.',
    aptGroupId: 'silk-typhoon',
    targetIndustry: 'technology',
    attackChainId: 'silk-typhoon',
    capabilityPacks: ['recon', 'web', 'cloud', 'exploitation', 'privilege-escalation', 'lateral-movement', 'evidence', 'reporting', 'coordination'],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'report-generation'],
    specialistAgents: ['engagement-lead', 'recon-specialist', 'app-testing-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'evidence-reporting-specialist', 'evidence-reporting-specialist'],
    recommendedImpact: 'intrusive',
    simulationGuidance: `You are simulating Silk Typhoon (HAFNIUM) tradecraft.

ATTACK PATTERN — IT Supply Chain & Cloud Exploitation:
1. RECON: Identify internet-facing Exchange servers, remote management tools, cloud infra. Scan for vulnerable versions.
2. INITIAL ACCESS: Exploit zero-days in public-facing apps. Chain vulnerabilities for auth bypass + RCE. Alternatively, compromise IT supply-chain providers.
3. EXECUTION: Commands through deployed web shells.
4. PERSISTENCE: Web shells on compromised servers, cloud accounts, additional cloud credentials.
5. CREDENTIAL ACCESS: Dump server creds, steal application tokens, extract cloud vault secrets.
6. DISCOVERY: Enumerate cloud tenants, connected services, high-value data repos.
7. LATERAL MOVEMENT: Pivot from on-prem to cloud using stolen tokens and credentials.
8. COLLECTION: Email mailboxes, cloud storage documents, information repositories.
9. EXFILTRATION: Over C2 or to attacker-controlled cloud storage.

KEY TECHNIQUES: T1190, T1195.002, T1505.003, T1528, T1078.004, T1114.002, T1530
MITRE ATT&CK: https://attack.mitre.org/groups/G0125/`,
  },

  // ── Healthcare ────────────────────────────────────────────────────────
  {
    id: 'apt-sim-lazarus-healthcare',
    label: 'Lazarus Healthcare Ransomware & Espionage Simulation',
    description: 'Simulate Lazarus Group approach to healthcare: combining espionage (vaccine/drug research theft) with ransomware revenue. Based on CISA Maui ransomware advisories.',
    aptGroupId: 'lazarus',
    targetIndustry: 'healthcare',
    attackChainId: 'lazarus',
    capabilityPacks: ['recon', 'web', 'network', 'exploitation', 'privilege-escalation', 'lateral-movement', 'evidence', 'reporting', 'coordination'],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'report-generation'],
    specialistAgents: ['engagement-lead', 'recon-specialist', 'app-testing-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'evidence-reporting-specialist', 'evidence-reporting-specialist'],
    recommendedImpact: 'intrusive',
    simulationGuidance: `You are simulating Lazarus Group tradecraft against healthcare targets.

ATTACK PATTERN — Healthcare Ransomware & Espionage:
1. RECON: Identify healthcare IT infra, research staff, internet-facing systems (VPN, web portals).
2. INITIAL ACCESS: Exploit healthcare web apps, spearphish research staff, or abuse supply-chain trust.
3. EXECUTION: Custom malware via multiple scripting interpreters and exploits.
4. PERSISTENCE: Registry keys, scheduled tasks, services, DLL hijacking.
5. PRIVILEGE ESCALATION: Exploitation, process injection, token manipulation.
6. CREDENTIAL ACCESS: LSASS dump, credential files and stores.
7. DISCOVERY: Locate EHR systems, research databases, clinical trial file shares.
8. LATERAL MOVEMENT: Move to research servers, EHR systems, and clinical data file shares.
9. COLLECTION: Clinical trial data, drug research, patient records, financial data.
10. EXFILTRATION: Research data over encrypted channels.
11. IMPACT: Document ransomware deployment path and potential impact. (SIMULATION ONLY)

KEY TECHNIQUES: T1190, T1566.001, T1068, T1003.001, T1574.001, T1021.001, T1486
MITRE ATT&CK: https://attack.mitre.org/groups/G0032/
CISA Advisory: https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-187a`,
  },

  // ── Manufacturing ─────────────────────────────────────────────────────
  {
    id: 'apt-sim-apt41-manufacturing',
    label: 'APT41 Manufacturing IP Theft Simulation',
    description: 'Simulate APT41 (Brass Typhoon / Wicked Panda) dual-mission approach to manufacturing environments — supply-chain compromise and trade secret theft.',
    aptGroupId: 'apt41',
    targetIndustry: 'manufacturing',
    attackChainId: 'apt41',
    capabilityPacks: ['recon', 'web', 'network', 'exploitation', 'privilege-escalation', 'lateral-movement', 'active-directory', 'database', 'evidence', 'reporting', 'coordination'],
    defaultSkills: ['engagement-setup', 'scope-guard', 'recon-plan', 'target-fingerprinting', 'evidence-capture', 'exploit-validation', 'post-exploitation-plan', 'attack-path-analysis', 'report-generation'],
    specialistAgents: ['engagement-lead', 'recon-specialist', 'app-testing-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'infra-specialist', 'evidence-reporting-specialist', 'evidence-reporting-specialist'],
    recommendedImpact: 'intrusive',
    simulationGuidance: `You are simulating APT41 (Brass Typhoon / Wicked Panda / Winnti) tradecraft.

ATTACK PATTERN — Manufacturing IP Theft & Espionage:
1. RECON: Identify manufacturing infra, software supply chain, engineering portals, key technical personnel.
2. INITIAL ACCESS: Supply-chain compromise, exploit public-facing apps, leverage vendor trust, spearphish.
3. EXECUTION: PowerShell, WMI, scheduled tasks, custom tooling.
4. PERSISTENCE: Web shells, services, registry persistence, account manipulation.
5. PRIVILEGE ESCALATION: Local exploits, process injection, token manipulation.
6. CREDENTIAL ACCESS: LSASS dump, NTDS.dit extraction, Kerberoasting, credential files.
7. DISCOVERY: Map AD, identify engineering file shares, CAD/CAM servers, manufacturing databases.
8. LATERAL MOVEMENT: Pivot to engineering workstations and file servers via pass-the-hash.
9. COLLECTION: Engineering designs, manufacturing processes, trade secrets, corporate strategy.
10. EXFILTRATION: Over encrypted channels or to cloud storage.

KEY TECHNIQUES: T1195.002, T1190, T1059.001, T1003.001, T1558.003, T1021.002, T1550.002, T1213
MITRE ATT&CK: https://attack.mitre.org/groups/G0096/`,
  },
]

export function findAptSimulationWorkflow(id: string): AptSimulationWorkflow | undefined {
  return APT_SIMULATION_WORKFLOWS.find(w => w.id === id)
}

export function findWorkflowsByIndustry(sector: AptSimulationWorkflow['targetIndustry']): AptSimulationWorkflow[] {
  return APT_SIMULATION_WORKFLOWS.filter(w => w.targetIndustry === sector)
}

export function findWorkflowsByAptGroup(aptGroupId: string): AptSimulationWorkflow[] {
  return APT_SIMULATION_WORKFLOWS.filter(w => w.aptGroupId === aptGroupId)
}

export function listAvailableSimulations(): Array<{ id: string; label: string; aptGroupId: string; targetIndustry: string }> {
  return APT_SIMULATION_WORKFLOWS.map(w => ({
    id: w.id,
    label: w.label,
    aptGroupId: w.aptGroupId,
    targetIndustry: w.targetIndustry,
  }))
}
