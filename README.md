<div align="center">

# Net-Runner 🥷

### Agentic Red-Team Assessment Framework

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/License-Educational%20Use-red?style=for-the-badge)](#license)

**12 Specialist Agents &middot; 141 Red-Team Tools &middot; 17 Capability Packs &middot; 10 Pentest Skills &middot; 6 Workflows**

*Speak naturally. Net-Runner handles the rest.*

**English** · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **Warning**
> Use **only** on targets you are explicitly authorized to test. Net-Runner is designed for legal, authorized penetration testing and educational purposes.

## 🔍 What Is Net-Runner?

Net-Runner is a multi-agent red-team framework that turns natural-language instructions into structured security assessments. You talk to the **Engagement Lead** — it delegates reconnaissance, exploitation, reporting, and everything in between to purpose-built specialist agents.

<details>
<summary><strong>Why Net-Runner?</strong></summary>

- **Natural language** — no memorizing flags or syntax; describe what you want tested
- **Multi-agent orchestration** — parallel specialist agents, each with deep tool knowledge
- **Guardrails built in** — scope-guard checkpoints prevent out-of-bounds actions
- **Evidence-first** — every action is logged, every finding is traceable
- **Memory that persists** — RAG-backed retrieval across sessions, per-agent and per-project
- **141 tools wired** — from `nmap` to `BloodHound` to `Ghidra`, ready to execute

</details>

---

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Build the project
bun run build

# Launch
node dist/cli.mjs
```

Then type a natural-language instruction:

```
Assess https://target.example — start with recon, then test for web vulnerabilities.
```

Net-Runner auto-detects your intent, bootstraps a safe engagement, and starts working.

---

## 🤖 Connect an LLM Provider

Net-Runner works with multiple LLM providers. Set the right environment variables before launching.

### Using `ANTHROPIC_API_KEY`

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
node dist/cli.mjs
```

If your provider uses the `ANTHROPIC_API_KEY` path, set the key and launch.

### OpenAI

```bash
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o"          # optional, defaults to gpt-4o
node dist/cli.mjs
```

### Google Gemini

```bash
export GEMINI_API_KEY="AIza..."
export GEMINI_MODEL="gemini-2.5-pro"   # optional, defaults to gemini-2.0-flash
node dist/cli.mjs
```

### Ollama (Local / Self-Hosted)

Run any model locally with zero API costs:

```bash
# Start Ollama first
ollama serve

# Pull a model
ollama pull llama3.1:8b

# Launch Net-Runner pointing to Ollama
export OPENAI_BASE_URL="http://localhost:11434/v1"
export OPENAI_MODEL="llama3.1:8b"
node dist/cli.mjs
```

### Any OpenAI-Compatible API

Works with LM Studio, vLLM, Together AI, Groq, Fireworks, or any endpoint that speaks the OpenAI chat completions format:

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_BASE_URL="https://your-provider.com/v1"
export OPENAI_MODEL="your-model-name"
node dist/cli.mjs
```

<details>
<summary><strong>💡 Provider Tips</strong></summary>

- **Best results** come from tool-capable frontier models that are strong at multi-step reasoning and tool orchestration
- **GPT-4o** works well for most workflows
- **Gemini 2.5 Pro** is a strong alternative with large context windows
- **Local models** (Ollama) work for basic recon and evidence tasks but may struggle with complex multi-agent orchestration
- You can switch providers between sessions — memory persists regardless of which model you use
- API keys are never stored in the engagement envelope; use shell environment or `.env` files

</details>

---

## ⚙️ How It Works

```
You ──► Engagement Lead ──► Specialist Agents ──► Tools (Bash/MCP/Skills)
                │                    │                      │
                ▼                    ▼                      ▼
         Guardrails            Evidence Chain          Tool Output
                │                    │                      │
                └────────────────────┴──────────────────────┘
                                     │
                              .netrunner/
                     (state, evidence, memory, reports)
```

| Step | What Happens |
|------|-------------|
| **1. Detect** | Parse assessment intent, identify targets |
| **2. Bootstrap** | Create `.netrunner/` envelope with operator-directed defaults (`confirmed` auth state, inferred impact boundary) |
| **3. Inject** | Attach scope, authorization, and restrictions to every model turn |
| **4. Delegate** | Route work to specialist agents based on workflow and findings |
| **5. Guard** | Scope-guard checkpoint before any high-impact action |
| **6. Record** | Log evidence, execution state, and findings in real time |
| **7. Remember** | Persist knowledge per-agent and per-project for future sessions |
| **8. Report** | Generate structured, evidence-backed assessment output |

### Safe Defaults

Every auto-initialized engagement starts operator-directed:

| Setting | Default |
|---------|---------|
| Authorization | `confirmed` |
| Max Impact | inferred from the prompt (`limited` by default) |

Adjust impact in plain language when needed:

```
Escalate to intrusive validation and try controlled exploitation.
```

---

## 🕵️ Specialist Agents

<table>
<tr>
<td width="50%">

| Agent | Focus |
|:------|:------|
| **Engagement Lead** | Orchestration, workflow routing, skill coordination |
| **Recon Specialist** | Network discovery, DNS, OSINT, subdomain enumeration |
| **Web Testing** | XSS, SQLi, SSRF, auth bypass, CMS scanning |
| **API Testing** | GraphQL, JWT, IDOR, mass assignment, schema analysis |
| **Network Testing** | SMB, SSH, FTP, service exploit, traffic analysis |
| **Exploit Specialist** | Payload gen, PoC execution, controlled exploitation |

</td>
<td width="50%">

| Agent | Focus |
|:------|:------|
| **Privilege Escalation** | SUID, kernel exploits, token abuse, container escape |
| **Lateral Movement** | Credential reuse, pivoting, port forwarding |
| **AD Specialist** | LDAP/Kerberos, trust abuse, ADCS, BloodHound |
| **Retest Specialist** | Reproduce findings, validate remediation |
| **Evidence Specialist** | Artifact curation, chain of custody, forensics |
| **Reporting Specialist** | Severity framing, exec summary, remediation |

</td>
</tr>
</table>

All 12 agents share evidence through the engagement envelope, communicate via the Agent tool, and maintain persistent memory across sessions.

---

## 🧠 Skills

Ten pentest-specific skills structure execution flow — agents invoke them automatically based on workflow phase.

| Skill | Phase | Purpose |
|:------|:------|:--------|
| `engagement-setup` | Start | Collect scope, targets, authorization, constraints |
| `scope-guard` | Pre-action | Verify authorization boundaries before risky actions |
| `recon-plan` | Discovery | Build phased recon and enumeration plan |
| `target-fingerprinting` | Discovery | Auto-detect OS, services, frameworks, tech stack for specialist routing |
| `vuln-assessment` | Analysis | Systematic vulnerability identification and classification |
| `exploit-validation` | Exploitation | Scope-guard checkpoint, rollback plan, controlled PoC |
| `post-exploitation-plan` | Post-access | Map escalation paths and lateral movement options |
| `attack-path-analysis` | Synthesis | Map multi-step attack chains and dependencies |
| `evidence-capture` | Continuous | Capture artifacts and findings at every phase |
| `report-generation` | Final | Transform evidence into assessment report |

---

## 🏷️ Finding Classification

Every finding is automatically tagged with industry-standard classification metadata:

| Standard | What Gets Tagged | Example |
|:---------|:-----------------|:--------|
| **MITRE ATT&CK** | Technique IDs + tactic context | T1190 (Exploit Public-Facing Application) |
| **CVSS 3.1** | Vector string + numeric base score | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H → 9.8 Critical |
| **CWE** | Common Weakness Enumeration IDs | CWE-89 (SQL Injection) |
| **OWASP Top 10** | 2021 category codes | A03:2021-Injection |
| **Compliance** | Framework control references | PCI-DSS 6.5.1, NIST 800-53 SI-10, SOC2 CC6.1 |

Classification data flows through the evidence ledger into the final report — every finding includes severity, CVSS score, CWE, OWASP category, MITRE technique, and applicable compliance controls.

---

## 📋 Workflows

Choose a workflow that matches your engagement. Each bundles the right capability packs, specialists, and default skills.

| Workflow | Target Environment | Key Packs | Specialists |
|:---------|:-------------------|:----------|:------------|
| `web-app-testing` | Web applications | recon, web, exploitation | Web, API, Exploit, Retest, Evidence, Reporting |
| `api-testing` | REST / GraphQL / SOAP | recon, api, exploitation | API, Exploit, Retest, Evidence, Reporting |
| `lab-target-testing` | HTB / Labs / Internal | recon, network, exploit, AD, privesc | Full offensive pipeline (10 specialists) |
| `ctf-mode` | CTF challenges | recon, web, binary, exploit, privesc | All offensive specialists, no reporting |
| `ad-testing` | Active Directory | AD, network, database, privesc | AD, Network, PrivEsc, Lateral Movement |
| `wifi-testing` | Wireless 802.11 | wifi, network, exploitation | Network, Exploit, Evidence, Reporting |

---

## 🛠️ Tool Coverage

<div align="center">

**141 tools across 17 capability packs**

</div>

<details>
<summary><strong>Recon & OSINT</strong> — 22 tools</summary>

`nmap` · `masscan` · `rustscan` · `amass` · `subfinder` · `sublist3r` · `fierce` · `dnsenum` · `theHarvester` · `whois` · `httpx` · `katana` · `whatweb` · `bbot` · `recon-ng` · `spiderfoot` · `sherlock` · `maltego` · `gau` · `waybackurls` · `parsero` · `autorecon`

</details>

<details>
<summary><strong>Web & API Testing</strong> — 28 tools</summary>

`nuclei` · `nikto` · `gobuster` · `ffuf` · `feroxbuster` · `dirsearch` · `dirb` · `wpscan` · `joomscan` · `dalfox` · `xsser` · `jaeles` · `dotdotpwn` · `wafw00f` · `wfuzz` · `hakrawler` · `burpsuite` · `zap` · `sqlmap` · `commix` · `graphql-scanner` · `jwt-tool` · `arjun` · `paramspider` · `x8` · `qsreplace` · `uro` · `api-schema-analyzer`

</details>

<details>
<summary><strong>Exploitation & Brute Force</strong> — 12 tools</summary>

`msfconsole` · `msfvenom` · `searchsploit` · `hydra` · `medusa` · `patator` · `hashcat` · `john` · `ophcrack` · `hashid` · `responder` · `pwntools`

</details>

<details>
<summary><strong>Network & Lateral Movement</strong> — 14 tools</summary>

`netexec` · `crackmapexec` · `evil-winrm` · `smbmap` · `enum4linux` · `enum4linux-ng` · `rpcclient` · `nbtscan` · `arp-scan` · `tcpdump` · `tshark` · `wireshark` · `testssl` · `sslyze`

</details>

<details>
<summary><strong>Active Directory</strong> — 9 tools</summary>

`bloodhound` · `impacket-ad-enum` · `impacket-remote-exec` · `ldapdomaindump` · `certipy` · `kerbrute` · `rubeus` · `mimikatz` · `adidnsdump`

</details>

<details>
<summary><strong>WiFi</strong> — 13 tools</summary>

`aircrack-ng` · `airmon-ng` · `airodump-ng` · `aireplay-ng` · `airbase-ng` · `airdecap-ng` · `bettercap` · `wifite` · `eaphammer` · `hcxdumptool` · `hcxpcapngtool` · `mdk4` · `kismet`

</details>

<details>
<summary><strong>Binary Analysis & Reverse Engineering</strong> — 13 tools</summary>

`ghidra` · `radare2` · `gdb` · `checksec` · `binwalk` · `ropgadget` · `ropper` · `one-gadget` · `angr` · `objdump` · `libc-database` · `pwninit` · `stegsolve`

</details>

<details>
<summary><strong>Cloud & Container Security</strong> — 12 tools</summary>

`trivy` · `prowler` · `scout-suite` · `pacu` · `cloudmapper` · `checkov` · `terrascan` · `kube-bench` · `kube-hunter` · `docker-bench` · `clair` · `falco`

</details>

<details>
<summary><strong>Forensics & Evidence</strong> — 13 tools</summary>

`volatility3` · `foremost` · `photorec` · `scalpel` · `bulk-extractor` · `sleuthkit` · `autopsy` · `testdisk` · `exiftool` · `steghide` · `zsteg` · `outguess` · `hashpump`

</details>

<details>
<summary><strong>C2 Frameworks</strong> — 2 tools</summary>

`sliver-c2` · `mythic-c2`

</details>

<details>
<summary><strong>Database</strong> — 3 tools</summary>

`mysql` · `mssqlclient` · `sqlite3`

</details>

> Run `/engagement capabilities [workflow]` to check what's available on your host before deep execution.

---

## 📁 Evidence & Memory

Net-Runner maintains full assessment continuity across sessions.

### Project Structure

```
.netrunner/
├── engagement.json          # Scope, authorization, targets, workflow
├── run-state.json           # Execution steps, pending reviews
├── evidence/
│   └── ledger.jsonl         # Timestamped evidence chain
├── findings/                # Structured finding directories
├── reports/                 # Generated assessment reports
├── secrets.env              # Engagement-scoped credentials
└── memory/
    └── agents/              # Per-agent persistent memory
        ├── recon-specialist/
        ├── exploit-specialist/
        └── ...
```

### Memory Architecture

| Scope | Location | Purpose |
|:------|:---------|:--------|
| **Per-agent** | `.netrunner/memory/agents/<type>/` | Tool knowledge, target-specific findings |
| **Per-project** | `~/.netrunner/projects/<repo>/memory/` | Cross-session auto memory |
| **RAG retrieval** | Automatic | Pulls relevant context from both scopes |
| **Agent-scoped** | `@agent-...` mentions | Narrows retrieval to specific agent memory |

### Environment Configuration

| Variable | Effect |
|:---------|:-------|
| `NETRUNNER_DISABLE_RELEVANT_MEMORY_PREFETCH=1` | Disable relevant-memory prefetch and keep normal memory-file injection active |
| `NETRUNNER_ENABLE_RELEVANT_MEMORY_PREFETCH=1` | Force relevant-memory prefetch on where the runtime supports it |
| `NETRUNNER_DISABLE_SESSION_MEMORY=1` | Disable session memory |
| `NETRUNNER_ENABLE_SESSION_MEMORY=1` | Force session memory on |
| `NETRUNNER_AUTO_BACKGROUND_TASKS=1` | Auto-background delegated agents |
| `NETRUNNER_COORDINATOR_MODE=1` | Enable coordinator mode (experimental) |
| `NETRUNNER_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1` | Blank slate for SDK usage |

---

## 🎮 Operator Commands

Optional manual controls — most work happens through natural language.

| Command | Purpose |
|:--------|:--------|
| `/engagement init [workflow] [target]` | Initialize engagement manually |
| `/engagement status` | View current engagement state |
| `/engagement capabilities [workflow]` | Check tool readiness on this host |
| `/engagement alignment` | Verify agent-tool alignment |
| `/engagement guard <action>` | Run scope-guard on a planned action |
| `/engagement review` | View pending review items |
| `/engagement approve <id>` | Approve a pending review |
| `/engagement reject <id>` | Reject a pending review |
| `/evidence status\|note\|finding\|artifact\|close` | Manage evidence chain |
| `/report [filename]` | Generate assessment report |

---

## 🏗️ Architecture

```
src/
├── security/
│   ├── capabilities.ts         # 38 core + 141 imported capability definitions
│   ├── pentestToolCatalog.ts   # 141 red-team tool entries
│   ├── workflows.ts            # 6 security workflows + 17 capability packs
│   ├── agentTypes.ts           # 12 agent type definitions
│   ├── agentDefinitions.ts     # Agent-to-workflow mappings
│   ├── skillDefinitions.ts     # 10 pentest skill definitions
│   ├── findingClassification.ts # MITRE ATT&CK, CVSS, CWE, OWASP, compliance mapping
│   ├── engagement.ts           # Engagement lifecycle management
│   ├── guardrails.ts           # Scope-guard and impact assessment
│   ├── evidence.ts             # Evidence chain and artifact management
│   └── reporting.ts            # Report generation pipeline
├── tools/AgentTool/
│   ├── built-in/               # 12 specialist agent prompt files
│   ├── builtInAgents.ts        # Agent registration and memory injection
│   ├── agentMemory.ts          # Persistent agent memory system
│   └── agentMemorySnapshot.ts  # Memory snapshot and restoration
└── coordinator/
    └── coordinatorMode.ts      # Multi-agent coordinator orchestration
```

---

## ✅ Validation

```bash
# Full red-team pipeline
bun run pipeline:redteam

# Security-specific tests
npm run test:security-slice

# Alignment verification
bun run validate:redteam-alignment
bun run validate:redteam-agent-tools

# Tool command smoke test
bun run smoke:redteam-commands

# Build verification
bun run build
```

---

## 📚 Documentation

| Document | Description |
|:---------|:------------|
| [`docs/workflows/overview.md`](docs/workflows/overview.md) | Workflow architecture and selection guide |
| [`docs/capabilities/skills-first-architecture.md`](docs/capabilities/skills-first-architecture.md) | Skills-first execution model |
| [`docs/capabilities/service-surfaces.md`](docs/capabilities/service-surfaces.md) | Service surface coverage |
| [`src/security/README.md`](src/security/README.md) | Security module internals |
| [`src/tools/AgentTool/built-in/README.md`](src/tools/AgentTool/built-in/README.md) | Agent design and prompt architecture |

---

## 📜 License

This repository is for **educational use** and **authorized security testing** only.

You are solely responsible for ensuring compliance with all applicable laws, regulations, and authorization requirements before using Net-Runner against any target.

---

<div align="center">

*Built for operators who think in objectives, not flags.*

</div>
