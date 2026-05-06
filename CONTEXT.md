# Net-Runner Context

Canonical vocabulary for the Net-Runner red-team harness. Prefer these terms over synonyms. If a term here conflicts with code, the code is wrong — fix the code or update this document, do not drift silently.

## Core domain

- **Engagement** — a scoped, authorized testing session. Rooted at `.netrunner/` in the target workspace. Holds the manifest, evidence ledger, run state, and intelligence state. Created by `nr_engagement_init` or the `engagement-setup` skill.

- **Scope** — the allowed target surface for an Engagement (hosts, URLs, CIDRs, excluded patterns). Encoded in the manifest and enforced by the Guardrail.

- **Guardrail Decision** — the result of evaluating a planned action against Scope. One of `allow`, `review`, `block`. `review` queues a human-in-the-loop gate; `block` rejects outright. Source: `src/security/guardrails.ts`.

- **Evidence Ledger** — append-only JSONL of all captured artifacts, findings, approvals, and tool outputs for an Engagement. Source: `src/security/evidence.ts`. One Engagement = one ledger.

- **Finding** — a confirmed or candidate security issue recorded in the Evidence Ledger with severity, CWE, and reproduction detail. Not every evidence entry is a Finding.

- **Run State** — the transient execution status for an Engagement (in-flight tool calls, pending reviews, active agent). Distinct from the Evidence Ledger.

## Capability model

- **Capability Pack** — a named grouping of offensive capabilities (`recon`, `web`, `api`, `mobile`, `exploitation`, `privilege-escalation`, `lateral-movement`, `exfiltration`, `cloud`, `binary`, `network`, `reporting`, `lab-control`, `evidence`, `coordination`, `active-directory`, `wifi`, `database`, `forensics`, `code-audit`, `threat-intel`). Source: `src/security/workflows.ts` (`CapabilityPackName`).

- **Capability** — a concrete offensive action or integration with an execution model (`shell`, `mcp`, `hybrid`). Belongs to one or more Capability Packs. Source: `src/security/capabilities.ts`.

- **Pentest Tool Entry** — a cataloged external binary (e.g. `nmap`, `sqlmap`, `bloodhound`) mapped to Capability Packs, recommended Agents, and MITRE ATT&CK techniques. Source: `src/security/catalog/`. Invoked through `nr_exec` / the Bash tool, never as a typed MCP tool.

## Execution surface

- **MCP Surface** — the 14 `nr_*` tools exposed to external MCP clients (Windsurf, Claude Desktop). Deliberately minimal. `nr_exec` is the shell workhorse; the rest cover engagement state (`nr_engagement_init`, `nr_engagement_status`), scope (`nr_scope_check`), evidence ingest/query (`nr_save_finding`, `nr_save_note`, `nr_list_evidence`, `nr_verify_evidence`), progressive discovery (`nr_discover`, `nr_tool_help`), Knowledge Graph lookup (`nr_kg_query`), validation (`nr_validate_finding`), MITRE coverage (`nr_coverage_status`), and report export (`nr_export_report`).

- **Skill** — a named composable playbook that sequences tools and captures intent. Red-team skills include `engagement-setup`, `scope-guard`, `recon-plan`, `target-fingerprinting`, `evidence-capture`, `vuln-assessment`, `exploit-validation`, `post-exploitation-plan`, `report-generation`, `attack-path-analysis`, `apt-simulation`, `feedback-loop`, `waf-detection`, `statistical-verification`, `oob-verification`, `mcts-planning`, `dfir-triage`, `code-audit-review`, `threat-intel-enrichment`, `wifi-assessment`, `mobile-app-testing`, `binary-exploitation`, `digital-footprint-assessment`, `identity-correlation`, `c2-infrastructure`, `c2-operations`, `wordpress-attack-tree`, `headless-browser-validation`, `bug-bounty-validation`, `http-smuggling-cache-poisoning`, `serverless-edge-recon`. Source: `src/security/skillDefinitions.ts`. Exposed via `SkillTool` and composed into Workflows.

- **Workflow** — an end-to-end engagement template mapping Scope intent to Capability Packs, Specialist Agents, and Skill ordering. Workflows: `web-app-testing`, `api-testing`, `mobile-app-testing`, `lab-target-testing`, `adversary-emulation`, `bug-bounty-recon-validation`, `ctf-mode`, `ad-testing`, `wifi-testing`, `dfir-incident-response`, `code-audit-review`, `cloud-assessment`. Source: `src/security/workflows.ts`.

- **Specialist Agent** — a Net-Runner built-in agent type with a focused system prompt and full shared toolset. Specialists: `engagement-lead`, `recon-specialist` (+ wifi), `app-testing-specialist` (web + API + mobile), `infra-specialist` (network + exploit + privesc + lateral + AD + binary), `code-forensics-specialist` (SAST + DFIR), `evidence-reporting-specialist` (evidence + retest + reports). Source: `src/tools/AgentTool/built-in/`.

- **Engagement Lead** — the coordinator Specialist Agent. Routes work to other specialists, owns scope adherence, and terminates the engagement.

## Runtime intelligence

- **Intelligence Runtime** — the composed middleware that auto-classifies tool failures, detects WAFs, syncs evidence to the Knowledge Graph, gates blind findings for statistical verification, and plans next actions with MCTS. State persisted at `.netrunner/intelligence-state.json`. Per-engagement singleton.

- **Knowledge Graph** — an in-memory entity/relation graph built from Evidence Ledger entries. Used by the MCTS planner and attack-path analysis. Source: `src/security/knowledgeGraph.ts`.

## Invariants

- One Engagement owns exactly one `.netrunner/` directory.
- Every `review`/`block` Guardrail Decision **must** produce an Evidence Ledger entry.
- Specialist Agents **must not** bypass the Engagement Lead for scope changes.
- MCP Surface **must not** grow beyond the documented 14 tools.
- Evidence Ledger is append-only. Never mutate past entries.
