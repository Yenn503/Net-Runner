# Changelog

All notable changes to Net-Runner are documented in this file.

## [1.1.0] - 2026-05-16

### Added

- **Exploit Arsenal System** — CVE-indexed exploit catalog with YAML manifests
  - Curated index of high-impact exploits (Citrix Bleed, PwnKit, Zerologon, PAN-OS, MOVEit…)
  - Grouped by attack surface: windows, linux, web-and-appliance, active-directory
  - Agent matches fingerprinted targets before deriving exploits from scratch
  - Discovered exploits persisted to `discovered.jsonl` for cross-engagement reuse
  - Arsenal entries gated: validated against live target before counting as findings

- **Arsenal Lookup Tool** — Dedicated CLI + MCP lookup (`nr_arsenal_lookup`)
  - Shared type-safe matching logic between CLI and FastMCP surfaces
  - Typed MCP boundary for non-interactive client installs
  - CVE intelligence lookup skill for exploit specialist agents

- **Anthropic Provider Onboarding** — Full subscription-based account flow
  - Built-in account/API-key path (no `.net-runner-profile.json` persistence)
  - CLI device-code authentication for Claude subscription access
  - Graceful profile-clear handling and typed setup labels

- **Docker Sandbox** — Opt-in sandboxed execution for `nr_exec`
  - Containerised tool execution with isolation boundaries
  - Configurable via environment and engagement settings

- **In-Process Swarm Evidence** — Execution step recording for teammate agents
  - Evidence capture during in-process swarm execution
  - Shared evidence ledger across distributed agent operations

- **MCP Capability Packs** — Optional extension packs (ghidra, binary-ninja, burp)
  - Pluggable tool integrations beyond the core catalog
  - Versioned capability declarations for MCP surface

- **Execution Environment Profiles** — Documented environment configuration
  - Profile-based environment switching (Kali WSL, native Linux, macOS)
  - Automatic environment detection and tool path resolution

### Changed

- **Specialist Agents** — Consolidated from 17 to 6 domain specialists
  - Merged narrow specialists into broader domains (web + API + mobile → AppSec)
  - Each specialist carries curated skill packs under `.netrunner/skills/<namespace>/`
  - Compressed output discipline for all specialists except Lead and Reporter

- **Workflow Engine** — Expanded from 7 to 12 workflows in 4 categories
  - New categories: Red Team (`adversary-emulation`), Blue Team (`dfir-incident-response`, `code-audit-review`)
  - Added: `cloud-assessment`, `bug-bounty-recon-validation`
  - `/mode` command for workflow browsing and filtering

- **README Structure** — Professional table-format agent list, streamlined sections
  - Specialist agents displayed in structured markdown table
  - Provider documentation consolidated with Anthropic onboarding clarity
  - British English editorial pass for technical sections

- **MCP Surface** — Expanded from 14 to 16 tools
  - Added: `nr_arsenal_lookup`, `nr_discover`
  - FastMCP server aligned with CLI runtime on shared code paths

- **Setup & Provider Configuration**
  - Anthropic deliberately uses built-in onboarding (not persisted profile)
  - Provider preset improvements for Codex and Copilot auth flows
  - Type-safe profile provider exclusion for non-persisting providers

### Fixed

- **Workflow Registry** — Duplicated `specialistAgents` arrays removed
- **Intelligence Engine Docs** — Self-contradictory test counts corrected
- **Provider Profile** — Anthropic preset consistency in setup flow
- **Help Cache Tests** — Alignment with expanded tool catalog

### Technical

- **Runtime**: Shared code paths between CLI and FastMCP surfaces
- **Security**: 346-line arsenal system with provenance tracking
- **Testing**: 224 new arsenal test cases + existing security test suite
- **Documentation**: Execution profiles, harness assessment, MCP integration guides
- **Quality**: typecheck, security tests, arsenal check, smoke tests verified across Linux and WSL Kali
