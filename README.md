<div align="center">


<img src="Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/License-Educational%20Use-red?style=for-the-badge)](#license)

**12 Specialist Agents · 153 Red-Team Tools · 18 Capability Packs · 11 Pentest Skills · 7 Workflows · 10 APT Simulations**

*Red-team runtime with workflow control, evidence, memory, and specialist agents.*

**English** · [Español](i18n/README.es.md) · [Français](i18n/README.fr.md) · [中文](i18n/README.zh.md) · [العربية](i18n/README.ar.md) · [Português](i18n/README.pt.md) · [Русский](i18n/README.ru.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [हिन्दी](i18n/README.hi.md) · [Deutsch](i18n/README.de.md)

---

</div>

Net-Runner is a final-year university project and research prototype that lets an LLM autonomously run security assessments. Give it a target, and it handles the rest — picking the right workflow, launching specialist agents, running tools, enforcing scope, and logging evidence. Built on the public [OpenClaude](https://github.com/Gitlawb/openclaude) runtime.

> “Net-Runner has the structure of a serious agentic security harness, not just a demo — the workflows, guardrails, evidence model, and specialist agents all reinforce each other.” — Cascade

> ⚠️ **Warning**
> Use this framework only on targets you are explicitly authorized to test. Net-Runner is for legal security testing, lab work, and research use.

---

## 🔍 How It Works

Give Net-Runner a target and goal in plain language. It sets up a `.netrunner/` project folder, picks the right workflow, and runs the full assessment autonomously — capturing evidence as it goes.

- Stores all evidence, findings, artifacts, and reports in one project folder
- The LLM and each specialist agent remember what they found before, so multi-session assessments stay on track
- Picks from 153 red-team tools and delegates to 12 specialist agents when domain expertise is needed
- Blocks or flags any action that goes out of scope or exceeds the allowed impact level
- Supports web, API, mobile, lab, Active Directory, WiFi, CTF assessments, and APT threat simulations

---

## 🧠 Core Engine Features

- **Persistent memory** — the LLM and each specialist agent remember what they found in previous sessions, so multi-day assessments stay coherent and every agent picks up where it left off
- **Evidence-first workflow** — every finding, artifact, and report is saved to the `.netrunner/` project folder automatically
- **Guardrail enforcement** — every action is checked against your declared scope and impact level before it runs
- **Skills-first execution** — reusable pentest playbooks (recon, exploit validation, reporting, etc.) that the LLM can trigger on demand
- **12 specialist agents** — each agent focuses on a specific domain (recon, web, network, AD, etc.) and is deployed when its expertise is needed
- **Auto-engagement setup** — type a target and goal in plain English; Net-Runner detects the intent, picks the workflow, and starts the assessment
- **APT simulation** — simulate real-world threat actors (APT29, Lazarus, Volt Typhoon, etc.) mapped to MITRE ATT&CK, with industry-specific attack chains and phase-by-phase guidance

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

### 4. Coordinator mode (experimental)

```bash
export NETRUNNER_COORDINATOR_MODE=1
node dist/cli.mjs
```

In this mode, the main LLM acts as a coordinator and delegates tool work to separate worker agents.

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

The current build registers **153 imported red-team tools** from [pentestToolCatalog.ts](src/security/pentestToolCatalog.ts).

- Recon: `22`
- Web: `28`
- API: `3`
- Mobile: `8`
- Network: `13`
- Exploitation: `11`
- Active Directory: `12`
- Cloud: `13`
- Binary / Reverse Engineering: `22`
- WiFi: `13`
- Evidence / Forensics: `5`
- Coordination / C2: `2`

Use the full grouped list here: [Pentest Tool Catalog](docs/capabilities/tool-catalog.md)

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

## 🤖 Specialist Agents

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

`.netrunner/` is the project folder for the current assessment. Everything the LLM finds, logs, and produces stays here. Each specialist agent also stores its own memory under `memory/agents/`, so it remembers what it found when it runs again in a future session.

---

## 📚 Documentation

- [Workflow Overview](docs/workflows/overview.md)
- [Research Alignment](docs/project/research-alignment.md)
- [Upstream Provenance](docs/project/upstream-provenance.md)
- [Skills-First Architecture](docs/capabilities/skills-first-architecture.md)
- [Pentest Tool Catalog](docs/capabilities/tool-catalog.md)
- [Service Surfaces](docs/capabilities/service-surfaces.md)
- [APT Simulation Reference](docs/apt-simulation/README.md)
- [Industry → Threat Actor Map](docs/apt-simulation/industry-threat-map.md)
- [Attack Chain Reference](docs/apt-simulation/attack-chain-reference.md)

---

## 🔗 Provenance

Net-Runner is built on top of the public [OpenClaude](https://github.com/Gitlawb/openclaude) runtime. All red-team features — agents, workflows, skills, guardrails, evidence capture, and the tool catalog — are Net-Runner additions. Research and provenance notes are under `docs/project/`.

---

## 📜 License

This repository is for educational use and authorized security testing only.
