# Skills-First Architecture

`Net-Runner` is intentionally not an MCP-first framework.

That is a deliberate project decision, not just a slogan.

The current version aligns with the original project idea by keeping the framework modular, reducing tool and protocol bloat, and using MCP only where it adds real value.

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
- it keeps more of the assessment logic inside one runtime path instead of spreading it across too many wrappers

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

For this project, the rule is simple:

- skills hold methodology
- runtime tools do most of the work
- MCP handles selected integration boundaries

## Practical rule

When adding a new `Net-Runner` capability:

1. Ask whether a skill plus the existing tool surface is enough.
2. If yes, prefer that path.
3. If no, check whether direct code execution is the right extension point.
4. Only then introduce MCP as an integration layer.

That keeps the framework portable, operator-friendly, and aligned with the way the underlying agentic runtime succeeds in practice.

## Why this matters for the final-year project

The original proposal discussed MCP-compatible execution because it was a sensible direction at the time. The current repository refines that position rather than rejecting it.

The updated position is:

- MCP is useful
- MCP is not the default answer for every capability
- skills plus good runtimes and solid tool-calling are often the better foundation for the main red-team loop

That refinement is what makes this version better aligned with the original project aim rather than less aligned.

Use `/engagement capabilities` to audit runtime readiness for each workflow and identify missing binaries, API keys, or MCP integrations before execution.
Use `/engagement alignment` to audit specialist-agent capability ownership and workflow coverage before production engagement runs.
