<!--
SEO Keywords: AI security testing framework, autonomous penetration testing, LLM red team tool, 
agentic security assessment, AI-powered penetration testing, autonomous security testing,
LLM security framework, AI penetration testing tool, security assessment automation,
red team automation, AI security assessment, LLM security testing
-->

<div align="center">


<img src=".github/assets/Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/License-Educational%20Use-red?style=for-the-badge)](#license)

**12 Specialist Agents · 153 Red-Team Tools · 18 Capability Packs · 16 Pentest Skills · 7 Workflows · 10 APT Simulations**

*Red-team runtime with workflow control, evidence, memory, and specialist agents.*

**English** · [Español](i18n/README.es.md) · [Français](i18n/README.fr.md) · [中文](i18n/README.zh.md) · [العربية](i18n/README.ar.md) · [Português](i18n/README.pt.md) · [Русский](i18n/README.ru.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [हिन्दी](i18n/README.hi.md) · [Deutsch](i18n/README.de.md)

---

</div>

Net-Runner is a **final-year university project** and research prototype — an **AI security testing framework** for **autonomous penetration testing**. An LLM runs the full security assessment — picking workflows, launching specialist agents, running 153+ red-team tools, enforcing guardrails, and logging evidence. Built on the public [OpenClaude](https://github.com/Gitlawb/openclaude) runtime.

The architecture follows the [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) pattern from Anthropic — instead of exposing 153 tools as individual MCP definitions (which would consume ~150K+ tokens of context), Net-Runner presents a minimal MCP surface (~10 core tools) and delegates all tool execution to code. Skills, agents, and workflows are discovered through the filesystem on demand. Any MCP-compatible LLM — GitHub Copilot, Claude Desktop, Cursor — can connect and drive the full harness without configuring API keys in Net-Runner itself. The result is a **skills-first, code-execution-first** framework where MCP calls are essential-only and the real work happens through shell execution, specialist agents, and reusable skill bundles.

---

## 🔍 What It Does

Give Net-Runner a target in plain language. It sets up a `.netrunner/` project folder, picks the right workflow, and runs the full assessment — capturing evidence as it goes.

- **Persistent memory** — the LLM and each specialist agent remember what they found in previous sessions, so multi-day assessments stay coherent
- **Evidence-first workflow** — every finding, artifact, and report is saved to the `.netrunner/` project folder automatically
- **Guardrail enforcement** — every action is checked against your declared scope and impact level before it runs
- **Specialist delegation** — 12 domain agents for recon, web, API, network, AD, exploit, evidence, and reporting
- **Auto-engagement setup** — type a target and goal in plain English; Net-Runner detects the intent and starts the assessment

---

## 🤖 Specialist Agents

Net-Runner deploys 12 domain-focused agents when specific expertise is needed. Each agent has its own memory and tool patterns.

| Agent | Role | Coverage |
|-------|------|----------|
| **Engagement Lead** | Coordinates scoped testing engagements and workflow execution | Workflow orchestration, scope validation, task routing |
| **Recon Specialist** | Discovery and attack surface mapping | External recon, asset discovery, cloud and identity enumeration |
| **Web Testing Specialist** | HTTP and web application security validation | Route discovery, content fuzzing, web vuln validation |
| **API Testing Specialist** | API endpoint discovery and security testing | API schemas, auth/state testing, GraphQL and JWT checks |
| **Network Testing Specialist** | Network and service assessment | Service enumeration, protocol testing, packet capture |
| **Exploit Specialist** | Controlled proof-of-impact validation | Exploit research, payload generation, runtime validation |
| **Privilege Escalation Specialist** | Post-access privilege boundary testing | Local privilege checks, escalation-path validation, post-access review |
| **Lateral Movement Specialist** | Network pivot and credential path validation | Trust-path analysis, credential reuse, multi-host movement |
| **AD Specialist** | Active Directory and Kerberos security testing | Kerberos, LDAP, BloodHound, AD CS, Windows domain attack paths |
| **Retest Specialist** | Finding validation and false positive reduction | Reproduction testing, fix validation, regression checks |
| **Evidence Specialist** | Artifact collection and finding documentation | Evidence capture, artifact handling, proof quality |
| **Reporting Specialist** | Security assessment report generation | Finding narratives, severity scoring, report structure |

---

## 🎭 APT Simulation

Net-Runner includes a built-in APT threat simulation engine with **40 profiled threat groups**, **10 attack chains**, and **13 industry threat profiles** — all mapped to MITRE ATT&CK techniques.

Pick an industry or a threat actor and Net-Runner loads the matching attack chain, assigns specialist agents to each phase, and walks through the intrusion step by step.

| Simulation | Threat Actor | Industry |
|---|---|---|
| Government Cloud Espionage | APT29 (Cozy Bear) | Government |
| Credential Harvesting & AD Exploitation | APT28 (Fancy Bear) | Government |
| Critical Infrastructure Pre-Positioning | Volt Typhoon | Critical Infrastructure |
| ICS/OT Destructive Operations | Sandworm (APT44) | Energy / OT |
| SWIFT Financial Heist | APT38 (Bluenoroff) | Financial Services |
| Identity-Centric Cloud Compromise | Scattered Spider | Financial / Tech |
| Telecom Infrastructure Espionage | Salt Typhoon | Telecommunications |
| IT Supply Chain Exploitation | Silk Typhoon (HAFNIUM) | Technology |
| Healthcare Ransomware & Espionage | Lazarus Group | Healthcare |
| Manufacturing IP Theft | APT41 (Wicked Panda) | Manufacturing |

```text
/apt-simulation APT29 against government
/apt-simulation financial services
/apt-simulation Volt Typhoon critical infrastructure
```

Full reference: [APT Simulation Docs](docs/apt-simulation/README.md) · [Industry Threat Map](docs/apt-simulation/industry-threat-map.md) · [Attack Chain Reference](docs/apt-simulation/attack-chain-reference.md)

---

## 🧠 Intelligence Engine

Six modules that give the LLM runtime adaptive decision-making, formal verification, and automated bypass capabilities during live engagements.

| Module | Skill | Purpose |
|--------|-------|---------|
| **Feedback Loop Engine** | `/feedback-loop` | Classifies failures (WAF, rate-limit, auth, timeout), mutates payloads, and produces adaptive retry plans with strategy tracking |
| **Statistical Verifier** | `/statistical-verification` | Confirms blind injection with Welch's t-test — baseline vs payload response comparison with p-value and confidence intervals |
| **WAF Detection & Bypass** | `/waf-detection` | Fingerprints 10+ WAFs from HTTP responses and maps each to ranked bypass techniques |
| **MCTS Attack Planner** | `/mcts-planning` | Monte Carlo Tree Search over the attack state — ranks next actions and assigns specialist agents |
| **Knowledge Graph** | — | In-memory entity/relation graph tracking hosts, services, vulns, and credentials with BFS path-finding |
| **OOB Verification** | `/oob-verification` | Generates callback payloads for blind vulns (XXE, SSRF, RCE, SQLi, Log4Shell) and tracks confirmation status |

These modules operate at two levels:

- **Skill layer** — the engagement lead invokes skills like `/feedback-loop` or `/waf-detection` when the context calls for it
- **Runtime middleware** — tool failures, WAF detection, and evidence ingestion happen **automatically** during execution. The middleware classifies failures, fingerprints WAFs on first HTTP contact, syncs findings into the knowledge graph, and persists intelligence state to `.netrunner/intelligence-state.json` for session continuity

Full reference: [Intelligence Engine Docs](docs/intelligence-engine/README.md)

---

## 🚀 Getting Started

<details>
<summary><strong>Open setup and first run</strong></summary>

### 1. Install and build

```bash
bun install
bun run build
```

### 2. Configure model provider

`ANTHROPIC_API_KEY`

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
node dist/cli.mjs
```

`OPENAI_API_KEY`

```bash
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o"
node dist/cli.mjs
```

`GEMINI_API_KEY`

```bash
export GEMINI_API_KEY="AIza..."
export GEMINI_MODEL="gemini-2.5-pro"
node dist/cli.mjs
```

Ollama

```bash
ollama serve
ollama pull llama3.1:8b
export OPENAI_BASE_URL="http://localhost:11434/v1"
export OPENAI_MODEL="llama3.1:8b"
node dist/cli.mjs
```

Any OpenAI-compatible API

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_BASE_URL="https://your-provider.com/v1"
export OPENAI_MODEL="your-model-name"
node dist/cli.mjs
```

### 3. Run an assessment

```text
Assess https://target.example. Start with recon, map the attack surface, validate findings, and capture evidence.
```

</details>

---

## ⚙️ Execution Flow

1. Net-Runner detects assessment intent and target type from your prompt
2. Creates a `.netrunner/` project folder with engagement config and run state
3. Loads the matching workflow, scope rules, skills, and any memory from previous sessions
4. Runs tools autonomously — shell commands, file operations, web requests, and specialist agents
5. Checks every action against your scope and impact rules before executing
6. Saves evidence, findings, artifacts, and reports throughout the assessment

---

## 🎯 Workflows

- `web-app-testing` — route mapping, auth testing, and vulnerability validation
- `api-testing` — endpoint discovery, schema checks, auth/state testing
- `mobile-app-testing` — Android app analysis with `adb`, `apktool`, `jadx`, `frida`, `objection`, `MobSF`, `drozer`, `apkleaks`
- `lab-target-testing` — host/service enumeration, privilege escalation, lateral movement
- `ctf-mode` — challenge-focused runs with rapid iteration
- `ad-testing` — Active Directory, Kerberos, trust paths, AD CS
- `wifi-testing` — wireless assessments, handshake capture, rogue AP testing, 802.11 analysis

The recon stack includes cloud and identity enumeration tools: `cloud_enum`, `GHunt`, `holehe`, `haklistgen`.

---

## 🧰 Tool Catalog

**153 red-team tools** across 12 categories — [full catalog](docs/capabilities/tool-catalog.md)

| Category | Count | Examples |
|----------|-------|----------|
| Recon | 22 | nmap, masscan, amass, ffuf |
| Web | 28 | sqlmap, nuclei, wpscan, burp |
| AD | 12 | bloodhound, netexec, mimikatz |
| Cloud | 13 | cloud_enum, pacu, GHunt |
| Mobile | 8 | frida, objection, mobsf, drozer |
| Network | 13 | wireshark, tcpdump,Responder |
| Exploitation | 11 | metasploit, covenant |
| WiFi | 13 | aircrack-ng, wifite, bettercap |
| Binary/RE | 22 | ghidra, radare2, binwalk |
| Evidence | 5 | volatility, autopsy |
| API | 3 | postman, openapi-generator |
| Coordination | 2 | — |

---

## 📁 Runtime Layout

```text
.netrunner/
├── engagement.json
├── run-state.json
├── evidence/
│   └── ledger.jsonl
├── findings/
├── reports/
├── artifacts/
├── memory/
│   ├── private.md
│   └── agents/
└── instructions/
```

Everything the LLM finds, logs, and produces stays here. Agents store their memory under `memory/agents/` for session continuity.

---

## 🔌 MCP Integration

Net-Runner exposes a **FastMCP server** with 8 tools following the [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) pattern — minimal surface, no bloat.

### Tool surface (8 tools, `nr_*` prefix)

| Tool | Purpose |
|---|---|
| `nr_exec` | **Shell execution — the workhorse.** All 153 pentest tools run here. |
| `nr_engagement_init` | Initialize `.netrunner/` engagement with workflow, targets, scope |
| `nr_engagement_status` | Get engagement manifest, evidence counts, run state |
| `nr_scope_check` | Guardrail check — allow/review/block before risky actions |
| `nr_save_finding` | Record security finding with severity, evidence, CWE |
| `nr_save_note` | Append note to evidence ledger |
| `nr_list_evidence` | Query evidence entries with optional type filter |
| `nr_discover` | Progressive disclosure — list agents, skills, workflows, or capabilities on demand |

### Connect from any MCP client

**Windsurf** — add to `.windsurf/mcp.json` (project-level) or `~/.codeium/windsurf/mcp_config.json` (global):

```json
{
  "mcpServers": {
    "net-runner": {
      "command": "bun",
      "args": ["run", "src/mcp/server.ts", "--stdio"],
      "cwd": "/path/to/net-runner-release"
    }
  }
}
```

**VS Code Copilot** — create `.vscode/mcp.json`:

```json
{
  "servers": {
    "net-runner": {
      "type": "stdio",
      "command": "bun",
      "args": ["run", "src/mcp/server.ts", "--stdio"],
      "cwd": "/path/to/net-runner-release"
    }
  }
}
```

**Claude Desktop** — add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "net-runner": {
      "command": "bun",
      "args": ["run", "src/mcp/server.ts", "--stdio"],
      "cwd": "/path/to/net-runner-release"
    }
  }
}
```

### Terminal view (httpStream mode)

Start the server to see a live banner, tool list, and all call/session logs:

```bash
bun run mcp:server              # http://localhost:8745/mcp
NR_PORT=9000 bun run mcp:server # custom port
```

### Net-Runner → External MCP Servers (outbound)

Net-Runner can also connect to external MCP servers for additional tools. Add them via `.mcp.json` or the CLI:

```bash
net-runner mcp add my-scanner -- node path/to/scanner-server.js
net-runner mcp list
```

Full reference: [MCP Integration Docs](docs/mcp-integration/README.md)

---

## � Documentation

- [Workflow Overview](docs/workflows/overview.md)
- [Research Alignment](docs/project/research-alignment.md)
- [Upstream Provenance](docs/project/upstream-provenance.md)
- [Skills-First Architecture](docs/capabilities/skills-first-architecture.md)
- [Pentest Tool Catalog](docs/capabilities/tool-catalog.md)
- [Service Surfaces](docs/capabilities/service-surfaces.md)
- [APT Simulation Reference](docs/apt-simulation/README.md)
- [Industry → Threat Actor Map](docs/apt-simulation/industry-threat-map.md)
- [Attack Chain Reference](docs/apt-simulation/attack-chain-reference.md)
- [Intelligence Engine Reference](docs/intelligence-engine/README.md)
- [MCP Integration Guide](docs/mcp-integration/README.md)

---

## 🔗 Provenance

Net-Runner is built on top of the public [OpenClaude](https://github.com/Gitlawb/openclaude) runtime. All red-team features — agents, workflows, skills, guardrails, evidence capture, and the tool catalog — are Net-Runner additions. Research and provenance notes are under `docs/project/`.

---

## 📜 License

This repository is for educational use and authorized security testing only.
