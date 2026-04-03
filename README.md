<div align="center">

# Net-Runner 🥷

### Agentic Red-Team Assessment Framework

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/License-Educational%20Use-red?style=for-the-badge)](#license)

**12 Specialist Agents · 141 Red-Team Tools · 17 Capability Packs · 10 Pentest Skills · 6 Workflows**

*Speak naturally. Net-Runner keeps the workflow, evidence, and specialist flow together.*

**English** · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **Warning**
> Use **only** on targets you are explicitly authorized to test. Net-Runner is designed for legal, authorized penetration testing and educational purposes.

> **Final-year project note**
> This repository is the current implementation of my final-year project. It started from the same core idea in the original proposal, but the architecture matured as the AI tooling space moved quickly. The current version keeps the original goal intact while aligning the runtime around skills-first orchestration, direct tool execution, good agent routing, and selective MCP use where it actually helps.

## 🔍 What Is Net-Runner?

Net-Runner is a multi-agent security testing framework built for natural-language operation.

It is also the current research build for a final-year project focused on a next-generation red-team framework that stays modular, reduces unnecessary MCP dependence, and keeps strong runtime support for tool calling, evidence capture, and specialist execution.

You connect an LLM, describe the target and goal in plain English, and Net-Runner brings the full engine into play:

- it detects assessment intent
- it creates a project-scoped `.netrunner/` runtime envelope
- it injects scope and workflow context into the session
- it routes work to specialist agents when needed
- it records evidence, memory, and reports as the assessment runs

For most users, the experience should feel simple:

```text
You describe the job.
Net-Runner plans, delegates, executes, remembers, and reports.
```

---

## ✨ Why It Is Built This Way

- **Natural language first** — no need to memorize commands to get started
- **One inline system** — agents, tools, evidence, memory, and reporting run in the same flow
- **Specialist agents** — recon, web, API, network, exploit, AD, retest, evidence, and reporting roles are already wired in
- **Persistent memory** — useful context can be recalled across sessions through RAG-backed retrieval
- **Evidence-first operation** — findings, execution steps, approvals, and reports stay tied to the same engagement
- **Skills-first direction** — the framework keeps core workflow logic in reusable skills and runtime structure instead of pushing everything into MCP by default

## 🧭 Research Alignment

This version is not a departure from the original project idea. It is the version that aligns with it best.

The original goal was to build a modular AI-driven red-team framework that avoided tool bloat, reduced reasoning drift, and gave the runtime a cleaner way to execute offensive-security workflows. After further research and implementation work, the strongest version of that idea turned out to be:

- skills-first orchestration for reusable methodology
- direct shell, file, web, and code execution for most of the real work
- specialist agents for scoped tasks
- MCP kept as a selective integration layer instead of the default architecture

That means the core idea stayed the same, but the implementation got better and more aligned with current agent research and practical runtime behavior.

---

## 🚀 Start Here

### 1. Install and build

```bash
bun install
bun run build
```

### 2. Connect a model

Pick the provider you want and set the matching environment variables.

#### `ANTHROPIC_API_KEY`

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
node dist/cli.mjs
```

#### OpenAI

```bash
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o"
node dist/cli.mjs
```

#### Google Gemini

```bash
export GEMINI_API_KEY="AIza..."
export GEMINI_MODEL="gemini-2.5-pro"
node dist/cli.mjs
```

#### Ollama

```bash
ollama serve
ollama pull llama3.1:8b
export OPENAI_BASE_URL="http://localhost:11434/v1"
export OPENAI_MODEL="llama3.1:8b"
node dist/cli.mjs
```

#### Any OpenAI-compatible API

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_BASE_URL="https://your-provider.com/v1"
export OPENAI_MODEL="your-model-name"
node dist/cli.mjs
```

### 3. Speak naturally

Example:

```text
Assess https://target.example. Start with recon, find the main attack surface, validate the most likely issues, and keep evidence as you go.
```

Net-Runner will detect the target, start an engagement, inject the right context, and begin using its agentic runtime.

---

## ⚙️ How It Works

```text
You
  ↓
Main LLM session
  ↓
Net-Runner runtime context
  ↓
Specialist agents + tools + memory + evidence
  ↓
Structured assessment output
```

### What happens after one prompt

| Step | What Net-Runner does |
|------|----------------------|
| **1. Detect** | Recognizes assessment intent, target type, and likely workflow |
| **2. Bootstrap** | Creates `.netrunner/` state for the engagement if it does not already exist |
| **3. Inject** | Adds scope, impact boundary, workflow, and default skills into the live session |
| **4. Route** | Uses the main runtime and specialist agents together instead of making you micromanage commands |
| **5. Guard** | Applies internal guardrails to destructive, persistence-heavy, and out-of-scope actions |
| **6. Record** | Saves evidence, execution steps, findings, reviews, memory, and reports inside the same envelope |

### What the user experiences

You do not need to keep re-prompting the system with setup steps.

In the normal path, you can:

- give it a target
- tell it what kind of assessment to run
- ask it to continue, deepen, retest, summarize, or report
- let it use the environment, tools, memory, and agents already available to it

---

## 🧠 Why MCP Is Selective Here

Net-Runner is not anti-MCP. It just does not treat MCP as the default answer for everything.

For this project, the better pattern is:

1. keep core assessment logic in skills
2. use built-in tools and direct execution for most of the workflow
3. bring in MCP where typed external integrations, remote systems, or service boundaries make it worth it

That keeps the framework closer to the original project aim: modular, cleaner to reason about, and less bloated.

---

## 🕵️ Agents

Net-Runner keeps the original general agentic flow intact and adds specialist security roles on top.

| Agent | What it does |
|:------|:-------------|
| **Engagement Lead** | Orchestrates the assessment, chooses workflow phases, and routes work |
| **Recon Specialist** | Finds hosts, services, subdomains, technologies, and attack surface |
| **Web Testing Specialist** | Tests routes, parameters, auth flows, and web vulnerabilities |
| **API Testing Specialist** | Tests APIs, schemas, JWTs, IDOR paths, and state transitions |
| **Network Testing Specialist** | Handles service enumeration, network validation, and host-level testing |
| **Exploit Specialist** | Validates proof-of-impact in a controlled way |
| **Privilege Escalation Specialist** | Handles post-access escalation paths |
| **Lateral Movement Specialist** | Handles pivots, trust paths, and multi-host movement |
| **AD Specialist** | Handles Active Directory and Kerberos-focused testing |
| **Retest Specialist** | Reproduces findings and validates fixes |
| **Evidence Specialist** | Organizes artifacts and traceable evidence |
| **Reporting Specialist** | Turns evidence into a clean assessment report |

Core runtime agents such as `general-purpose`, `Explore`, `Plan`, and `verification` still remain part of the system.

---

## 🧱 Project Structure

Net-Runner keeps assessment state in a project-scoped `.netrunner/` directory.

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

What those parts are for:

- `engagement.json` — current workflow, targets, impact boundary, restrictions
- `run-state.json` — execution steps and pending reviews
- `evidence/` — append-only evidence ledger
- `findings/` — structured finding outputs
- `reports/` — generated assessment reports
- `artifacts/` — collected outputs and supporting files
- `memory/` — persistent operator, team, and agent memory
- `instructions/` — project-scoped runtime instructions

---

## 💬 Example Prompts

```text
Assess https://target.example and map the external attack surface.
```

```text
Continue the current engagement, focus on authentication weaknesses, and capture evidence for anything real.
```

```text
Escalate to intrusive validation and verify whether the identified issue is actually exploitable.
```

```text
Generate a report from the current evidence and summarize the highest-risk findings first.
```

---

## 📚 Documentation

The English README is the canonical version for the project narrative. The translated READMEs are convenience copies and may lag behind the main research-facing wording.

Keep the main README for the operator path. Use the docs for deeper technical detail.

- [Workflow Overview](docs/workflows/overview.md)
- [Research Alignment](docs/project/research-alignment.md)
- [Skills-First Architecture](docs/capabilities/skills-first-architecture.md)
- [Service Surfaces](docs/capabilities/service-surfaces.md)
- `docs/` for implementation detail, capability mapping, and deeper runtime notes

---

## 📜 License

This repository is for **educational use** and **authorized security testing** only.

---

<div align="center">

*Built as a skills-first red-team runtime for authorized testing, evidence-backed workflows, and final-year research into better agent architecture.*

</div>
