# Skills-First Architecture

`Net-Runner` is intentionally not an MCP-first framework.

## Primary execution model

The primary execution model is:

- skills
- direct code execution
- built-in shell, file, and web tools
- specialist agents running on top of those primitives

This is the fastest path to reproducible testing workflows because:

- methodology lives in reusable skill prompts instead of being buried in ad hoc sessions
- the agent can create and adapt tooling through normal code execution
- workflows still work in minimal environments without a large MCP estate

## Where MCP fits

MCP is still useful, but selectively.

Use MCP for:

- provider-built APIs
- external systems
- environment control
- evidence stores
- ticketing or reporting integrations
- cases where a typed protocol is genuinely better than direct tool use

This includes API and endpoint-heavy testing workflows where MCP gives cleaner typed contracts and safer repeatability than ad hoc shell chains.

Do not use MCP as the default place to encode core framework behavior when skills and code execution already solve the problem cleanly.

## Practical rule

When adding a new `Net-Runner` capability:

1. Ask whether a skill plus the existing tool surface is enough.
2. If yes, prefer that path.
3. If no, check whether direct code execution is the right extension point.
4. Only then introduce MCP as an integration layer.

That keeps the framework portable, operator-friendly, and aligned with the way the underlying Claude Code runtime already succeeds in practice.

Use `/engagement capabilities` to audit runtime readiness for each workflow and identify missing binaries, API keys, or MCP integrations before execution.
Use `/engagement alignment` to audit specialist-agent capability ownership and workflow coverage before production engagement runs.
