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

- **Workflows** — 12 predefined testing pipelines (web app, AD, cloud, mobile, WiFi, code audit, DFIR, adversary emulation, CTF) with scope guardrails built in
- **Specialist agent teams** — 6 agents with distinct role policies that route work between themselves without round-tripping every decision through a lead
- **Evidence chain** — append-only JSONL ledger with SHA-256 hash chaining, PII redaction, and replay-based finding validation
- **Curated exploit arsenal** — 32 exploit leads across Windows, Linux, AD, and web-appliance surfaces, tracked in YAML and cross-referenced by CVE
- **Intelligence runtime** — WAF detection, tool failure classification, Knowledge Graph entity tracking, MCTS attack-path planning, statistical/OOB blind-finding verification
- **LLM-as-retriever memory** — auto-persistent agent memory with relevance-based prefetch, no vector database required
- **Optional MCP packs** — drive Ghidra, Burp Suite, Binary Ninja, or a remote Windows host through the same agent loop

All findings, artifacts, guardrail decisions, and agent execution steps are recorded in the evidence ledger. Reports export as Markdown, HTML, SARIF 2.1, STIX 2.1, or MISP.

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

6 agents share the full 266-tool surface with curated skill packs. They communicate directly through the Agent SDK channel — no round-tripping every decision through the Lead.

<div align="center">
<table>
<tr>
<td width="33%" valign="top">

<p align="center"><b>🎯 Lead</b><br><sub><i>Engagement orchestration</i></sub></p>

- Phase coordination & task routing
- Scope & impact guardrails
- Knowledge Graph queries
- MCTS attack-path planning
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
- Android/iOS static & dynamic analysis

</td>
</tr>
</table>
<table>
<tr>
<td width="33%" valign="top">

<p align="center"><b>⚔️ Infra</b><br><sub><i>Network, AD, cloud & C2</i></sub></p>

- Service exploitation & privesc
- AD (Kerberos, ADCS, BloodHound, Impacket)
- Cloud attack paths (AWS/Azure/K8s)
- C2 ops (Sliver, Mythic)
- Binary exploitation & RE

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
- SHA-256 evidence verification
- Finding replay validation
- CVSS/SSVC/MITRE ATT&CK mapping
- SARIF/STIX/MISP report export

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

Each workflow defines its capability packs, default skills, and specialist agent assignments. Switching workflows mid-engagement is a planned feature.

## Skills

32 code-defined skills + 83 filesystem skills across 6 namespaces (appsec, forensics, infra, lead, recon, reporting) = **115 composable skills**. Skills are registered in `src/security/skillDefinitions.ts` and auto-discovered from `.netrunner/skills/<namespace>/`.

### Code-backed skills (32)

| Domain | Skills |
|--------|--------|
| **Engagement** | `engagement-setup` · `scope-guard` · `evidence-capture` · `report-generation` · `caveman-harness` |
| **Recon** | `recon-plan` · `target-fingerprinting` · `digital-footprint-assessment` · `identity-correlation` · `threat-intel-enrichment` · `wifi-assessment` |
| **Vulnerability** | `vuln-assessment` · `exploit-validation` · `oob-verification` · `statistical-verification` · `waf-detection` · `feedback-loop` · `headless-browser-validation` · `bug-bounty-validation` |
| **Post-exploit** | `post-exploitation-plan` · `attack-path-analysis` · `mcts-planning` | 
| **C2** | `c2-infrastructure` · `c2-operations` |
| **Simulation** | `apt-simulation` |
| **DFIR** | `dfir-triage` · `code-audit-review` |
| **Specialist** | `mobile-app-testing` · `binary-exploitation` · `wordpress-attack-tree` · `http-smuggling-cache-poisoning` · `serverless-edge-recon` |

### Filesystem skills (83)

| Namespace | Count | Examples |
|-----------|-------|---------|
| `appsec` | 22 | XSS, SQLi, IDOR, JWT, SSRF, XXE, SSTI, deserialization, NoSQLi, race conditions, CORS, GraphQL, API testing, forced browsing, directory traversal, mobile cert pinning, Android static analysis, business logic, open redirect |
| `forensics` | 18 | Memory forensics (Volatility3), disk forensics, network forensics (Wireshark), Windows EVTX (Chainsaw, Hayabusa, Eric Zimmerman), Linux log forensics, malware triage (YARA), file carving (Foremost), firmware extraction (Binwalk), secret scanning (Gitleaks), SAST (Semgrep), container scanning (Trivy), Android malware RE (JADX), PowerShell deobfuscation, IOC extraction, SBOM analysis, timeline reconstruction (Plaso) |
| `infra` | 26 | BOAZ evasive loaders, gocheck AMSI bypass, MultCheck multi-engine AV scan, Metasploit, BloodHound, Certipy AD CS, noPac, Zerologon, EternalBlue, DCSync, pass-the-ticket, constrained delegation, Kerberoasting, SMB exploitation, WMI lateral movement, Evilginx3 phishing, cloud Pacu, hashcat, Lazagne credential access, Linux privesc, Kubernetes pentest, network nmap, Ghidra RE, CVE intel, internal network pentest, spearphishing |
| `lead` | 5 | Full-scope red-team engagement, engagement planning, MITRE ATT&CK mapping, purple-team exercise, Atomic Red Team |
| `recon` | 13 | OSINT, SpiderFoot, subdomain enumeration (Subfinder), DNS zone transfer, Shodan, AWS ScoutSuite, CloudMapper, Cartography, IoT assessment, Bluetooth assessment, darkweb monitoring, dnstwist typosquatting, wireless Kismet |
| `reporting` | 8 | Threat-intel reports, CVSS scoring, SSVC triage, EPSS prioritization, KEV catalog prioritization, MITRE coverage mapping, asset criticality scoring, web vuln triage |

## Exploit arsenal

Curated CVE index at `.netrunner/arsenal/index/*.yaml` — **32 exploit leads** across 4 attack surfaces. Agents match fingerprinted targets against the index before re-deriving exploits. Validated exploits persist to `discovered.jsonl` for cross-engagement reuse.

Arsenal entries are **unvalidated leads** (PoC references, not automated exploits). Each has an adapter type (`metasploit`, `nuclei`, `manual`, `custom-script`), reliability estimate, and CVE reference where applicable. The infra specialist runs them under scope guardrails with human-in-the-loop for high-impact actions.

| Surface | Count | Notable entries |
|---------|-------|-----------------|
| **Windows** | 9 | BlueHammer (Defender RPC), RedSun (LPE), YellowKey (BitLocker), MiniPlasma (CVE-2020-17103), CLFS LPE (CVE-2023-28252), SmartScreen bypass (CVE-2024-21412), defendnot (WSC fake-AV disables Defender), undefend (Defender DoS) |
| **Active Directory** | 6 | Zerologon (CVE-2020-1472), noPac (CVE-2021-42278/42287), Certifried (CVE-2022-26923), PetitPotam (CVE-2021-36942), PrintNightmare (CVE-2021-34527), AD CS ESC1-ESC16 |
| **Linux** | 5 | PwnKit (CVE-2021-4034), Dirty Pipe (CVE-2022-0847), Looney Tunables (CVE-2023-4911), nf_tables LPE (CVE-2024-1086), Baron Samedit (CVE-2021-3156) |
| **Web & Appliance** | 17 | Log4Shell, Citrix Bleed, MOVEit SQLi, PAN-OS, ScreenConnect, ActiveMQ RCE, Spring4Shell, ProxyLogon/Shell/NotShell, F5 BIG-IP, Confluence, Veeam, Ivanti, FortiOS, GitLab, vCenter, Next.js middleware bypass |

## Tool catalog

**266 catalogued entries** in total across 16 categories:

| Category | Count | Notable tools |
|----------|-------|--------------|
| Active Directory | 15 | Certipy, BloodHound, Mimikatz, Rubeus, Impacket suite, Evil-WinRM, Kerbrute, CrackMapExec, mitm6, Coercer |
| API | 12 | GraphQL scanner, JWT tool, Schemathesis fuzzer, RESTler, Kiterunner, InQL |
| Binary | 22 | Ghidra, radare2, GDB, pwntools, angr, ROPgadget, Volatility3, Binwalk |
| Cloud | 17 | Trivy, Prowler, ScoutSuite, Pacu, kube-hunter, Peirates, CloudMapper |
| Code Audit | 14 | Semgrep, CodeQL, Bandit, gitleaks, Checkov, tfsec, Dependency-Check, Govulncheck |
| Coordination | 2 | Sliver C2, Mythic C2 |
| Evidence | 5 | ExifTool, bulk-extractor, StegSolve, OutGuess, TestDisk |
| Exploitation | 14 | Metasploit, MSFVenom, SearchSploit, Hydra, Hashcat, John, WinPEAS, LinPEAS |
| Forensics | 13 | Volatility3, Plaso, KAPE, Chainsaw, Hayabusa, Velociraptor, YARA, capa |
| Lateral Movement | 10 | BloodHound, NetExec, Evil-WinRM, Impacket PSExec/WMIExec/ATExec/DCOMExec, Chisel, Ligolo-ng, sshuttle |
| Mobile | 8 | ADB, APKTool, JADX, Frida, Objection, MobSF, Drozer |
| Network | 13 | Masscan, RustScan, Responder, enum4linux, SMBMap, Wireshark, tcpdump |
| Recon | 34 | Nmap, Amass, Subfinder, theHarvester, SpiderFoot, BBOT, Shodan, Maltego, trufflehog |
| Threat Intel | 8 | GreyNoise, VirusTotal, urlscan, Censys, MISP, OpenCTI, Mihari |
| Web | 28 | Nuclei, FFUF, SQLMap, Gobuster, Katana, Httpx, WPScan, Dalfox, TestSSL |
| WiFi | 13 | Aircrack-ng, Bettercap, Wifite, EAPHammer, Kismet, MDK4 |

60% of the catalog maps to MITRE ATT&CK techniques. Tools run through `nr_exec` (shell) — not as individual MCP tool definitions. `bun run tools:check` / `bun run tools:install` for readiness.

## Evasion & EDR testing

Dedicated skills for testing payloads against endpoint defenses. These are **manually validated PoCs and technique references** in the arsenal — not automated production bypasses.

- **defendnot** — Registers a fake AV via the undocumented WSC API, causing Windows Defender to stand down. Pairs with payload staging.
- **undefend** — Crashes the Windows Defender service (windefend) via RPC.
- **BlueHammer** — Targets the Windows Defender (windefend) RPC interface.
- **SmartScreen bypass (CVE-2024-21412)** — CISA KEV. Bypasses Mark-of-the-Web via `.url` files for phishing initial access.
- **BOAZ evasive loaders** (infra skill) — Multi-layered AV/EDR-evasion shellcode loaders with LLVM obfuscation, proxy syscalls, sleep masking, UUID/MAC/IPv4/XOR/RC4/AES/DES encoders.
- **gocheck** (infra skill) — Binary-search payloads for exact bytes triggering Defender/AMSI signatures (modern Go reimplementation of ThreatCheck).
- **MultCheck** (infra skill) — Batch multi-engine AV scanning (ESET, Sophos, CrowdStrike, SentinelOne, Bitdefender, Kaspersky, Trend Micro, McAfee, Symantec) — locally, never uploads to VirusTotal.
- **WAF detection** — Fingerprints 11 WAF vendors (Cloudflare, Akamai, Imperva, F5, ModSecurity, AWS WAF, Azure Front Door, Sucuri, Barracuda, Citrix, Fortinet) with tailored bypass strategies per vendor.
- **Feedback loop** — Automated payload mutation history (encoding, headers, delays, protocols) per target with adaptive retry.

> **Note:** The PowerShell security layer (`powershellSecurity.ts`, 24 AST-based checks) actively **blocks** the techniques commonly used in AV/EDR bypass (encoded commands, download cradles, COM objects, WMI process creation, LOLBAS, UAC bypass) behind permission prompts. This is by design — it's a pentest framework with guardrails, not an auto-exploit platform.

## C2 operations

Full command-and-control workflows with guardrails, blocked by default unless the engagement authorises adversary emulation.

- **C2 infrastructure** — Redirector/fronting setup, listener transports (mTLS, WireGuard, HTTPS, DNS), domain approval, profile config, payload generation (Sliver, Mythic), teardown checkpoints
- **C2 operations** — Payload staging, listener lifecycle, callback handling, pivot enablement, operator role separation (operator/lead/spectator)
- **Capabilities:** `command-and-control-session`, `c2-redirector-fronting`, `c2-implant-generation`, `c2-beacon-operations`
- **Tooling:** Sliver C2 (`sliver-client`), Mythic C2 (`mythic-cli`) — both checked via `command -v` before use, both available as optional MCP integrations

## APT simulation

40 APT group profiles with full TTP mappings, 10 simulation workflows with phase-by-phase LLM injection guidance, and a 1,087-line MITRE ATT&CK technique reference library covering ~150 techniques across 14 tactic categories.

Groups by attribution: Russia (4), China (10), North Korea (5), Iran (6), Other (3), Cybercrime (7). `/apt-simulation <group> against <industry>` to launch.

Attack chains mapped per group with assigned specialist agents: APT29 (government cloud espionage), APT28 (credential harvesting), Volt Typhoon (critical infrastructure, living-off-the-land), Sandworm (ICS/OT destructive), APT38 (financial SWIFT), Scattered Spider (identity-centric cloud), Salt Typhoon (telecom), Silk Typhoon (supply chain), Lazarus (healthcare ransomware), APT41 (manufacturing IP theft).

## Intelligence engine

The intelligence runtime is the middleware that turns raw tool output into structured operations. It runs within active engagements and persists state to `.netrunner/intelligence-state.json`.

| Component | What it does | Implementation |
|-----------|-------------|----------------|
| **Knowledge Graph** | In-memory entity/relation graph (host, service, vuln, credential, etc.) from evidence. 10K-entity LRU eviction. BFS shortest-path queries. | `src/security/knowledgeGraph.ts` (479 lines) |
| **MCTS Planner** | Monte Carlo Tree Search with UCB1 exploration. 500 iterations by default. Seeds attack state from Knowledge Graph. Ranks next actions grouped by specialist agent. | `src/security/mctsPlanner.ts` (723 lines) |
| **WAF Detection** | Fingerprints 11 WAF vendors from HTTP response headers, body, cookies, and status codes. Regex-scored confidence system. Maps bypass strategies per vendor. | `src/security/wafDetection.ts` (225 lines) |
| **Failure Classification** | 17 failure categories (WAF-blocked, rate-limited, timeout, etc.). Priority-ordered pattern matching. Payload mutation strategies with exponential backoff. | `src/security/feedbackEngine.ts` (380 lines) |
| **Statistical Verifier** | Welch's t-test for blind injection confirmation. Time-based and response-length differential analysis. Normal CDF with Abramowitz & Stegun approximation. | `src/security/statisticalVerifier.ts` (185 lines) |
| **OOB Verification** | Payload generation for 8 blind vulnerability types across 5 channels (HTTP, DNS, SMTP, FTP, LDAP). Interact.sh callback tracking. | `src/security/oobVerification.ts` (240 lines) |
| **Blind Finding Gate** | Regex-based gate that flags blind injection findings (blind SQLi, time-based, OOB, Log4Shell) needing verification before promotion. | `src/security/intelligenceMiddleware.ts` |

All middleware wired through `src/security/runtimeIntegration.ts` (the single public seam), gated by engagement manifest existence.

## Memory & RAG

Persistent auto-memory system using file-based, LLM-driven retrieval — no vector database required.

**Four-type taxonomy:** `user` (role/preferences), `feedback` (guidance), `project` (goals/work), `reference` (external pointers)

**LLM-as-retriever pipeline:**
1. Memory directory scanned for `.md` files with YAML frontmatter (name, description, type)
2. Sonnet side-query selects up to 5 most relevant files from the manifest
3. Selected files read (200-line, 4KB cap each), deduplicated against files the model already accessed
4. Injected as `<system-reminder>` attachment messages — non-blocking, async prefetch

**Safety net:** Background extraction subagent (`extractMemories.ts`) runs at the end of each turn as a forked agent with prompt-cache sharing. Only permitted to write to the auto-memory directory.

**Team memory** (`feature('TEAMMEM')`) optional syncs memory to a server API with two-pass path validation (string-level + symlink-resolved) preventing traversal attacks.

Auto-memory ON by default. Disable with `NET_RUNNER_DISABLE_AUTO_MEMORY=1`.

## Evidence & reporting

Findings start **Unvalidated**. Validation methods: command replay, statistical verification (Welch's t-test), OOB callback confirmation, or artifact review. Reports label findings `Validated` / `Unvalidated` / `Inconclusive` / `Disputed`.

**Evidence ledger** — append-only JSONL at `.netrunner/evidence/ledger.jsonl`. Every entry is SHA-256 hashed and chained to the previous entry's hash. PII redaction (email, phone, IP, JWT, AWS key, GitHub PAT, bearer token, private key) applied by default.

**8 entry types:** `session_start/end` · `finding` · `validation` · `note` · `artifact` · `guardrail` · `approval` · `execution_step`

**Validation:** `nr_validate_finding` re-executes the original proof command and diffs output. `nr_verify_evidence` validates the full hash chain.

**Report formats:**
- Markdown (editable source) and HTML (executive delivery) — executive summary, severity dashboard, attack-path narrative, finding cards, remediation backlog, MITRE coverage, guardrail decisions
- SARIF 2.1 (SAST tool interchange)
- STIX 2.1 (threat intelligence sharing)
- MISP event JSON

## MCP surface

16 `nr_*` tools exposed to external MCP clients. All 266 catalogued tools run through `nr_exec` (shell) — the MCP surface stays minimal by design.

`nr_exec` · `nr_engagement_init` · `nr_engagement_status` · `nr_scope_check` · `nr_save_finding` · `nr_save_note` · `nr_list_evidence` · `nr_discover` · `nr_tool_help` · `nr_tool_install` · `nr_kg_query` · `nr_verify_evidence` · `nr_validate_finding` · `nr_coverage_status` · `nr_export_report` · `nr_arsenal_lookup`

Optional sandboxed execution via `NETRUNNER_EXEC_SANDBOX=docker` (Kali Linux container, `--cap-drop ALL`, `--network none` by default).

## Optional MCP packs

Extend the harness with specialised MCP servers. Enable via `bun run mcp:packs enable <id>`.

| Pack | Environment | Purpose |
|------|-------------|---------|
| **Ghidra MCP** | Any | Drive Ghidra RE — decompilation, call graphs, P-code emulation, debugger |
| **Binary Ninja MCP** | Any | Alternative RE (requires licensed Binary Ninja) |
| **Burp Suite MCP** | Kali | Web proxy automation via official PortSwigger MCP BApp |
| **Windows MCP** | Windows | Agentic Windows control — file nav, app control, GUI interaction, screen capture. Run Windows-locked tools, AD tradecraft, payload prep against Defender on a Windows host or detonation VM |

The Windows MCP pack connects to a remote Windows box where the agent can run tools with no Linux build. It's not a bypass mechanism — the agent still goes through PowerShell security gating on the Windows host. It's an access channel, not a magic EDR kill switch.

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

Built on [OpenClaude](https://github.com/Gitlawb/openclaude). Docs: [Workflows](docs/workflows/overview.md) · [Intelligence Engine](docs/intelligence-engine/README.md) · [MCP Integration](docs/mcp-integration/README.md) · [Customization](docs/customization/README.md) · [APT Simulation](docs/apt-simulation/README.md)

## License

Educational use and authorised security testing only.
