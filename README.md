<div align="center">

<img src=".github/assets/Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runner" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/License-Educational%20Use-red?style=for-the-badge)](#license)

*Red-team runtime with workflow control, evidence, memory, and specialist agents.*

<sub>6 specialist agents · 228 cataloged tools · 279 capabilities · 32 skills · 12 workflows · 21 capability packs · 10 APT simulations</sub>

---

</div>

Net-Runner is a final-year university research project — an agentic red-team harness where an LLM drives full security assessments. It picks a workflow, spins up specialist agents, runs 228 cataloged tools through a single shell-execution surface, enforces scope guardrails, logs every action to an append-only evidence ledger, and generates traceable reports. Built on the public [OpenClaude](https://github.com/Gitlawb/openclaude) runtime.

The design follows Anthropic's [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) pattern: instead of exposing 228 tools as individual MCP definitions (50K+ context tokens), Net-Runner presents 14 `nr_*` tools and delegates all tool execution to shell via `nr_exec`. Skills, agents, and workflows are discovered from the filesystem on demand. Any MCP-compatible client — Claude Code, Cursor, Windsurf — can connect and drive the local harness without configuring API keys inside Net-Runner itself.

---

## Quick start

```bash
bun install
bun run typecheck
bun run build
```

Set one provider credential and launch:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."   # or OPENAI_API_KEY / GEMINI_API_KEY
node dist/cli.mjs
```

Ollama:

```bash
ollama serve && ollama pull llama3.1:8b
export OPENAI_BASE_URL="http://localhost:11434/v1"
export OPENAI_MODEL="llama3.1:8b"
node dist/cli.mjs
```

Guided setup wizard (saves `.net-runner-profile.json`):

```bash
bun run setup
bun run dev:profile
```

MCP server:

```bash
bun run mcp:server              # http://localhost:8745/mcp
NR_PORT=9000 bun run mcp:server # custom port
```

Connect from Claude Code:

```bash
claude mcp add --transport stdio net-runner -- bun run src/mcp/server.ts --stdio
```

Or in `.mcp.json` / `.cursor/mcp.json` / `.vscode/mcp.json`:

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

---

## How it works

1. Describe target and goal in plain English
2. `.netrunner/` created with scope envelope, impact boundary, and run state
3. Matching workflow loaded — specialist agents, role contracts, and prior session memory injected
4. Tools run with guardrail checks before each risky action
5. Evidence, findings, validation entries, and artifacts written to `.netrunner/` throughout
6. Reports generated from the evidence ledger — not from chat transcripts

Every finding starts `Unvalidated`. Validation is a separate typed step: command replay via `nr_validate_finding`, statistical verification, OOB callback confirmation, or artifact review. Reports label each finding `Validated`, `Unvalidated`, `Inconclusive`, or `Disputed`. MITRE coverage counts only replay-validated findings.

---

## Specialist agents

| Agent | Domain | Key tools |
|---|---|---|
| **engagement-lead** | Coordinates phases, routes specialists, queries KG before discovery, enforces scope | Agent routing, `nr_kg_query`, `nr_scope_check`, MCTS planner |
| **recon-specialist** | Target discovery, DNS/OSINT/surface mapping, 802.11 (AP discovery, PMKID/handshake, evil-twin) | `nmap`, `masscan`, `subfinder`, `amass`, `bbot`, `httpx`, `theHarvester`, `maigret`, `airodump-ng`, `hcxdumptool`, `hashcat -m 22000` |
| **app-testing-specialist** | Web (XSS, SQLi, SSRF, smuggling, auth bypass), REST/GraphQL/SOAP (JWT, IDOR), Android/iOS (static + dynamic, Frida, SSL unpin) | `sqlmap`, `dalfox`, `ffuf`, `nuclei`, `nikto`, `jwt_tool`, `arjun`, `jadx`, `apktool`, `frida`, `objection`, MobSF |
| **infra-specialist** | Network services, exploit validation, Linux/Windows/K8s privesc, multi-host lateral movement, AD (Kerberos/ADCS/BloodHound), binary RE + CTF pwn | `nmap`, `netexec`, `impacket-*`, `bloodhound`, `kerbrute`, `certipy`, `linpeas`, `winpeas`, `peirates`, `chisel`, `ghidra`, `gdb`, `pwntools` |
| **code-forensics-specialist** | SAST, secret scanning, dependency CVEs, IaC misconfig, memory/disk forensics, log timelining, IOC extraction | `semgrep`, `gitleaks`, `noseyparker`, `grype`, `trivy`, `checkov`, `volatility3`, `sleuthkit`, `chainsaw`, `hayabusa`, `yara` |
| **evidence-reporting-specialist** | Chain-of-custody curation, finding retest + remediation validation, client-ready reports | SHA-256 ledger, `nr_save_finding`, `nr_validate_finding`, `nr_export_report`, `nr_verify_evidence`, replay harness |

Each specialist gets the full toolset. Compressed-output discipline applies to all internal reasoning except `engagement-lead` and `evidence-reporting-specialist`.

---

## Workflows

`web-app-testing` · `api-testing` · `mobile-app-testing` · `lab-target-testing` · `adversary-emulation` · `bug-bounty-recon-validation` · `ctf-mode` · `ad-testing` · `wifi-testing` · `dfir-incident-response` · `code-audit-review` · `cloud-assessment`

---

## MCP surface (`nr_*`)

`nr_exec` · `nr_engagement_init` · `nr_engagement_status` · `nr_scope_check` · `nr_save_finding` · `nr_save_note` · `nr_list_evidence` · `nr_discover` · `nr_tool_help` · `nr_kg_query` · `nr_verify_evidence` · `nr_validate_finding` · `nr_coverage_status` · `nr_export_report`

`nr_exec` is the workhorse — all 228 cataloged tools run through it. The remaining 13 tools cover engagement state, scope, evidence, progressive discovery, Knowledge Graph, and report export.

---

## Reports

```bash
/report latest          # .netrunner/reports/latest.md
/report --html latest   # .netrunner/reports/latest.html
/report --all latest    # markdown + html
```

Via MCP:

```bash
nr_export_report format=markdown   # or html / sarif / stix / misp
```

Reports include executive dashboard, attack-path narrative, finding cards, remediation backlog, compliance mappings, MITRE ATT&CK coverage, and evidence appendix. SARIF 2.1, STIX 2.1, and MISP exports for downstream tooling.

---

## Intelligence engine

- **Knowledge Graph** — in-memory entity/relation graph built from evidence, queried before any discovery action
- **MCTS planner** — ranks next actions by expected information gain against current graph state
- **WAF detection/bypass** — classifies defenses, selects bypass strategy, persists to engagement state
- **Statistical verifier** — gates blind findings before they enter the ledger
- **OOB verification** — callback-based confirmation for out-of-band techniques
- **Feedback loop** — encodes payload mutations (encoding, header, delay, protocol) against per-target effectiveness history

State persists at `.netrunner/intelligence-state.json`. Per-engagement singleton.

---

## Camofox browser

Optional Firefox backend patched at C++ level for anti-bot bypass, used by the `headless-browser-validation` skill.

**Upstream:** [https://github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser)

```bash
bun run setup:camofox
```

Non-blocking — if `CAMOFOX_URL` is unreachable, the skill falls back to local Playwright or headless Chromium automatically.

---

## Provenance

Built on [OpenClaude](https://github.com/Gitlawb/openclaude). All red-team features are Net-Runner additions. See `docs/project/` for research and provenance notes.

For an honest engineering view of what the harness does and doesn't prove, see `docs/project/harness-assessment.md`.

**Docs:** [Workflows](docs/workflows/overview.md) · [APT Simulation](docs/apt-simulation/README.md) · [Intelligence Engine](docs/intelligence-engine/README.md) · [MCP Integration](docs/mcp-integration/README.md) · [Skills-First Architecture](docs/capabilities/skills-first-architecture.md)

---

## Contributing

Issues and PRs welcome. Keep changes scoped; run `bun run typecheck` before submitting.

## License

Educational use and authorised security testing only.
