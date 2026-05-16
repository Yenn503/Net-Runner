<div align="center">

<img src=".github/assets/Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runner" width="640" />

**Agentic security-testing runtime** — orchestrate red-team operations through LLM specialist teams with append-only evidence, intelligence-driven decision loops, and a curated exploit arsenal.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![MCP](https://img.shields.io/badge/MCP-7C3AED?style=flat&logo=matrix&logoColor=white)](https://modelcontextprotocol.io)
[![MITRE ATT&CK](https://img.shields.io/badge/MITRE%20ATT%26CK-AA1E22?style=flat&logo=matrix&logoColor=white)](https://attack.mitre.org)
[![OpenClaude](https://img.shields.io/badge/Built%20on-OpenClaude-6366F1?style=flat)](https://github.com/Gitlawb/openclaude)
[![License](https://img.shields.io/badge/Educational%20Use-C8902A?style=flat)](#license)

Run in the terminal · Drive from any MCP client (Claude Code, Cursor, Windsurf, Claude Desktop)

</div>

---

## What is Net-Runners?

A structured security-testing platform built on [OpenClaude](https://github.com/Gitlawb/openclaude). Instead of a free-form LLM chat, you get a full engagement lifecycle with specialist agents, scope guardrails, an append-only evidence chain, and an intelligence engine that learns as it tests.

Three commands to start:

```bash
bun install && bun run build
bun run setup              # interactive provider wizard
bun run dev:profile        # launch with saved profile
```

---

## How it works

```
Describe target + goal → Engagement init creates scope boundary
       ↓
Engagement Lead routes work to specialist agents with role contracts
       ↓
Agents run tools gated by scope checks + guardrails
       ↓
Intelligence middleware: classifies failures, detects WAFs,
syncs to Knowledge Graph, gates blind findings, plans next moves
       ↓
Everything logged to append-only evidence ledger (SHA-256 chained)
       ↓
Reports generated from the ledger — not chat transcripts
```

---

## Specialist agents

Six agents share the full tool surface with curated skill packs. They communicate through the Agent SDK channel — no round-tripping every decision through the Lead.

<div align="center">
<table>
<tr>
<td width="33%"><p align="center"><b>🎯 Engagement Lead</b><br><sub>Orchestration & scope</sub></p>
<p align="center">Phase coordination · Guardrails · KG queries<br>MCTS attack-path planning · Lifecycle mgmt</p></td>
<td width="33%"><p align="center"><b>🛰️ Recon Specialist</b><br><sub>Discovery & OSINT</sub></p>
<p align="center">DNS/subdomain/port scanning · Cloud asset discovery<br>Identity OSINT · Wireless survey · Footprint assessment</p></td>
<td width="33%"><p align="center"><b>🕷️ AppSec Specialist</b><br><sub>Web, API & mobile</sub></p>
<p align="center">XSS, SQLi, SSRF, XXE, IDOR, JWT · Deserialization, SSTI<br>GraphQL/API fuzzing · Mobile cert bypass · Android/iOS RE</p></td>
</tr>
<tr>
<td width="33%"><p align="center"><b>⚔️ Infra Specialist</b><br><sub>Network, AD, cloud & C2</sub></p>
<p align="center">Service exploitation & privesc · AD (Kerberos, ADCS, BloodHound)<br>Cloud attack paths · C2 ops (Sliver, Mythic) · Binary RE</p></td>
<td width="33%"><p align="center"><b>🔬 Code & Forensics</b><br><sub>SAST, secrets & DFIR</sub></p>
<p align="center">Semgrep, CodeQL · Secret/dependency scanning<br>IaC misconfigs · Memory/disk forensics · EVTX threat hunting</p></td>
<td width="33%"><p align="center"><b>📋 Evidence & Reporting</b><br><sub>Validation & export</sub></p>
<p align="center">Chain-of-custody · SHA-256 verification · Replay validation<br>CVSS/SSVC/MITRE mapping · SARIF/STIX/MISP export</p></td>
</tr>
</table>
</div>

---

## Workflows

| | Workflow | |
|-|----------|-|
| 🎯 | `web-app-testing` · `api-testing` · `mobile-app-testing` · `ad-testing` · `wifi-testing` · `cloud-assessment` · `lab-target-testing` · `bug-bounty-recon-validation` | Pentest |
| 🔴 | `adversary-emulation` (C2 ops, Sliver/Mythic) | Red Team |
| 🔵 | `dfir-incident-response` · `code-audit-review` | Blue Team |
| 🏁 | `ctf-mode` | CTF |

Each workflow pre-configures its capability packs, default skills, and specialist agent assignments. `/engagement init <workflow> <target>` to start.

---

## Exploit arsenal

`.netrunner/arsenal/index/*.yaml` — **32 curated exploit leads** across 4 surfaces. Agents match fingerprinted targets against the index before re-deriving exploits. Validated exploits persist to `discovered.jsonl` for reuse.

Arsenal entries are **unvalidated leads** (PoC references, not automated exploits) with adapter types, reliability estimates, and CVE cross-references.

| Surface | Count | Notable entries |
|---------|-------|-----------------|
| **Windows** | 9 | BlueHammer (Defender RPC) · RedSun (LPE) · YellowKey (BitLocker) · CLFS LPE (CVE-2023-28252) · SmartScreen bypass (CVE-2024-21412) · defendnot · undefend |
| **Active Directory** | 6 | Zerologon · noPac · Certifried · PetitPotam · PrintNightmare · AD CS ESC1–ESC16 |
| **Linux** | 5 | PwnKit · Dirty Pipe · Looney Tunables · nf_tables LPE · Baron Samedit |
| **Web & Appliance** | 17 | Log4Shell · Citrix Bleed · MOVEit SQLi · PAN-OS · ScreenConnect · ActiveMQ RCE · Spring4Shell · ProxyLogon/Shell/NotShell · Confluence · Veeam · Ivanti · FortiOS · vCenter · Next.js middleware bypass |

<details>
<summary><b>Tool catalog</b> — 266 entries, 16 categories, 60% mapped to MITRE ATT&CK</summary>

| Category | Count | Notable |
|----------|-------|---------|
| Active Directory | 15 | Certipy, BloodHound, Mimikatz, Rubeus, Impacket, CrackMapExec |
| API | 12 | GraphQL scanner, Schemathesis, RESTler, Kiterunner, InQL |
| Binary | 22 | Ghidra, radare2, GDB, pwntools, angr, Volatility3, Binwalk |
| Cloud | 17 | Trivy, Prowler, ScoutSuite, Pacu, kube-hunter, Peirates |
| Code Audit | 14 | Semgrep, CodeQL, gitleaks, Checkov, tfsec, Dependency-Check |
| Coordination | 2 | Sliver C2, Mythic C2 |
| Evidence | 5 | ExifTool, bulk-extractor, StegSolve, OutGuess, TestDisk |
| Exploitation | 14 | Metasploit, MSFVenom, SearchSploit, Hydra, Hashcat, WinPEAS, LinPEAS |
| Forensics | 13 | Plaso, KAPE, Chainsaw, Hayabusa, Velociraptor, YARA, capa |
| Lateral Movement | 10 | NetExec, Evil-WinRM, Impacket suite, Chisel, Ligolo-ng, sshuttle |
| Mobile | 8 | ADB, APKTool, JADX, Frida, Objection, MobSF, Drozer |
| Network | 13 | Masscan, RustScan, Responder, enum4linux, Wireshark, tcpdump |
| Recon | 34 | Nmap, Amass, Subfinder, theHarvester, SpiderFoot, BBOT, Shodan |
| Threat Intel | 8 | GreyNoise, VirusTotal, Censys, MISP, OpenCTI, Mihari |
| Web | 28 | Nuclei, FFUF, SQLMap, Gobuster, Katana, Httpx, WPScan, Dalfox |
| WiFi | 13 | Aircrack-ng, Bettercap, Wifite, EAPHammer, Kismet, MDK4 |

`bun run tools:check` / `bun run tools:install` for readiness. Tools run through `nr_exec` (single shell surface) — not individual MCP tool definitions.
</details>

<details>
<summary><b>Skills</b> — 115 composable plays across 6 namespaces</summary>

32 code-defined + 83 filesystem skills. Registered in `src/security/skillDefinitions.ts`, auto-discovered from `.netrunner/skills/<namespace>/`.

| Domain | Code-backed skills |
|--------|-------------------|
| **Engagement** | `engagement-setup` · `scope-guard` · `evidence-capture` · `report-generation` · `caveman-harness` |
| **Recon** | `recon-plan` · `target-fingerprinting` · `digital-footprint-assessment` · `identity-correlation` · `threat-intel-enrichment` · `wifi-assessment` |
| **Vulnerability** | `vuln-assessment` · `exploit-validation` · `oob-verification` · `statistical-verification` · `waf-detection` · `feedback-loop` · `headless-browser-validation` · `bug-bounty-validation` |
| **Post-exploit** | `post-exploitation-plan` · `attack-path-analysis` · `mcts-planning` |
| **C2** | `c2-infrastructure` · `c2-operations` |
| **Simulation** | `apt-simulation` |
| **DFIR** | `dfir-triage` · `code-audit-review` |
| **Specialist** | `mobile-app-testing` · `binary-exploitation` · `wordpress-attack-tree` · `http-smuggling-cache-poisoning` · `serverless-edge-recon` |

| Namespace | Count | Coverage |
|-----------|-------|----------|
| `appsec` | 22 files | XSS, SQLi, IDOR, JWT, SSRF, XXE, deserialization, NoSQLi, race conditions, CORS, GraphQL, forced browsing, directory traversal, mobile cert pinning, business logic, open redirect |
| `forensics` | 18 files | Memory/disk/network forensics, EVTX hunting, malware triage (YARA), file carving, firmware extraction, secret scanning, SAST, container scanning, Android RE, PowerShell deobfuscation, IOC extraction, SBOM, timeline reconstruction |
| `infra` | 26 files | Evasive loaders, AMSI bypass, multi-engine AV scan, Metasploit, BloodHound, AD CS, noPac, Zerologon, EternalBlue, DCSync, pass-the-ticket, Kerberoasting, Evilginx3, cloud Pacu, hashcat, Lazagne, Linux privesc, K8s pentest, Ghidra RE, CVE intel, spearphishing |
| `lead` | 5 files | Full-scope red-team engagement, engagement planning, MITRE mapping, purple-team, Atomic Red Team |
| `recon` | 13 files | OSINT, SpiderFoot, Subfinder, DNS zone transfer, Shodan, ScoutSuite, CloudMapper, IoT/BT assessment, darkweb monitoring, dnstwist, Kismet |
| `reporting` | 8 files | Threat-intel reports, CVSS/SSVC/EPSS/KEV scoring, MITRE coverage, asset criticality, web vuln triage |

</details>

---

## Intelligence engine

The runtime middleware that turns raw tool output into structured operations. Runs within active engagements, persists to `.netrunner/intelligence-state.json`.

| Component | What it does | Size |
|-----------|-------------|------|
| **Knowledge Graph** | In-memory entity/relation graph (hosts, services, vulns, creds) from evidence. 10K-entity LRU eviction, BFS shortest path. | 479 lines |
| **MCTS Planner** | Monte Carlo Tree Search with UCB1 exploration (500 iterations). Seeds from KG state, ranks next actions per specialist. | 723 lines |
| **WAF Detection** | Fingerprints 11 WAF vendors from HTTP headers/body/cookies/status codes. Per-vendor bypass strategy mapping. | 225 lines |
| **Failure Classification** | 17 failure categories (WAF, rate-limit, timeout…). Priority-ordered pattern matching, payload mutation with exponential backoff. | 380 lines |
| **Statistical Verifier** | Welch's t-test for blind injection. Time/response-length differential analysis. Abramowitz & Stegun normal CDF. | 185 lines |
| **OOB Verification** | 8 blind vuln types × 5 channels (HTTP, DNS, SMTP, FTP, LDAP). Interact.sh callback tracking. | 240 lines |

---

## Memory & RAG

File-based, LLM-driven retrieval — no vector database required.

**Four-type taxonomy:** `user` (preferences) · `feedback` (guidance) · `project` (goals) · `reference` (external pointers)

**Pipeline:** Scan memdir → Sonnet side-query selects ≤5 relevant files → Read + deduplicate → Inject as `<system-reminder>` attachments

Background extraction subagent runs each turn (prompt-cache shared), writes to auto-memory directory only.

`feature('TEAMMEM')` optional team sync with two-pass path validation (string + symlink-resolved) preventing traversal.

Auto-memory ON by default. `NET_RUNNER_DISABLE_AUTO_MEMORY=1` to disable.

---

## Evasion & EDR testing

<details>
<summary>Dedicated skills for testing payloads against endpoint defenses — manually validated PoCs, not automated bypasses</summary>

| Technique | What it does |
|-----------|-------------|
| **defendnot** | Registers fake AV via undocumented WSC API, causing Defender to stand down |
| **undefend** | Crashes Windows Defender service (windefend) via RPC |
| **BlueHammer** | Targets the Windows Defender (windefend) RPC interface |
| **SmartScreen bypass** (CVE-2024-21412) | CISA KEV. Bypasses MotW via `.url` files for phishing |
| **BOAZ evasive loaders** | Multi-layered AV/EDR-evasion shellcode loaders — LLVM obfuscation, proxy syscalls, sleep masking, multi-format encoders |
| **gocheck** | Binary-search payloads for exact bytes triggering Defender/AMSI signatures (Go ThreatCheck reimplementation) |
| **MultCheck** | Batch multi-engine AV scan (ESET, Sophos, CrowdStrike, SentinelOne, Bitdefender, Kaspersky, Trend Micro, McAfee, Symantec) — local only |
| **WAF detection** | 11 vendor fingerprints with tailored bypass strategies per vendor |
| **Feedback loop** | Automated payload mutation history per target with adaptive retry |

> **Note:** The PowerShell security layer (`powershellSecurity.ts`, 24 AST-based checks) blocks the techniques commonly used in AV/EDR bypass (encoded commands, download cradles, COM objects, WMI process creation, LOLBAS, UAC bypass) behind permission prompts. This is a pentest framework with guardrails, not an auto-exploit platform.

</details>

---

## C2 operations

Command-and-control workflows gated by engagement authorization. Blocked by default unless the engagement authorizes adversary emulation.

- **Infrastructure** — Redirector setup, listener transports (mTLS, WireGuard, HTTPS, DNS), domain approval, profile config, payload generation (Sliver, Mythic), teardown checkpoints
- **Operations** — Payload staging, listener lifecycle, callback handling, pivot enablement, operator role separation
- **Capabilities:** `command-and-control-session` · `c2-redirector-fronting` · `c2-implant-generation` · `c2-beacon-operations`

---

## APT simulation

| Stats | |
|-------|:-|
| Group profiles | 40 (Russia 4 · China 10 · North Korea 5 · Iran 6 · Cybercrime 7 · Other 3) |
| Simulation workflows | 10 with phase-by-phase LLM injection guidance |
| MITRE technique library | 1,087 lines covering ~150 techniques across 14 tactics |

Mapped attack chains per group: APT29 (cloud espionage) · APT28 (credential harvesting) · Volt Typhoon (critical infra, LoTL) · Sandworm (ICS/OT destructive) · APT38 (financial SWIFT) · Scattered Spider (identity-centric) · Salt Typhoon (telecom) · Silk Typhoon (supply chain) · Lazarus (ransomware) · APT41 (IP theft).

`/apt-simulation <group> against <industry>` to launch.

---

## Evidence & reporting

Findings start **Unvalidated**. Validation via command replay, Welch's t-test, OOB callback, or artifact review. Reports label findings `Validated` / `Unvalidated` / `Inconclusive` / `Disputed`.

**Append-only ledger** — `.netrunner/evidence/ledger.jsonl`. Every entry SHA-256 hashed and chained to the previous hash. PII redacted by default (email, phone, IP, JWT, AWS key, GitHub PAT, bearer token, private key).

8 entry types: `session_start/end` · `finding` · `validation` · `note` · `artifact` · `guardrail` · `approval` · `execution_step`

**Export formats:**

| Format | Channel |
|--------|---------|
| Markdown | `/report latest` — editable source |
| HTML | `/report --html latest` — executive delivery |
| SARIF 2.1 | `nr_export_report` — SAST tool interchange |
| STIX 2.1 | `nr_export_report` — threat intel sharing |
| MISP | `nr_export_report` — event JSON |

---

## MCP surface

16 `nr_*` tools. The full 266-tool catalog runs through `nr_exec` (single shell surface) — minimal surface by design.

```
nr_exec · nr_engagement_init · nr_engagement_status · nr_scope_check
nr_save_finding · nr_save_note · nr_list_evidence · nr_discover
nr_tool_help · nr_tool_install · nr_kg_query · nr_verify_evidence
nr_validate_finding · nr_coverage_status · nr_export_report · nr_arsenal_lookup
```

Sandboxed execution via `NETRUNNER_EXEC_SANDBOX=docker` (Kali container, `--cap-drop ALL`, `--network none`).

<details>
<summary><b>Optional MCP packs</b> — extend the harness with specialized servers</summary>

| Pack | Env | Purpose |
|------|-----|---------|
| **Ghidra MCP** | Any | Drive Ghidra RE — decompilation, call graphs, P-code emulation, debugger |
| **Binary Ninja MCP** | Any | Alternative RE (requires licensed BN) |
| **Burp Suite MCP** | Kali | Web proxy automation via official PortSwigger BApp |
| **Windows MCP** | Windows | Agentic Windows control — file nav, app control, GUI, screen capture. Run Windows-locked tools on a host or detonation VM |

`bun run mcp:packs enable <id>`
</details>

<details>
<summary><b>Camofox browser</b> — patched Firefox for anti-bot bypass</summary>

Patched Firefox for anti-bot bypass. Falls back to Playwright/Chromium. `bun run setup:camofox`
</details>

---

## Providers

| Type | Launch |
|------|--------|
| **GitHub Copilot** (OAuth) | `bun run dev:copilot` |
| **OpenAI Codex** (CLI auth) | `bun run dev:codex` |
| **Anthropic** (built-in) | `bun run dev:anthropic` |
| **OpenAI** (API key) | `OPENAI_API_KEY` + `bun run dev:profile` |
| **Gemini** (API key) | `GEMINI_API_KEY` + `bun run dev:profile` |
| **GitHub Models** (token) | `GITHUB_TOKEN` + `bun run dev:profile` |
| **Ollama** (local) | `bun run dev:ollama` |

`bun run setup` — interactive wizard, picks provider, validates token, saves profile.

<details>
<summary>MCP server, Claude Code, and IDE config</summary>

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

**Direct launch**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
node dist/cli.mjs
```
</details>

---

## Documentation

| Topic | Link |
|-------|------|
| Workflows | [docs/workflows/overview.md](docs/workflows/overview.md) |
| Intelligence Engine | [docs/intelligence-engine/README.md](docs/intelligence-engine/README.md) |
| MCP Integration | [docs/mcp-integration/README.md](docs/mcp-integration/README.md) |
| Customization | [docs/customization/README.md](docs/customization/README.md) |
| APT Simulation | [docs/apt-simulation/README.md](docs/apt-simulation/README.md) |

---

## License

Educational use and authorised security testing only. Built on [OpenClaude](https://github.com/Gitlawb/openclaude).
