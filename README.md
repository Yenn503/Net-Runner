<div align="center">

<img src=".github/assets/Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runner" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![MCP](https://img.shields.io/badge/MCP-FastMCP-7C3AED?style=for-the-badge)](https://www.anthropic.com/engineering/code-execution-with-mcp)
[![License](https://img.shields.io/badge/Educational%20Use-red?style=for-the-badge)](#license)

**Agentic red-team runtime.** Workflow control · evidence ledger · specialist agents · 228 tools · exploit arsenal · C2 · evasion · optional MCP packs

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

| Type | Provider | Launch |
|------|----------|--------|
| Subscription (OAuth) | [![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-000?style=for-the-badge&logo=githubcopilot&logoColor=white)](https://github.com/features/copilot) | `bun run dev:copilot` |
| Subscription (CLI auth) | [![OpenAI Codex](https://img.shields.io/badge/Codex-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com) | `bun run dev:codex` |
| Subscription (built-in) | [![Anthropic](https://img.shields.io/badge/Anthropic-000?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com) | `bun run dev:anthropic` |
| API key | [![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com) · [![Gemini](https://img.shields.io/badge/Gemini-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)](https://deepmind.google) · [![GitHub Models](https://img.shields.io/badge/GitHub%20Models-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com) | `GITHUB_TOKEN` / `OPENAI_API_KEY` / `GEMINI_API_KEY` |
| Local | [![Ollama](https://img.shields.io/badge/Ollama-000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com) | `bun run dev:ollama` |

`bun run setup` saves a profile for all except Anthropic (uses built-in onboarding).

## Specialist agents

Six agents share the full 228-tool surface with curated skill packs under `.netrunner/skills/<namespace>/`. They communicate directly through the Agent SDK channel — no round-tripping every decision through the Lead.

<div align="center">
<table>
<tr>
<td width="33%" valign="top">

<p align="center"><b>🎯 Lead</b><br><sub><i>Engagement orchestration</i></sub></p>

- Phase coordination & task routing
- Scope & impact guardrails
- Knowledge Graph queries
- MCTS path planning
- Engagement lifecycle mgmt

</td>
<td width="33%" valign="top">

<p align="center"><b>🛰️ Recon</b><br><sub><i>Discovery & OSINT</i></sub></p>

- DNS, subdomain & port scanning
- Cloud asset discovery
- Identity OSINT (Maigret, GHunt)
- Wireless surveying (802.11)
- Digital footprint assessment

</td>
<td width="33%" valign="top">

<p align="center"><b>🕷️ AppSec</b><br><sub><i>Web, API & mobile</i></sub></p>

- XSS, SQLi, SSRF, XXE, IDOR, JWT
- Deserialization, SSTI, CORS
- GraphQL testing & API fuzzing
- Mobile cert pinning bypass
- Android static/dynamic analysis

</td>
</tr>
</table>
<table>
<tr>
<td width="33%" valign="top">

<p align="center"><b>⚔️ Infra</b><br><sub><i>Network, AD, cloud & C2</i></sub></p>

- Service exploitation & privesc
- AD (Kerberos, ADCS, BloodHound)
- Cloud attack paths (AWS/Azure/K8s)
- C2 ops (Sliver, Mythic)
- AV/EDR evasion (BOAZ, gocheck)

</td>
<td width="33%" valign="top">

<p align="center"><b>🔬 CodeAudit</b><br><sub><i>SAST, secrets & forensics</i></sub></p>

- Static analysis (Semgrep, CodeQL)
- Secret & dependency scanning
- IaC misconfigs (Checkov, KICS)
- Memory & disk forensics
- Windows EVTX threat hunting

</td>
<td width="33%" valign="top">

<p align="center"><b>📋 Reporter</b><br><sub><i>Evidence & reporting</i></sub></p>

- Chain-of-custody curation
- SHA-256 evidence ledger
- Retest & remediation validation
- CVSS/SSVC/MITRE ATT&CK mapping
- SARIF/STIX/MISP report export

</td>
</tr>
</table>
</div>

## Exploit arsenal

Curated CVE index at `.netrunner/arsenal/index/*.yaml`, grouped by attack surface. Agents match fingerprinted targets against the index before re-deriving exploits. Validated exploits persist to `discovered.jsonl` for cross-engagement reuse.

**Notable exploits by surface:**

| Surface | Exploits |
|---------|----------|
| **Windows** | BlueHammer (Defender RPC), RedSun (LPE), YellowKey (BitLocker bypass), MiniPlasma (CVE-2020-17103), CLFS LPE (CVE-2023-28252), SmartScreen bypass (CVE-2024-21412), GreenPlasma (CTFMON LPE), UnDefend (Defender DoS), defendnot (WSC fake-AV) |
| **Linux** | PwnKit (CVE-2021-4034), Dirty Pipe (CVE-2022-0847), Looney Tunables (CVE-2023-4911), nf_tables LPE (CVE-2024-1086), Baron Samedit (CVE-2021-3156) |
| **Active Directory** | Zerologon (CVE-2020-1472), noPac (CVE-2021-42278/42287), Certifried (CVE-2022-26923), PetitPotam (CVE-2021-36942), PrintNightmare (CVE-2021-34527), AD CS ESC1-ESC16 |
| **Web & Appliance** | Log4Shell (CVE-2021-44228), Citrix Bleed (CVE-2023-4966), MOVEit SQLi (CVE-2023-34362), PAN-OS (CVE-2024-3400), ScreenConnect (CVE-2024-1709), ActiveMQ RCE (CVE-2023-46604), Spring4Shell (CVE-2022-22965), ProxyLogon/Shell/NotShell, F5 BIG-IP (CVE-2022-1388), Confluence (CVE-2023-22515), Veeam (CVE-2024-40711), vCenter (CVE-2021-21972) |

## Evasion & EDR testing

Dedicated skills for testing payloads against endpoint defenses:

- **BOAZ evasive loaders** — Multi-layered AV/EDR-evasion shellcode loaders (donut, LLVM obfuscation, proxy syscalls, sleep masking, UUID/MAC/IPv4/XOR/RC4/AES/DES encoders)
- **gocheck** — Binary-search payloads for exact bytes triggering Defender/AMSI signatures (modern Go reimplementation of ThreatCheck)
- **MultCheck** — Batch multi-engine AV scanning (ESET, Sophos, CrowdStrike, SentinelOne, Bitdefender, Kaspersky, Trend Micro, McAfee, Symantec) — locally, never uploads to VirusTotal
- **WAF detection** — Fingerprints 11 WAF vendors (Cloudflare, Akamai, Imperva, F5, ModSecurity, AWS WAF, Azure Front Door, Sucuri, etc.) with tailored bypass strategies per vendor
- **Feedback loop** — Automated payload mutation history (encoding, headers, delays, protocols) per target with retry adaptation

## C2 operations

Full command-and-control workflows with guardrails:

- **C2 infrastructure** — Redirector/fronting setup, listener transports (mTLS, WireGuard, HTTPS, DNS), domain approval, profile config, payload generation (Sliver, Mythic), teardown checkpoints
- **C2 operations** — Payload staging, listener lifecycle, callback handling, pivot enablement, operator role separation (operator/lead/spectator)
- Guarded by default — C2 actions blocked unless engagement authorises adversary emulation or C2

## Optional MCP packs

Extend the harness with specialised MCP servers. Enable via `bun run mcp:packs`.

| Pack | Environment | Purpose |
|------|-------------|---------|
| **Ghidra MCP** | Any | Drive Ghidra RE — decompilation, call graphs, P-code emulation, debugger |
| **Binary Ninja MCP** | Any | Alternative RE MCP (requires licensed Binary Ninja) |
| **Burp Suite MCP** | Kali | Web proxy automation via official PortSwigger MCP BApp |
| **Windows MCP** | Windows | Agentic Windows control — file nav, app control, GUI interaction, screen capture. Run Windows-locked tools, AD tradecraft, payload prep against Defender on a Windows host or detonation VM |

## Workflows

12 workflows in 4 categories. `/mode` to browse, `/engagement init <workflow> <target>` to start.

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

Findings start `Unvalidated`. Validation: command replay, statistical verification, OOB callback, or artifact review. Reports label `Validated` / `Unvalidated` / `Inconclusive` / `Disputed`.

## Intelligence engine

- **Knowledge Graph** — entity/relation graph from evidence, queried before discovery
- **MCTS planner** — ranks next actions by expected information gain
- **WAF detection** — classifies defenses and selects bypass strategy
- **Statistical verifier** — gates blind findings before they enter the ledger
- **OOB verification** — callback-based confirmation for out-of-band techniques

## MCP surface

16 `nr_*` tools exposed to external clients. `nr_exec` is the workhorse — all 228 catalogued tools run through shell.

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

Patched Firefox for anti-bot bypass. Falls back to Playwright/Chromium. `bun run setup:camofox`

## Provenance

Built on [OpenClaude](https://github.com/Gitlawb/openclaude). Docs: [Workflows](docs/workflows/overview.md) · [Intelligence Engine](docs/intelligence-engine/README.md) · [MCP Integration](docs/mcp-integration/README.md) · [Customization](docs/customization/README.md)

## License

Educational use and authorised security testing only.
