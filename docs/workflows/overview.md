# Workflow Overview

Net-Runner runs assessments through a project-scoped runtime. Workflow state, guardrails, evidence, findings, and reporting sit inside `.netrunner/`. Persistent memory, session summaries, and optional shared team memory sit outside that project folder and feed context back into later runs.

The strongest supported path in the OSS build is the local workflow runtime. Experimental coordinator-mode and agent-team surfaces still exist, but they should be treated as pilot functionality rather than the default execution path.

That local runtime can be driven in two seamless ways:

- through the Net-Runner CLI with direct provider credentials or local runtimes
- through the Net-Runner CLI with first-party Anthropic account login via the existing `auth login` and `/login` flows when you want CLI OAuth rather than an API key
- through the FastMCP server, where an external MCP client drives the same engagement, evidence, and workflow state through the 14 `nr_*` tools

## Workflow registry

- `web-app-testing`
  Web routes, auth, parameter testing, and web finding validation.
- `api-testing`
  Endpoint discovery, schema-aware checks, auth/state testing, and API findings.
- `mobile-app-testing`
  Android app review and dynamic testing. This workflow now covers static analysis and runtime tooling such as `adb`, `apktool`, `jadx`, `frida`, `objection`, `MobSF`, `drozer`, and `apkleaks`.
- `lab-target-testing`
  HTB-style targets, internal labs, service enumeration, privilege escalation, and lateral movement.
- `adversary-emulation`
  Guarded command-and-control and post-compromise workflow for explicitly authorized adversary-emulation operations.
- `bug-bounty-recon-validation`
  External bug-bounty workflow chaining recon, parameter mining, headless DOM validation, and OOB verification with evidence-tagged findings.
- `ctf-mode`
  Faster challenge-style runs where iteration matters more than formal reporting.
- `ad-testing`
  Active Directory, Kerberos, trust-path, and AD CS testing.
- `wifi-testing`
  Wireless assessments, handshake capture, rogue AP testing, and 802.11 analysis.
- `dfir-incident-response`
  IR triage and forensic investigation: memory/disk/log analysis, IOC enrichment, malware artifact extraction.
- `code-audit-review`
  Static analysis, secret scanning, dependency CVE checks, and IaC misconfiguration audits for source repositories.
- `cloud-assessment`
  Cloud posture for AWS/Azure/GCP/Kubernetes targets. Routes to existing recon, network, and exploit specialists; cloud tooling is shell-driven via the catalog.

## Recon coverage

The recon side now also includes:

- `cloud_enum` for unauthenticated cloud asset enumeration
- `GHunt` for Google account OSINT
- `holehe` for email-to-account mapping
- `haklistgen` for target-derived wordlists
- `Maigret` for scoped username/profile digital-footprint assessment across 3000+ sites with JSON, HTML, and TXT evidence artifacts

These fill gaps that matter in external bug bounty, mobile, and enterprise-target workflows.

## Runtime flow

1. The operator gives a plain-language instruction with a target.
2. Net-Runner initializes `.netrunner/engagement.json` with a scope envelope and impact boundary if needed.
3. The runtime injects workflow, scope, impact, role contracts, and retrieved context into the session.
4. The workflow loads shared base skills such as `/engagement-setup`, `/scope-guard`, `/recon-plan`, `/digital-footprint-assessment`, `/target-fingerprinting`, `/evidence-capture`, `/report-generation`, and `/caveman-harness`, then layers target-specific skills on top.
5. The operator or external MCP client drives execution through the shared harness runtime.
6. The main agent and specialists use built-in tools directly: shell commands, Maigret OSINT, file operations, web requests, MCP resources, and specialist handoffs.
7. Guardrails review or block higher-impact actions.
8. Evidence, artifacts, findings, typed validations, and execution notes are written into the same project state.
9. Runtime intelligence can react to HTTP responses, failures, and blind-finding patterns while the session is still active.
10. Background memory consolidation can update persistent memory between runs.
11. Reports are generated from the evidence chain in `.netrunner/`. Markdown is the editable source path; HTML is the client-ready human report path; SARIF/STIX/MISP are machine exports. Findings are labeled as validated, unvalidated, inconclusive, or disputed.

## Specialist agents

- `engagement-lead`
- `recon-specialist`
- `web-testing-specialist`
- `api-testing-specialist`
- `network-testing-specialist`
- `exploit-specialist`
- `privilege-escalation-specialist`
- `lateral-movement-specialist`
- `ad-specialist`
- `wifi-specialist`
- `mobile-testing-specialist`
- `binary-specialist`
- `forensics-specialist`
- `code-audit-specialist`
- `retest-specialist`
- `evidence-specialist`
- `reporting-specialist`

The reporting specialist owns final report delivery end-to-end. It reads the evidence ledger, correlates artifacts, merges duplicates, frames severity and business impact, and emits polished Markdown/HTML reports with executive dashboard, attack-path narrative, finding cards, remediation backlog, compliance mapping, MITRE coverage, and evidence appendix.

Operator chat is not proof. A finding becomes validated only through a typed validation entry, usually replay via `nr_validate_finding`, statistical verification, OOB callback confirmation, or artifact review. If validation is missing, the report must say so instead of implying certainty.

## Capability packs

- `recon`
- `web`
- `api`
- `mobile`
- `exploitation`
- `privilege-escalation`
- `lateral-movement`
- `exfiltration`
- `cloud`
- `binary`
- `network`
- `evidence`
- `reporting`
- `coordination`
- `lab-control`
- `active-directory`
- `wifi`
- `database`
- `forensics`
- `code-audit`
- `threat-intel`

Before a deeper run:

- use `/engagement capabilities [workflow]` to check missing commands or env requirements
- use `/engagement alignment` to inspect workflow and agent coverage in the current build
- use `/report --all latest` after evidence capture to generate both canonical Markdown and designed HTML reports
- install Maigret with `python3 -m pip install --user maigret` when `/engagement capabilities` reports `maigret-digital-footprint` missing

If you want to test agent teams in the OSS build, enable them explicitly through `agentTeamsEnabled`, `NETRUNNER_EXPERIMENTAL_AGENT_TEAMS=1`, or `--agent-teams`.
