<div align="center">

# Net-Runners 🥷

### Red-Team Assessment Framework

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/License-Educational%20Use-red?style=for-the-badge)](#license)

**12 Specialist Agents · 153 Red-Team Tools · 18 Capability Packs · 10 Pentest Skills · 7 Workflows**

*Red-team runtime with workflow control, evidence, memory, and specialist agents.*

**English** · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

Net-Runner is a final-year university project and research prototype for red-team assessments with language-model support. It builds on the public [OpenClaude](https://github.com/Gitlawb/openclaude) fork and turns that base into a workflow-driven assessment framework with specialist agents, evidence capture, and project-scoped runtime state.

> ⚠️ **Warning**
> Use this framework only on targets you are explicitly authorized to test. Net-Runner is for legal security testing, lab work, and research use.

---

## 🔍 How It Works

Give Net-Runner a target and goal in plain language. It creates a project-scoped `.netrunner/` runtime, selects the right workflow, routes tasks to specialist agents, and captures evidence throughout the assessment.

- Keeps workflow state, evidence, memory, and reports in one runtime
- Pulls useful context back in through relevant-memory recall, project memory, agent memory, and session summaries
- Uses specialist agents when a task has a clear boundary
- Applies guardrails before higher-risk or out-of-scope actions
- Runs locally by default and keeps optional remote-session support from the upstream base
- Supports web, API, mobile, lab, Active Directory, WiFi, and CTF work

---

## 🧠 Core Engine Features

- **Retrieval-backed context** — Net-Runner can bring useful context back into later runs through relevant-memory retrieval, agent memory, and session-memory summaries
- **Evidence-first workflow** — findings, artifacts, notes, and reports stay tied to the same `.netrunner/` engagement
- **Scoped delegation** — the main runtime keeps control of the assessment loop and hands bounded work to specialist agents when that helps
- **Guardrail enforcement** — bash, fetch, and delegated actions all run through engagement-aware guardrails
- **Skills-first execution** — assessment method lives in reusable skills and runtime structure, while MCP stays for the integrations that actually need it
- **Remote and local modes** — local execution is the default path, but the engine still keeps optional remote-session support from the upstream base

---

## 🚀 Getting Started

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

---

## ⚙️ Execution Flow

1. Net-Runner detects assessment intent and target type
2. Initializes `.netrunner/engagement.json` and run-state for the project
3. Injects workflow, scope, impact, skills, and retrieved context from memory
4. Runs with shell, file, web, code, and specialist-agent tooling
5. Applies engagement guardrails before higher-risk or out-of-scope actions
6. Records evidence, findings, artifacts, and reports in the project runtime

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
│   ├── team.md
│   └── agents/
└── instructions/
```

---

## 📚 Documentation

- [Workflow Overview](docs/workflows/overview.md)
- [Research Alignment](docs/project/research-alignment.md)
- [Upstream Provenance](docs/project/upstream-provenance.md)
- [Skills-First Architecture](docs/capabilities/skills-first-architecture.md)
- [Pentest Tool Catalog](docs/capabilities/tool-catalog.md)
- [Service Surfaces](docs/capabilities/service-surfaces.md)

---

## 🔗 Provenance

The public upstream base for this repository is [OpenClaude](https://github.com/Gitlawb/openclaude). Net-Runner changes that base into a red-team assessment framework. Research and provenance notes are under `docs/project/`.

---

## 📜 License

This repository is for educational use and authorized security testing only.
