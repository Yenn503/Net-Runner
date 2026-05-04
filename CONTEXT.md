# Net-Runner Context

Canonical vocabulary for the Net-Runner red-team harness. Prefer these terms over synonyms. If a term here conflicts with code, the code is wrong — open an ADR before drifting.

## Core domain

- **Engagement** — a scoped, authorized testing session. Rooted at `.netrunner/` in the target workspace. Holds the manifest, evidence ledger, run state, and intelligence state. Created by `nr_engagement_init` or the `engagement-setup` skill.

- **Scope** — the allowed target surface for an Engagement (hosts, URLs, CIDRs, excluded patterns). Encoded in the manifest and enforced by the Guardrail.

- **Guardrail Decision** — the result of evaluating a planned action against Scope. One of `allow`, `review`, `block`. `review` queues a human-in-the-loop gate; `block` rejects outright. Source: `src/security/guardrails.ts`.

- **Evidence Ledger** — append-only JSONL of all captured artifacts, findings, approvals, and tool outputs for an Engagement. Source: `src/security/evidence.ts`. One Engagement = one ledger.

- **Finding** — a confirmed or candidate security issue recorded in the Evidence Ledger with severity, CWE, and reproduction detail. Not every evidence entry is a Finding.

- **Run State** — the transient execution status for an Engagement (in-flight tool calls, pending reviews, active agent). Distinct from the Evidence Ledger.

## Capability model

- **Capability Pack** — a named grouping of offensive capabilities (`recon`, `web`, `api`, `exploitation`, `privilege-escalation`, `lateral-movement`, `exfiltration`, `cloud`, `binary`, `network`, `reporting`, `lab-control`, `evidence`, `coordination`, `active-directory`, `wifi`, `database`). Source: `src/security/workflows.ts` (`CapabilityPackName`).

- **Capability** — a concrete offensive action or integration with an execution model (`shell`, `mcp`, `hybrid`). Belongs to one or more Capability Packs. Source: `src/security/capabilities.ts`.

- **Pentest Tool Entry** — a cataloged external binary (e.g. `nmap`, `sqlmap`, `bloodhound`) mapped to Capability Packs, recommended Agents, and MITRE ATT&CK techniques. Source: `src/security/catalog/`. Invoked through `nr_exec` / the Bash tool, never as a typed MCP tool.

## Execution surface

- **MCP Surface** — the 8 `nr_*` tools exposed to external MCP clients (Windsurf, Claude Desktop). Deliberately minimal per ADR-0001. `nr_exec` is the shell workhorse; everything else is engagement state, evidence, guardrails, or progressive discovery.

- **Skill** — a named composable playbook that sequences tools and captures intent (`engagement-setup`, `scope-guard`, `recon-plan`, `evidence-capture`, `vuln-assessment`, `exploit-validation`, `post-exploitation-plan`, `report-generation`, `attack-path-analysis`, `apt-simulation`, `target-fingerprinting`). Source: `src/security/skillDefinitions.ts`. Exposed to users via `SkillTool` and composed into Workflows.

- **Workflow** — an end-to-end engagement template (`web-app-testing`, `api-testing`, `lab-target-testing`, `ctf-mode`, `ad-testing`, `wifi-testing`) mapping Scope intent to Capability Packs, Specialist Agents, and Skill ordering. Source: `src/security/workflows.ts`.

- **Specialist Agent** — a Net-Runner built-in agent type with a focused system prompt and tool subset (`engagement-lead`, `recon-specialist`, `web-testing-specialist`, `api-testing-specialist`, `network-testing-specialist`, `exploit-specialist`, `privilege-escalation-specialist`, `lateral-movement-specialist`, `ad-specialist`, `retest-specialist`, `evidence-specialist`, `reporting-specialist`). Source: `src/tools/AgentTool/built-in/`.

- **Engagement Lead** — the coordinator Specialist Agent. Routes work to other specialists, owns scope adherence, and terminates the engagement.

## Runtime intelligence

- **Intelligence Runtime** — the composed middleware that auto-classifies tool failures, detects WAFs, syncs evidence to the Knowledge Graph, gates blind findings for statistical verification, and plans next actions with MCTS. State persisted at `.netrunner/intelligence-state.json`. Per-engagement singleton.

- **Knowledge Graph** — an in-memory entity/relation graph built from Evidence Ledger entries. Used by the MCTS planner and attack-path analysis. Source: `src/security/knowledgeGraph.ts`.

## Invariants

- One Engagement owns exactly one `.netrunner/` directory.
- Every `review`/`block` Guardrail Decision **must** produce an Evidence Ledger entry.
- Specialist Agents **must not** bypass the Engagement Lead for scope changes.
- MCP Surface **must not** grow beyond the documented 8 tools without an ADR.
- Evidence Ledger is append-only. Never mutate past entries.
