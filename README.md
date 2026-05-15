<div align="center">

<img src=".github/assets/Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runner" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![MCP](https://img.shields.io/badge/MCP-FastMCP-7C3AED?style=for-the-badge)](https://www.anthropic.com/engineering/code-execution-with-mcp)
[![License](https://img.shields.io/badge/Educational%20Use-red?style=for-the-badge)](#license)

**Agentic red-team runtime.** Workflow control · evidence ledger · specialist agents · 228 tools through one shell surface.

<sub>6 specialists · 228 cataloged tools · 32 core skills + 87 curated playbooks · 12 workflows · 10 APT simulations</sub>

</div>

---
Red team Agent swarm, built on top of Claude code. 

CLI driven or any MCP client (Claude Code, Cursor, Windsurf) can drive the harness too.

## Quick start

```bash
bun install && bun run build
bun run setup          # interactive wizard — picks provider, validates token
bun run dev:profile    # launch
```

## Specialist agents

- 🎯 **Lead** — phase coordination, routing, scope enforcement, KG queries before discovery, MCTS planner
- 🛰️ **Recon** — DNS, OSINT, surface mapping, cloud asset enum, 802.11 · `nmap`, `masscan`, `subfinder`, `amass`, `bbot`, `theHarvester`, `cloud_enum`, `airodump-ng`, `hcxdumptool`
- 🕷️ **AppSec** — web (XSS/SQLi/SSRF/smuggling), API (JWT/IDOR), mobile (Frida/MobSF) · `sqlmap`, `dalfox`, `nuclei`, `ffuf`, `jwt_tool`, `arjun`, `jadx`, `frida`, `objection`
- ⚔️ **Infra** — services, privesc, AD (Kerberos/ADCS/BloodHound), cloud paths, RE + CTF pwn · `netexec`, `impacket-*`, `bloodhound`, `certipy`, `linpeas`, `peirates`, `pacu`, `cloudfox`, `chisel`, `ghidra`, `pwntools`
- 🔬 **CodeAudit** — SAST, secrets, CVE/IaC, memory + disk forensics, log timelining · `semgrep`, `gitleaks`, `noseyparker`, `grype`, `trivy`, `checkov`, `volatility3`, `sleuthkit`, `chainsaw`, `hayabusa`, `yara`
- 📋 **Reporter** — chain-of-custody curation, retest, remediation validation, client reports · SHA-256 ledger, `nr_save_finding`, `nr_validate_finding`, `nr_export_report`

Each specialist sees the full toolset. Compressed-output discipline applies to internal reasoning except Lead and Reporter.

## Swarm

The Lead doesn't do the work — it routes it. Independent tasks on disjoint targets fan out to specialists running in parallel; dependent work hands off in sequence with a full context packet (target slice, scope, known facts, evidence refs, stop conditions, next owner). Specialists talk to each other directly through the Agent SDK message channel — no round-tripping every decision through the Lead. Findings and artifacts land in the shared `.netrunner/` ledger as they go, so a handoff is a pointer, not a transcript.

Each specialist also carries a curated skill pack — domain playbooks under `.netrunner/skills/<namespace>/` (`recon:`, `appsec:`, `infra:`, `forensics:`, `lead:`, `reporting:`) covering the techniques that domain actually runs. See [Customization](docs/customization/README.md) to add your own.

## Exploit arsenal

The exploit specialists carry a curated arsenal at `.netrunner/arsenal/`. `index/*.yaml` is a vetted set of known exploits — recent high-impact CVEs (Citrix Bleed, PwnKit, Zerologon, PAN-OS, MOVEit…) grouped by surface (windows / linux / web-and-appliance / active-directory). Before exploiting a fingerprinted target the agent matches it against the index instead of re-deriving an exploit from scratch. Exploits the harness validates in an engagement are appended to `discovered.jsonl`, so a working exploit is reusable across future engagements. Arsenal entries are leads — every one is validated against the live target under scope before it counts as a finding.

## Workflows

12 workflows in 4 categories. Run `/mode` to browse them, `/mode <category>` to filter, then `/engagement init <workflow> <target>` to start.

- **CTF** — `ctf-mode`
- **Pentest** — `web-app-testing` · `api-testing` · `mobile-app-testing` · `ad-testing` · `wifi-testing` · `cloud-assessment` · `lab-target-testing` · `bug-bounty-recon-validation`
- **Red Team** — `adversary-emulation`
- **Blue Team** — `dfir-incident-response` · `code-audit-review`

On a cold start the engagement-lead prints the same menu and takes a number + target. Either path works.

## How it works

1. Describe target and goal in plain English
2. `.netrunner/` initialized with scope envelope + impact boundary
3. Workflow loads — specialists, role contracts, prior session memory injected
4. Tools run with `nr_scope_check` gating risky actions
5. Findings, validation entries, artifacts written to `.netrunner/` throughout
6. Reports generated from the evidence ledger — not chat transcripts

Findings start `Unvalidated`. Validation is typed: command replay (`nr_validate_finding`), statistical verification, OOB callback, or artifact review. Reports label `Validated` / `Unvalidated` / `Inconclusive` / `Disputed`. MITRE coverage counts replay-validated findings only.

## Intelligence engine

- **Knowledge Graph** — entity/relation graph from evidence; queried before discovery to avoid redundant probes
- **MCTS planner** — ranks next actions by expected information gain
- **WAF detection** — classifies defenses, selects bypass strategy, persists to engagement state
- **Statistical verifier** — gates blind findings before they enter the ledger
- **OOB verification** — callback-based confirmation for out-of-band techniques
- **Feedback loop** — payload mutation history (encoding, header, delay, protocol) per target

State at `.netrunner/intelligence-state.json`. Per-engagement singleton.

## MCP surface

14 tools. `nr_exec` is the workhorse — all 228 cataloged tools run through shell. Remaining 13 cover engagement state, scope, evidence, discovery, KG, validation, report export.

<details>
<summary>Tool list</summary>

`nr_exec` · `nr_engagement_init` · `nr_engagement_status` · `nr_scope_check` · `nr_save_finding` · `nr_save_note` · `nr_list_evidence` · `nr_discover` · `nr_tool_help` · `nr_kg_query` · `nr_verify_evidence` · `nr_validate_finding` · `nr_coverage_status` · `nr_export_report`

</details>

## Reports

```bash
/report latest           # Markdown
/report --html latest    # HTML
/report --all latest     # both
```

Executive dashboard, attack-path narrative, finding cards, remediation backlog, compliance mappings, MITRE ATT&CK coverage, evidence appendix. SARIF 2.1 / STIX 2.1 / MISP via `nr_export_report`.

<details>
<summary>Manual env launch, Ollama, MCP server, IDE config</summary>

**Direct env var launch**

```bash
export ANTHROPIC_API_KEY="sk-ant-..."   # or OPENAI_API_KEY / GEMINI_API_KEY
node dist/cli.mjs
```

**Ollama (local, no API key)**

```bash
ollama serve && ollama pull llama3.1:8b
export OPENAI_BASE_URL="http://localhost:11434/v1"
export OPENAI_MODEL="llama3.1:8b"
node dist/cli.mjs
```

**MCP server**

```bash
bun run mcp:server              # http://localhost:8745/mcp
NR_PORT=9000 bun run mcp:server # custom port
```

**Claude Code**

```bash
claude mcp add --transport stdio net-runner -- bun run src/mcp/server.ts --stdio
```

**`.mcp.json` / `.cursor/mcp.json` / `.vscode/mcp.json`**

```json
{
  "mcpServers": {
    "net-runner": {
      "command": "bun",
      "args": ["run", "src/mcp/server.ts", "--stdio"],
      "env": { "NR_CWD": "/path/to/net-runner-release" }
    }
  }
}
```

</details>

## Camofox browser

Optional Firefox patched at C++ level for anti-bot bypass. Used by the `headless-browser-validation` skill. Auto-falls back to local Playwright/Chromium.

Upstream: [jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) · install: `bun run setup:camofox`

## Provenance

Built on [OpenClaude](https://github.com/Gitlawb/openclaude). Red-team layer (agents, workflows, intelligence engine, evidence ledger) is Net-Runner.

Candid engineering view: [`docs/project/harness-assessment.md`](docs/project/harness-assessment.md).

**Docs:** [Workflows](docs/workflows/overview.md) · [APT Sim](docs/apt-simulation/README.md) · [Intelligence Engine](docs/intelligence-engine/README.md) · [MCP Integration](docs/mcp-integration/README.md) · [Skills-First Architecture](docs/capabilities/skills-first-architecture.md) · [Environments](docs/environments/README.md) · [Customization](docs/customization/README.md)

## Contributing

Issues and PRs welcome. Run `bun run typecheck` before submitting.

## License

Educational use and authorised security testing only.
