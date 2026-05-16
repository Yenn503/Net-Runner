<div align="center">

<img src=".github/assets/Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runner" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![MCP](https://img.shields.io/badge/MCP-FastMCP-7C3AED?style=for-the-badge)](https://www.anthropic.com/engineering/code-execution-with-mcp)
[![License](https://img.shields.io/badge/Educational%20Use-red?style=for-the-badge)](#license)

**Agentic red-team runtime.** Workflow control · evidence ledger · specialist agents · 228 tools.

</div>

---
Run in the CLI or from any MCP client (Claude Code, Cursor, Windsurf). Built on [OpenClaude](https://github.com/Gitlawb/openclaude).

## Quick start

```bash
bun install && bun run build
bun run setup          # interactive wizard — picks provider, validates token
bun run dev:profile    # launch
```

## Providers

- **Subscription (OAuth, no API key)** — GitHub Copilot (`bun run dev:copilot`)
- **Subscription (CLI auth)** — OpenAI Codex / ChatGPT (`bun run dev:codex`)
- **Subscription (built-in account flow)** — Anthropic / Claude (`bun run dev:anthropic`)
- **API key** — GitHub Models (`GITHUB_TOKEN`), OpenAI, Gemini
- **Local** — Ollama

`bun run setup` writes a saved profile for all providers except Anthropic (uses built-in onboarding).

## Specialist agents

Six specialists share the same tool surface. Each carries a curated skill pack under `.netrunner/skills/<namespace>/`.

| Agent | Role | Focus areas |
|-------|------|-------------|
| 🎯 **Lead** | Phase coordination, routing, scope enforcement | KG queries, MCTS planning, guardrail decisions, handoff orchestration |
| 🛰️ **Recon** | Discovery, mapping, OSINT | DNS, surface mapping, cloud enumeration, 802.11 |
| 🕷️ **AppSec** | Web, API, mobile security testing | XSS, SQLi, SSRF, JWT, API fuzzing, mobile analysis |
| ⚔️ **Infra** | Network exploitation, privesc, AD, cloud, binary | Kerberos, ADCS, BloodHound, cloud attack paths, RE |
| 🔬 **CodeAudit** | SAST, secrets, forensics | CVE/IaC scanning, memory forensics, log timelining |
| 📋 **Reporter** | Evidence, retest, reporting | Chain-of-custody, remediation validation, export |

## Swarm

The Lead routes work to specialists — parallel for independent tasks, sequential for dependent ones with full context handoff (scope, evidence refs, next owner). Specialists communicate directly through the Agent SDK channel. Findings land in the shared `.netrunner/` ledger.

See [Customization](docs/customization/README.md) to add your own skill packs.

## Exploit arsenal

Curated CVE index (Citrix Bleed, PwnKit, Zerologon, PAN-OS, MOVEit…) at `.netrunner/arsenal/index/*.yaml`, grouped by attack surface. The agent matches fingerprinted targets against the index before re-deriving exploits. Validated exploits persist to `discovered.jsonl` for reuse across engagements.

## Workflows

12 workflows in 4 categories. Run `/mode` to browse, `/engagement init <workflow> <target>` to start.

| Category | Workflows |
|----------|-----------|
| **CTF** | `ctf-mode` |
| **Pentest** | `web-app-testing` · `api-testing` · `mobile-app-testing` · `ad-testing` · `wifi-testing` · `cloud-assessment` · `lab-target-testing` · `bug-bounty-recon-validation` |
| **Red Team** | `adversary-emulation` |
| **Blue Team** | `dfir-incident-response` · `code-audit-review` |

## How it works

1. Describe target and goal in plain English
2. `.netrunner/` initialised with scope + impact boundary
3. Workflow loads specialists, role contracts, and prior session memory
4. Tools run with `nr_scope_check` gating risky actions
5. Findings and artifacts write to `.netrunner/` throughout
6. Reports generated from the evidence ledger, not chat transcripts

Findings start `Unvalidated`. Validation types: command replay, statistical verification, OOB callback, or artifact review. Reports label `Validated` / `Unvalidated` / `Inconclusive` / `Disputed`. MITRE coverage counts replay-validated findings only.

## Intelligence engine

- **Knowledge Graph** — entity/relation graph from evidence, queried before discovery
- **MCTS planner** — ranks next actions by expected information gain
- **WAF detection** — classifies defenses and selects bypass strategy
- **Statistical verifier** — gates blind findings before they enter the ledger
- **OOB verification** — callback-based confirmation for out-of-band techniques

## MCP surface

16 `nr_*` tools for external clients. `nr_exec` runs all 228 catalogued tools through shell. The rest cover engagement state, scope, evidence, discovery, and reporting.

<details>
<summary>Tool list</summary>

`nr_exec` · `nr_engagement_init` · `nr_engagement_status` · `nr_scope_check` · `nr_save_finding` · `nr_save_note` · `nr_list_evidence` · `nr_discover` · `nr_tool_help` · `nr_tool_install` · `nr_kg_query` · `nr_verify_evidence` · `nr_validate_finding` · `nr_coverage_status` · `nr_export_report` · `nr_arsenal_lookup`

</details>

## Tool readiness

```bash
bun run tools:check
bun run tools:install     # idempotent host install
```

## Reports

```bash
/report latest           # Markdown
/report --html latest    # HTML
```

Executive dashboard, attack-path narrative, finding cards, remediation backlog, MITRE ATT&CK coverage. SARIF 2.1 / STIX 2.1 / MISP via `nr_export_report`.

<details>
<summary>CLI launch, MCP server, and IDE config</summary>

**Direct launch**

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
node dist/cli.mjs
```

**MCP server**

```bash
bun run mcp:server
```

**Claude Code**

```bash
claude mcp add --transport stdio net-runner -- bun run src/mcp/server.ts --stdio
```

**`.mcp.json`**

```json
{
  "mcpServers": {
    "net-runner": {
      "command": "bun",
      "args": ["run", "src/mcp/server.ts", "--stdio"]
    }
  }
}
```

</details>

## Camofox browser (optional)

Patched Firefox for anti-bot bypass. Falls back to Playwright/Chromium. Install: `bun run setup:camofox`

## Provenance

Built on [OpenClaude](https://github.com/Gitlawb/openclaude). Docs: [Workflows](docs/workflows/overview.md) · [Intelligence Engine](docs/intelligence-engine/README.md) · [MCP Integration](docs/mcp-integration/README.md) · [Customization](docs/customization/README.md)

## License

Educational use and authorised security testing only.
