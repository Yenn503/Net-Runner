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

*Red-team runtime with workflow control, evidence, memory, and specialist agents.*

<sub>17 specialist agents · 228 cataloged tools · 279 capabilities · 32 skills · 12 workflows · 21 capability packs · 10 APT simulations</sub>

---

</div>

Net-Runner is a final-year university project and research prototype of an AI security testing framework for autonomous penetration testing. An LLM runs the full security assessment, picking workflows, launching specialist agents, running 228 cataloged red-team tools, including Maigret-backed digital-footprint OSINT, enforcing guardrails, logging evidence, and generating human-readable reports from the evidence ledger. Built on the public [OpenClaude](https://github.com/Gitlawb/openclaude) runtime.

The architecture follows the [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) pattern from Anthropic instead of exposing 228 tools as individual MCP definitions (which would consume 50K+ tokens of context), Net-Runner presents a minimal MCP surface (14 core tools) and delegates all tool execution to code. Skills, agents, and workflows are discovered through the filesystem on demand. Any MCP-compatible LLM GitHub Copilot, Claude, or Cursor can connect and drive the local harness without configuring API keys in Net-Runner itself. The result is a **skills-first, code-execution-first** harness where MCP calls are essential-only and the real work happens through shell execution, specialist agents, reusable skill bundles, and project-scoped evidence.

The current opensource baseline is local-first and type-safe: the repository now typechecks cleanly, the CLI supports direct provider credentials, and the FastMCP server can be run directly from source for red-team-style tool driving, evidence capture, and workflow control.

---

## Quick Start

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

MCP server only:

```bash
bun run mcp:server              # http://localhost:8745/mcp
NR_PORT=9000 bun run mcp:server # custom port
```

Connect from Claude Code:

```bash
claude mcp add --transport stdio net-runner -- bun run src/mcp/server.ts --stdio
```

Or `.mcp.json` / `.cursor/mcp.json` / `.vscode/mcp.json`:

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

## Features

- **Persistent memory** — LLM and each specialist agent remember previous sessions; multi-day assessments stay coherent
- **Evidence-first** — every finding, artefact, and report saved to `.netrunner/` automatically
- **Guardrail enforcement** — every action checked against declared scope and impact level before execution
- **17 specialist agents** — engagement lead, recon, web, API, network, AD, exploit, privilege escalation, lateral movement, wifi, mobile, binary, forensics, code-audit, retest, evidence, reporting
- **228 red-team tools and 279 capabilities** across 21 capability packs (recon, web, API, AD, cloud, mobile, network, exploitation, WiFi, binary/RE, forensics, code-audit, threat-intel, lateral-movement, evidence, reporting, coordination, lab control, database, exfiltration, privilege escalation)
- **12 workflows** — web-app, API, mobile, lab, adversary emulation, bug bounty, CTF, AD, WiFi, DFIR, code audit, cloud assessment
- **10 APT simulations** — 40 threat groups, 13 industry profiles, MITRE ATT&CK mapped
- **Intelligence engine** — feedback loop, WAF detection/bypass, MCTS planner, statistical verifier, OOB verification, knowledge graph
- **Minimal MCP surface** — 14 `nr_*` tools; `nr_exec` runs all 228 tools via shell
- **Human-grade reporting** — Markdown and designed HTML reports with executive dashboard, attack-path narrative, finding cards, remediation backlog, compliance mapping, MITRE coverage, and evidence appendix; SARIF/STIX/MISP exports for downstream tools
- **Auto-engagement setup** — describe target in plain English; Net-Runner detects intent and starts assessment

---

## Workflows

`web-app-testing` · `api-testing` · `mobile-app-testing` · `lab-target-testing` · `adversary-emulation` · `bug-bounty-recon-validation` · `ctf-mode` · `ad-testing` · `wifi-testing` · `dfir-incident-response` · `code-audit-review` · `cloud-assessment`

## Specialist Agents

| Agent | When | Tool chain | Skills |
|---|---|---|---|
| **engagement-lead** | Coordinates engagement; routes specialists; queries KG before discovery | Agent routing, `nr_kg_query`, scope guardrail | engagement-setup, scope-guard, attack-path-analysis, mcts-planning |
| **recon** | Target discovery, OSINT, surface mapping | `nmap`, `masscan`, `rustscan`, `subfinder`, `amass`, `bbot`, `httpx`, `katana`, `theHarvester`, `sherlock` | recon-plan, target-fingerprinting, digital-footprint-assessment, identity-correlation, serverless-edge-recon |
| **web** | Web app vulns (XSS, SQLi, SSRF, smuggling, auth) | `sqlmap`, `dalfox`, `ffuf`, `nuclei`, `nikto`, ZAP, Burp, `wpscan` | wordpress-attack-tree, http-smuggling-cache-poisoning, headless-browser-validation, waf-detection, oob-verification |
| **api** | REST/GraphQL/SOAP, JWT, IDOR, mass assignment | `postman` CLI, GraphQL introspection, `jwt_tool`, `arjun` | bug-bounty-validation, oob-verification, statistical-verification |
| **network** | SMB/SSH/FTP/RDP, service exploitation, traffic | `smbclient`, `evil-winrm`, `responder`, `crackmapexec`, `wireshark` | exploit-validation |
| **exploit** | Controlled PoC on validated findings | `sqlmap`, `msfconsole`, `msfvenom`, `searchsploit`, `pwntools`, `commix` | exploit-validation, statistical-verification, oob-verification |
| **privilege-escalation** | Post-access escalation, container escape | `linpeas`, `winpeas`, `pspy`, GTFOBins, `peirates`, `kdigger`, `amicontained`, `deepce`, `bloodyAD` | post-exploitation-plan |
| **lateral-movement** | Multi-host pivoting, credential reuse, tunnels | `crackmapexec`, `evil-winrm`, `chisel`, `proxychains`, SOCKS pivots | post-exploitation-plan, attack-path-analysis |
| **ad** | Active Directory enumeration + Kerberos/ADCS/NTLM attacks | `bloodhound`, `kerbrute`, `impacket-*`, `certipy`, `rubeus`, `adidnsdump`, `mitm6`, `Coercer`, `bloodyAD` | post-exploitation-plan, attack-path-analysis |
| **wifi** | 802.11, WPA/WPA2/WPA3, evil-twin | `airodump`, `hcxdumptool`, `hashcat -m 22000`, `hostapd-wpe`, `eaphammer` | wifi-assessment |
| **mobile** | Android/iOS APK/IPA static + dynamic | `jadx`, `apktool`, `frida`, `objection`, `mitmproxy`, MobSF, `drozer`, `apkleaks` | mobile-app-testing |
| **binary** | RE, CTF pwn, ROP/heap/format-string | `checksec`, `ghidra`, `radare2`, `gdb`, `pwntools`, `ROPgadget`, `one_gadget`, `angr` | binary-exploitation |
| **forensics** | DFIR triage, memory/disk/log analysis, malware ID | `volatility3`, `sleuthkit`, `MVT`, `plaso`, `autopsy`, `yara`, `capa` | dfir-triage, threat-intel-enrichment |
| **code-audit** | Static SAST, secret scan, dependency CVE, IaC | `semgrep`, `gitleaks`, `npm audit`, `govulncheck`, `checkov`, `trivy` | code-audit-review |
| **retest** | Reproduce findings, validate fixes | Replays from evidence ledger; `nr_validate_finding` | exploit-validation |
| **evidence** | Chain-of-custody curator | SHA-256 hash chain, JSONL ledger, PII redactor, artifact normalization | evidence-capture |
| **reporting** | Final report, exec summary, exports | Markdown, designed HTML, SARIF 2.1, STIX 2.1, MISP, MITRE coverage | report-generation |

*Each specialist has a scoped tool allowlist enforced by the harness. Compressed-output discipline applies to all internal reasoning except `engagement-lead` (operator-facing) and `reporting-specialist` (customer-facing).*

The harness records a scope envelope; it does not waste turns asking whether the operator owns the target. Legal authorization is assumed to live in the external assessment contract. Net-Runner enforces practical runtime boundaries instead: recorded targets, max impact, restrictions, guardrail review for risky actions, and evidence validation status.

## MCP Tools (`nr_*`)

`nr_exec` · `nr_engagement_init` · `nr_engagement_status` · `nr_scope_check` · `nr_save_finding` · `nr_save_note` · `nr_list_evidence` · `nr_discover` · `nr_tool_help` · `nr_kg_query` · `nr_verify_evidence` · `nr_validate_finding` · `nr_coverage_status` · `nr_export_report`

## Reports

Reports are generated from the append-only evidence ledger, not from chat transcripts. Findings are labeled `Validated`, `Unvalidated`, `Inconclusive`, or `Disputed` based on typed validation entries such as replay, statistical, OOB, or artifact-review validation. Analyst confidence and operator wording do not mark a finding confirmed.

The reporting specialist produces client-ready Markdown and HTML reports with severity summaries, evidence-backed findings, remediation guidance, retest criteria, compliance mappings, and MITRE ATT&CK coverage.

```bash
/report latest          # .netrunner/reports/latest.md
/report --html latest   # .netrunner/reports/latest.html
/report --all latest    # markdown + html
```

Through MCP, use `nr_export_report` with `format=markdown`, `format=html`, `format=sarif`, `format=stix`, or `format=misp`.

---

## Engagement Lifecycle

1. Describe target and goal in plain English
2. `.netrunner/` project folder created with scope envelope, impact boundary, and run state
3. Matching workflow loaded with specialist agents, role contracts, and prior session memory
4. Tools run autonomously — scope-checked before each risky action
5. Evidence, findings, validation entries, artefacts, and reports saved throughout; intelligence state persisted to `.netrunner/intelligence-state.json`

---

## Camofox Browser

Optional stealth-browser backend — Firefox patched at C++ level for anti-bot bypass, used by the headless-browser-validation skill.

**Upstream:** [https://github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser)

```bash
bun run setup:camofox          # probes the endpoint, prints setup steps if down
```

The probe is non-blocking and never fails the build. If `CAMOFOX_URL` is unreachable, the validation skill falls back to local Playwright or headless Chromium automatically. Override with `CAMOFOX_URL=http://host:port` if you run it elsewhere.

---

## Provenance

Built on [OpenClaude](https://github.com/Gitlawb/openclaude). All red-team features are Net-Runner additions. See `docs/project/` for research and provenance notes.

For a blunt engineering assessment of harness strengths, limits, and current proof contract, see `docs/project/harness-assessment.md`.

**Docs:** [Workflows](docs/workflows/overview.md) · [APT Simulation](docs/apt-simulation/README.md) · [Intelligence Engine](docs/intelligence-engine/README.md) · [MCP Integration](docs/mcp-integration/README.md) · [Skills-First Architecture](docs/capabilities/skills-first-architecture.md)

---

## Contributing

Issues and PRs welcome. Keep changes scoped; run `bun run typecheck` before submitting.

## License

Educational use and authorised security testing only.
