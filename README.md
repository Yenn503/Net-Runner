<div align="center">

# Net-Runner 🥷

### LLM-Assisted Red-Team Assessment Framework

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/License-Educational%20Use-red?style=for-the-badge)](#license)

**12 Specialist Agents · 153 Red-Team Tools · 18 Capability Packs · 10 Pentest Skills · 7 Workflows**

*Workflow-aware red-team runtime with evidence, memory, and specialist agents in one flow.*

**English** · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

Net-Runner is a final-year university project and research prototype for LLM-assisted red-team assessments. It is built on the public [OpenClaude](https://github.com/Gitlawb/openclaude) fork and adapted into a framework with workflow-aware execution, specialist agents, evidence capture, and project-scoped runtime state.

> Warning
> Use this framework only on targets you are explicitly authorized to test. Net-Runner is for legal security testing, lab work, and research use.

## Project Scope

- research prototype for authorized red-team and security assessment work
- operator-facing README for setup and usage
- deeper research, provenance, and architecture notes under `docs/`

## What Net-Runner Does

You give Net-Runner a target and a goal in plain language. It creates a project-scoped `.netrunner/` runtime, selects the right workflow context, routes scoped tasks to specialist agents when needed, and records evidence as the assessment runs.

- keeps workflow, evidence, memory, and reports in the same runtime
- supports web, API, mobile, lab, Active Directory, WiFi, and CTF-style work
- uses specialist agents for recon, web, API, network, exploit, AD, retest, evidence, and reporting tasks
- keeps methodology in skills and uses MCP only where it adds a clear integration benefit

## Quick Start

### 1. Install and build

```bash
bun install
bun run build
```

### 2. Set a model provider

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

### 3. Start an assessment

```text
Assess https://target.example. Start with recon, map the main attack surface, validate the most likely issues, and keep evidence as you go.
```

## What Happens When You Run It

1. Net-Runner detects assessment intent and target type.
2. It initializes `.netrunner/` state for the project if needed.
3. It injects scope, impact, and workflow context into the session.
4. It uses the main runtime plus specialist agents and tools to carry the work forward.
5. It records evidence, notes, findings, and reports inside the same project envelope.

## Workflows

- `web-app-testing` for route mapping, auth testing, and web finding validation
- `api-testing` for endpoint discovery, schema checks, auth/state testing, and API-specific findings
- `mobile-app-testing` for Android app review and dynamic testing with tools such as `adb`, `apktool`, `jadx`, `frida`, `objection`, `MobSF`, `drozer`, and `apkleaks`
- `lab-target-testing` for internal labs, host/service work, privilege escalation, and lateral movement
- `ctf-mode` for challenge-style runs where speed and iteration matter more than formal reporting
- `ad-testing` for Active Directory, Kerberos, trust-path, and AD CS work
- `wifi-testing` for wireless assessments, handshake capture, rogue AP testing, and 802.11 analysis

The recon stack also includes tools for cloud and identity enumeration such as `cloud_enum`, `GHunt`, `holehe`, and `haklistgen`.

## Specialist Agents

- `engagement-lead`
- `recon-specialist`
- `web-testing-specialist`
- `api-testing-specialist`
- `network-testing-specialist`
- `exploit-specialist`
- `privilege-escalation-specialist`
- `lateral-movement-specialist`
- `ad-specialist`
- `retest-specialist`
- `evidence-specialist`
- `reporting-specialist`

## Runtime Layout

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

## Documentation

- [Workflow Overview](docs/workflows/overview.md)
- [Research Alignment](docs/project/research-alignment.md)
- [Upstream Provenance](docs/project/upstream-provenance.md)
- [Skills-First Architecture](docs/capabilities/skills-first-architecture.md)
- [Service Surfaces](docs/capabilities/service-surfaces.md)

## Provenance

The public upstream base for this repository is [OpenClaude](https://github.com/Gitlawb/openclaude). Net-Runner changes that base into a red-team assessment framework; the research and provenance notes live under `docs/project/`.

## License

This repository is for educational use and authorized security testing only.
