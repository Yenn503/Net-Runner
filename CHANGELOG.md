# Changelog

All notable changes to Net-Runner are documented in this file.

## [1.0.0] - 2026-04-04

### Added

- **APT Simulation Subsystem** — Complete threat actor emulation framework
  - 40 APT group profiles with MITRE ATT&CK technique mappings
  - 10 detailed multi-phase attack chains
  - 13 industry threat profiles (finance, government, healthcare, telecom, energy, etc.)
  - 172 MITRE ATT&CK technique definitions
  - 10 ready-to-use simulation workflows
  - Natural language detection for APT simulation requests
  - Skills integration: `/apt-simulation APT29 against government`

- **Specialist Agent System** — 12 domain-focused security agents
  - Engagement Lead — workflow orchestration and scope validation
  - Recon Specialist — attack surface discovery and enumeration
  - Web Testing Specialist — HTTP and web application testing
  - API Testing Specialist — endpoint discovery and API security
  - Network Testing Specialist — service enumeration and protocol testing
  - Exploit Specialist — proof-of-impact validation
  - Privilege Escalation Specialist — post-access boundary testing
  - Lateral Movement Specialist — pivot and credential path validation
  - AD Specialist — Active Directory and Kerberos testing
  - Retest Specialist — finding validation and regression checks
  - Evidence Specialist — artifact collection and documentation
  - Reporting Specialist — assessment report generation

- **Security Workflow Engine** — 7 pre-defined assessment workflows
  - Web App Testing — route mapping, auth testing, vulnerability validation
  - API Testing — endpoint discovery, schema checks, state testing
  - Mobile App Testing — Android analysis with adb, apktool, frida, objection
  - Lab Target Testing — host enumeration, privilege escalation, lateral movement
  - CTF Mode — challenge-focused rapid iteration
  - AD Testing — Active Directory, Kerberos, trust paths, AD CS
  - WiFi Testing — wireless assessments, handshake capture, rogue AP testing

- **Skills-First Execution** — 11 reusable pentest playbooks
  - engagement-setup — scope collection and target definition
  - scope-guard — boundary enforcement
  - recon-plan — discovery and enumeration planning
  - target-fingerprinting — service and technology identification
  - evidence-capture — finding documentation
  - vuln-assessment — vulnerability analysis
  - exploit-validation — proof-of-concept execution
  - post-exploitation-plan — lateral movement and persistence planning
  - report-generation — structured assessment reports
  - attack-path-analysis — kill chain mapping
  - apt-simulation — threat actor emulation

- **Tool Catalog** — 153 integrated red-team tools
  - Recon: 22 tools (nmap, masscan, ffuf, gobuster, amass, etc.)
  - Web: 28 tools (sqlmap, burp, zap, wpscan, nuclei, etc.)
  - API: 3 tools (postman, openapi-generator, etc.)
  - Mobile: 8 tools (adb, apktool, jadx, frida, objection, mobsf, drozer, apkleaks)
  - Network: 13 tools (wireshark, tcpdump, ncat,Responder, etc.)
  - Exploitation: 11 tools (metasploit, covenant, etc.)
  - Active Directory: 12 tools (bloodhound, netexec, mimikatz, etc.)
  - Cloud: 13 tools (cloud_enum, GHunt, holehe, pacu, etc.)
  - Binary/Reverse Engineering: 22 tools (ghidra, radare2, binwalk, etc.)
  - WiFi: 13 tools (aircrack-ng, wifite, bettercap, etc.)
  - Evidence/Forensics: 5 tools (volatility, autopsy, etc.)
  - Coordination/C2: 2 tools

- **Capability Packs** — 18 functional groupings
  - recon, web, api, exploitation, privilege-escalation, lateral-movement
  - exfiltration, cloud, binary, network, reporting
  - lab-control, evidence, coordination, active-directory, wifi, database

- **Guardrail System** — Safety and scope enforcement
  - Impact level validation (read-only → intrusive → destructive)
  - Scope boundary checking (targets, actions, time windows)
  - Engagement manifest with authorization tracking
  - Automatic out-of-scope detection and blocking

- **Evidence-First Architecture**
  - `.netrunner/` project folder structure
  - Engagement state persistence
  - Evidence ledger with append-only findings
  - Agent memory system (per-agent private memory files)
  - Report generation pipeline

- **Auto-Engagement Bootstrap**
  - Natural language target detection
  - Workflow inference from assessment prompts
  - Plain English impact escalation
  - Multi-session context continuity

- **Multi-Language Support**
  - README translations: Spanish, French, Chinese, Arabic, Portuguese, Russian, Japanese, Korean, Hindi, German
  - Organized in `i18n/` folder

- **Documentation**
  - Complete APT Simulation reference
  - Industry threat mapping
  - Attack chain phase-by-phase guides
  - Tool catalog documentation
  - Skills-first architecture guide
  - Research alignment and provenance notes

### Changed

- **README Structure** — Collapsible sections for cleaner navigation
  - Getting Started
  - Execution Flow
  - Workflows
  - Tool Catalog

- **Project Organization**
  - Localized READMEs moved to `i18n/`
  - Clean root directory structure
  - Removed PDF-related gitignore entries

### Technical

- **Framework**: TypeScript with Bun runtime
- **Architecture**: Agentic orchestration with specialist delegation
- **Memory**: Persistent per-agent and per-engagement memory
- **Integration**: OpenAI, Anthropic, Gemini, Ollama compatible
- **Testing**: 49 security-focused test cases
- **Upstream**: Built on OpenClaude runtime with Net-Runner additions

---

## Release Notes

This is the first public release of Net-Runner, a final-year university research project focused on agentic security testing workflows. The framework provides a complete red-team runtime with workflow control, evidence capture, memory persistence, and specialist agent orchestration.

### What Makes This Different

Unlike simple LLM tool wrappers, Net-Runner implements:

1. **Structured Assessment Workflows** — Predefined but adaptable testing sequences
2. **Specialist Agent Delegation** — Domain experts for recon, web, AD, network, etc.
3. **Evidence-First Design** — Every finding automatically captured and organized
4. **Guardrail Enforcement** — Scope and impact validation before every action
5. **APT Simulation Mode** — Real threat actor emulation with MITRE ATT&CK mapping
6. **Multi-Session Memory** — Agents remember previous findings across sessions

### Security Notice

Net-Runner is designed for authorized security testing, lab environments, and educational use only. All capabilities require explicit authorization to deploy against target systems.

---

*Released: April 4, 2026*
