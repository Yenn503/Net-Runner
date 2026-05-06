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

<sub>6 specialist agents · 228 cataloged tools · 279 capabilities · 32 skills · 12 workflows · 21 capability packs · 10 APT simulations</sub>

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
- **6 specialist agents** — engagement lead, recon (+ wifi), app-testing (web + API + mobile), infra (network + exploit + privesc + lateral + AD + binary), code-forensics (SAST + DFIR), evidence-reporting (evidence + retest + reports)
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

| Agent | Domain | Tool chain | Skills |
|---|---|---|---|
| **engagement-lead** | Coordinates phases, routes specialists, queries KG before discovery, maintains scope discipline | Agent routing, `nr_kg_query`, `nr_scope_check`, MCTS planner | engagement-setup, scope-guard, attack-path-analysis, mcts-planning |
| **recon-specialist** | Target discovery, DNS/OSINT/surface mapping, 802.11 wireless (AP discovery, PMKID/handshake capture, offline cracking, evil-twin) | `nmap`, `masscan`, `rustscan`, `subfinder`, `amass`, `bbot`, `httpx`, `katana`, `theHarvester`, `sherlock`, `maigret`, `airodump-ng`, `hcxdumptool`, `hashcat -m 22000`, `hostapd-wpe`, `eaphammer` | recon-plan, target-fingerprinting, digital-footprint-assessment, identity-correlation, serverless-edge-recon, wifi-assessment |
| **app-testing-specialist** | Web (XSS, SQLi, SSRF, smuggling, auth bypass), REST/GraphQL/SOAP (JWT, IDOR, mass assignment), Android/iOS (APK/IPA static + dynamic, Frida, SSL unpin) | `sqlmap`, `dalfox`, `ffuf`, `nuclei`, `nikto`, `jwt_tool`, `arjun`, `jadx`, `apktool`, `frida`, `objection`, MobSF, `drozer` | waf-detection, oob-verification, statistical-verification, http-smuggling-cache-poisoning, mobile-app-testing, bug-bounty-validation |
| **infra-specialist** | Network services, exploit validation, Linux/Windows/container/K8s privesc, multi-host lateral movement, Active Directory (Kerberos/ADCS/BloodHound), binary RE + CTF pwn | `nmap`, `netexec`, `impacket-*`, `bloodhound`, `kerbrute`, `certipy`, `linpeas`, `winpeas`, `peirates`, `kdigger`, `chisel`, `checksec`, `ghidra`, `gdb`, `pwntools`, `ROPgadget` | exploit-validation, post-exploitation-plan, attack-path-analysis, binary-exploitation |
| **code-forensics-specialist** | SAST (semgrep/bandit/gosec), secret scanning (gitleaks), dependency CVEs (grype/trivy), IaC (checkov/tfsec), memory/disk forensics (volatility3/sleuthkit), log timelining (chainsaw/hayabusa), IOC extraction | `semgrep`, `gitleaks`, `noseyparker`, `grype`, `trivy`, `checkov`, `volatility3`, `sleuthkit`, `chainsaw`, `hayabusa`, `yara`, `mvt` | code-audit-review, dfir-triage, threat-intel-enrichment |
| **evidence-reporting-specialist** | Chain-of-custody evidence curation, finding retest + remediation validation, polished client-ready reports (Markdown, HTML, SARIF 2.1, STIX 2.1, MISP) | SHA-256 ledger, `nr_save_finding`, `nr_validate_finding`, `nr_export_report`, `nr_verify_evidence`, replay harness | evidence-capture, report-generation |

*Each specialist receives the full toolset. Compressed-output discipline applies to all internal reasoning except `engagement-lead` and `evidence-reporting-specialist` (operator/client-facing output).*

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
