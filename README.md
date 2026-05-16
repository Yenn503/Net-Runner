<div align="center">

<img src=".github/assets/Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runner" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![MCP](https://img.shields.io/badge/MCP-FastMCP-7C3AED?style=for-the-badge)](https://www.anthropic.com/engineering/code-execution-with-mcp)
[![License](https://img.shields.io/badge/Educational%20Use-red?style=for-the-badge)](#license)

**Agentic security-testing runtime.** Workflow orchestration · specialist agent teams · curated exploit arsenal · intelligence-driven operations · append-only evidence chain

</div>

---

Run in the terminal or drive from any MCP client (Claude Code, Cursor, Windsurf, Claude Desktop). Built on [OpenClaude](https://github.com/Gitlawb/openclaude).

## What this is

Net-Runners turns an LLM agent into a structured security-testing platform. Instead of a free-form chat, you get:

- **Workflows** — 12 predefined testing pipelines with scope guardrails built in
- **Specialist agent teams** — 6 agents that route work between themselves
- **Evidence chain** — append-only JSONL ledger with SHA-256 chaining and PII redaction
- **Intelligence runtime** — WAF detection, Knowledge Graph tracking, MCTS planning, statistical/OOB verification
- **Optional MCP packs** — drive Ghidra, Burp Suite, Binary Ninja, or a Windows host through the same agent loop

## Quick start

```bash
bun install && bun run build
bun run setup              # interactive wizard — picks provider, validates token
bun run dev:profile        # launch with saved profile
```

## Providers

| Type | Provider | Launch |
|------|----------|--------|
| Subscription (OAuth) | [![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-000?style=for-the-badge&logo=githubcopilot&logoColor=white)](https://github.com/features/copilot) | `bun run dev:copilot` |
| Subscription (CLI auth) | [![OpenAI Codex](https://img.shields.io/badge/Codex-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com) | `bun run dev:codex` |
| Subscription (built-in) | [![Anthropic](https://img.shields.io/badge/Anthropic-000?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com) | `bun run dev:anthropic` |
| API key | [![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com) · [![Gemini](https://img.shields.io/badge/Gemini-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)](https://deepmind.google) · [![GitHub Models](https://img.shields.io/badge/GitHub%20Models-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com) | `GITHUB_TOKEN` / `OPENAI_API_KEY` / `GEMINI_API_KEY` |
| Local | [![Ollama](https://img.shields.io/badge/Ollama-000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com) | `bun run dev:ollama` |

## How it works

```
1. Describe target and goal in plain English
2. nr_engagement_init creates .netrunner/ with scope + impact boundary
3. Engagement lead routes work to specialist agents with role contracts
4. Tools run with nr_scope_check gating risky actions
5. Intelligence middleware classifies failures, detects WAFs, syncs
   evidence to Knowledge Graph, gates blind findings, plans next steps
6. Findings and artifacts append to the evidence ledger throughout
7. Reports generated from the ledger (not chat transcripts)
```

## Specialist agents

6 agents share the full 266-tool surface with curated skill packs. They communicate directly — no round-tripping every decision through the Lead.

<div align="center">
<table>
<tr>
<td width="33%" valign="top">

<p align="center"><b>🎯 Lead</b><br><sub><i>Engagement orchestration</i></sub></p>

- Phase coordination & task routing
- Scope & impact guardrails
- MCTS attack-path planning

</td>
<td width="33%" valign="top">

<p align="center"><b>🛰️ Recon</b><br><sub><i>Discovery & OSINT</i></sub></p>

- DNS, subdomain & port scanning
- Cloud asset discovery
- Identity OSINT · Wireless survey

</td>
<td width="33%" valign="top">

<p align="center"><b>🕷️ AppSec</b><br><sub><i>Web, API & mobile</i></sub></p>

- XSS, SQLi, SSRF, XXE, JWT
- API & GraphQL fuzzing
- Mobile cert bypass · Android/iOS RE

</td>
</tr>
</table>
<table>
<tr>
<td width="33%" valign="top">

<p align="center"><b>⚔️ Infra</b><br><sub><i>Network, AD, cloud & C2</i></sub></p>

- Service exploitation & privesc
- AD (Kerberos, ADCS, BloodHound)
- C2 ops (Sliver, Mythic) · Binary RE

</td>
<td width="33%" valign="top">

<p align="center"><b>🔬 CodeAudit</b><br><sub><i>SAST, secrets & forensics</i></sub></p>

- Static analysis (Semgrep, CodeQL)
- Secret & dependency scanning
- Memory/disk forensics · EVTX hunting

</td>
<td width="33%" valign="top">

<p align="center"><b>📋 Reporter</b><br><sub><i>Evidence & reporting</i></sub></p>

- SHA-256 evidence verification
- Finding replay validation
- CVSS/MITRE mapping · SARIF/STIX/MISP export

</td>
</tr>
</table>
</div>

## Workflows

12 workflows in 4 categories. `/mode` to browse, `/engagement init <workflow> <target>` to start.

| Category | Workflows |
|----------|-----------|
| **Pentest** | `web-app-testing` · `api-testing` · `mobile-app-testing` · `ad-testing` · `wifi-testing` · `cloud-assessment` · `lab-target-testing` · `bug-bounty-recon-validation` |
| **Red Team** | `adversary-emulation` (C2 ops, Sliver/Mythic) |
| **Blue Team** | `dfir-incident-response` · `code-audit-review` |
| **CTF** | `ctf-mode` |

## Skills

32 code-defined + 83 filesystem skills across 6 namespaces = **115 composable skills**.

Code-backed: engagement-setup, scope-guard, recon-plan, vuln-assessment, exploit-validation, oob-verification, waf-detection, attack-path-analysis, mcts-planning, c2-infrastructure, apt-simulation, dfir-triage, mobile-app-testing, binary-exploitation, and 18 more.

Filesystem playbooks covering appsec (22), forensics (18), infra (26), lead (5), recon (13), reporting (8) — from XSS/SQLi guides to Volatility3 workflows to Ghidra/BloodHound playbooks.

## Exploit arsenal

**32 curated exploit leads** across 4 attack surfaces. Agents match fingerprinted targets against the index. Entries are unvalidated PoC references, not automated exploits.

| Surface | Count | Notable entries |
|---------|-------|-----------------|
| **Windows** | 9 | BlueHammer (Defender RPC), RedSun (LPE), defendnot, undefend, SmartScreen bypass (CVE-2024-21412), CLFS LPE |
| **Active Directory** | 6 | Zerologon, noPac, Certifried, PetitPotam, PrintNightmare, AD CS ESC1-ESC16 |
| **Linux** | 5 | PwnKit, Dirty Pipe, Looney Tunables, nf_tables LPE, Baron Samedit |
| **Web & Appliance** | 17 | Log4Shell, Citrix Bleed, MOVEit SQLi, PAN-OS, ProxyLogon, Spring4Shell, Confluence, vCenter, and 9 more |

## Tool catalog

**266 catalogued tools** across 16 categories. 60% mapped to MITRE ATT&CK. `bun run tools:check` / `bun run tools:install` for readiness.

Recon (34) · Web (28) · Binary (22) · Cloud (17) · AD (15) · Code Audit (14) · Exploitation (14) · Network (13) · WiFi (13) · Forensics (13) · API (12) · Lateral Movement (10) · Mobile (8) · Threat Intel (8) · Evidence (5) · Coordination (2)

Notable: Nmap, BloodHound, SQLMap, Metasploit, Ghidra, Impacket, ffuf, Volatility3, Semgrep, YARA, Chainsaw, Sliver C2, and 254 more.

## Evasion & EDR testing

Dedicated skills for testing payloads against endpoint defenses. Manually validated PoCs — not automated bypasses.

- **defendnot** — Fake AV via WSC API, disables Defender
- **undefend** — Crashes windefend via RPC
- **BlueHammer** — Targets Defender RPC interface
- **SmartScreen bypass** (CVE-2024-21412) — Bypasses MotW via `.url` files
- **BOAZ loaders** — Multi-layered evasive shellcode with proxy syscalls and sleep masking
- **gocheck / MultCheck** — AMSI signature discovery + local multi-engine AV scan
- **WAF detection** — 11 vendor fingerprints with tailored bypass strategies

> **Note:** PowerShell security layer blocks AV/EDR bypass techniques behind permission prompts. Pentest framework with guardrails, not an auto-exploit platform.

## C2 operations

Command-and-control workflows, blocked unless the engagement authorises adversary emulation.

- **Infrastructure** — Redirector setup, listener transports (mTLS, WireGuard, HTTPS, DNS), Sliver/Mythic payload generation
- **Operations** — Payload staging, callback handling, pivot enablement, operator role separation

## APT simulation

40 APT group profiles, 10 simulation workflows, and a MITRE ATT&CK reference library covering ~150 techniques.

Groups by attribution: Russia (4) · China (10) · North Korea (5) · Iran (6) · Cybercrime (7) · Other (3). `/apt-simulation <group> against <industry>` to launch.

Mapped attack chains: APT29 (cloud espionage), APT28 (credential harvesting), Volt Typhoon (critical infra), Sandworm (ICS/OT destructive), APT38 (financial SWIFT), Lazarus (ransomware), and 34 more.

## Intelligence engine

Runs within active engagements, persists to `.netrunner/intelligence-state.json`.

| Component | What it does |
|-----------|-------------|
| **Knowledge Graph** | In-memory entity/relation graph from evidence. 10K-entity LRU eviction, BFS shortest path. |
| **MCTS Planner** | Monte Carlo Tree Search with UCB1 exploration. Seeds from KG, ranks next actions. |
| **WAF Detection** | Fingerprints 11 WAF vendors from HTTP responses. Per-vendor bypass strategies. |
| **Failure Classification** | 17 failure categories with payload mutation and exponential backoff. |
| **Statistical Verifier** | Welch's t-test for blind injection confirmation. |
| **OOB Verification** | 8 blind vuln types across 5 channels (HTTP, DNS, SMTP, FTP, LDAP). |

## Memory & RAG

File-based, LLM-driven retrieval — no vector database needed.

4 memory types (user, feedback, project, reference). Pipeline: scan memdir → Sonnet selects ≤5 relevant files → inject as system-reminder attachments.

Background extraction runs each turn. TEAMMEM optional sync with traversal protection. ON by default. `NET_RUNNER_DISABLE_AUTO_MEMORY=1` to disable.

## Evidence & reporting

Findings start **Unvalidated**. Validation via command replay, Welch's t-test, OOB callback, or artifact review.

**Ledger:** append-only JSONL at `.netrunner/evidence/ledger.jsonl`. SHA-256 hashed and chained. PII redacted by default.

**8 entry types:** session_start/end · finding · validation · note · artifact · guardrail · approval · execution_step

**Export:** Markdown, HTML, SARIF 2.1, STIX 2.1, MISP — via `/report latest` or `nr_export_report`.

## MCP surface

16 `nr_*` tools. All 266 catalogued tools run through `nr_exec` — the MCP surface stays minimal by design.

```
nr_exec · nr_engagement_init · nr_engagement_status · nr_scope_check
nr_save_finding · nr_save_note · nr_list_evidence · nr_discover
nr_tool_help · nr_tool_install · nr_kg_query · nr_verify_evidence
nr_validate_finding · nr_coverage_status · nr_export_report · nr_arsenal_lookup
```

Optional sandboxed execution via `NETRUNNER_EXEC_SANDBOX=docker` (Kali container, `--cap-drop ALL`, `--network none`).

## Optional MCP packs

Enable via `bun run mcp:packs enable <id>`.

| Pack | Environment | Purpose |
|------|-------------|---------|
| **Ghidra MCP** | Any | Drive Ghidra RE — decompilation, call graphs, P-code emulation, debugger |
| **Binary Ninja MCP** | Any | Alternative RE (requires licensed Binary Ninja) |
| **Burp Suite MCP** | Kali | Web proxy automation via official PortSwigger MCP BApp |
| **Windows MCP** | Windows | Agentic Windows control — run Windows-locked tools, AD tradecraft, payload prep against Defender |

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

Executive dashboard, attack-path narrative, finding cards, remediation backlog, MITRE ATT&CK coverage.

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

Patched Firefox for anti-bot bypass. Falls back to Playwright/Chromium. `bun run setup:camofox`

## Provenance

Built on [OpenClaude](https://github.com/Gitlawb/openclaude). Docs: [Workflows](docs/workflows/overview.md) · [Intelligence Engine](docs/intelligence-engine/README.md) · [MCP Integration](docs/mcp-integration/README.md) · [Customization](docs/customization/README.md) · [APT Simulation](docs/apt-simulation/README.md)

## License

Educational use and authorised security testing only.
