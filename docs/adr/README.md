# Architecture Decision Records

Load-bearing decisions for Net-Runner. Each ADR captures one decision, its trade-offs, and what it locks in. Supersede — don't mutate.

| # | Title | Status |
|---|---|---|
| [0001](./0001-minimal-mcp-surface.md) | Minimal MCP Surface with `nr_exec` Workhorse | Accepted |
| [0002](./0002-runtime-intelligence-middleware.md) | Runtime Intelligence as Middleware, Not Tools | Accepted |
| [0003](./0003-oss-no-vendor-api-dependence.md) | OSS Fork — No Hard Dependence on Anthropic / Vendor APIs | Accepted |
| [0004](./0004-no-mobile-client.md) | No Mobile Client Product Surface | Accepted |
| [0005](./0005-skill-first-workflow-routing.md) | Skill-First Workflow Routing | Accepted |

## Format

Each ADR: Context, Decision, Consequences, Alternatives considered. Keep it short — if an ADR runs over two screens, decompose it.

## When to write one

Per `grill-with-docs` criteria: hard to reverse, surprising without context, result of real trade-off. Skip otherwise.
