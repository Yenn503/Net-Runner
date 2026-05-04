# ADR-0001: Minimal MCP Surface with `nr_exec` Workhorse

Status: Accepted
Date: 2026-04
Supersedes: —

## Context

Model Context Protocol (MCP) clients (Windsurf, Claude Desktop, etc.) discover server capabilities by enumerating tools. Exposing every pentest binary as a typed MCP tool would:

- explode the tool surface to 150+ entries (see `src/security/catalog/`),
- force schema maintenance for tools whose CLI grammars drift,
- bloat the client's tool-selection context window,
- duplicate the shell layer Net-Runner already owns.

Anthropic's "Code Execution with MCP" pattern argues for a narrow typed surface plus a general execution tool, delegating open-ended work to shell.

## Decision

The Net-Runner MCP server (`src/mcp/server.ts`) exposes exactly **8** tools, all `nr_*` prefixed:

1. `nr_exec` — shell execution (all 150+ pentest tools route here).
2. `nr_engagement_init` — initialize `.netrunner/` engagement.
3. `nr_engagement_status` — manifest + evidence counts + run state.
4. `nr_scope_check` — guardrail evaluation (allow/review/block).
5. `nr_save_finding` — record finding with severity + CWE.
6. `nr_save_note` — append evidence note.
7. `nr_list_evidence` — query evidence ledger.
8. `nr_discover` — progressive disclosure of agents / skills / workflows / capabilities.

Growing this list requires a new ADR.

## Consequences

- Clients keep small, stable tool lists across Net-Runner upgrades.
- Typed boundaries exist only where state-correctness matters (engagement, evidence, guardrails).
- Pentest tool evolution lives in the shell catalog, invisible to MCP clients.
- Discovery is progressive via `nr_discover`, not via tool-list enumeration.

## Alternatives considered

- **One typed tool per pentest binary.** Rejected: 150+ tools, schema churn, client-side bloat.
- **Single mega-tool `nr_do`.** Rejected: state mutations (evidence, guardrails) need typed boundaries for safety.
