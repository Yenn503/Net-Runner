# ADR-0005: Skill-First Workflow Routing

Status: Accepted
Date: 2026-04

## Context

Net-Runner routes operator intent ("test this web app", "simulate APT29 against a government target") to one of several Workflows, which in turn activate Capability Packs and Specialist Agents. There are three plausible routing surfaces:

1. **Tool selection** — agent reads all tools, picks one.
2. **Skill invocation** — operator or Engagement Lead invokes a named Skill; the Skill composes tools.
3. **Free-form prompting** — agent infers a plan from scratch each turn.

## Decision

Net-Runner routes through **Skills first**. Workflows map intent to an ordered Skill sequence; Skills compose tool calls. Free-form prompting is the fallback only when no Skill fits.

Consequences for implementation:

- `src/security/autoEngagement.ts` detects intent and selects a Workflow.
- Each Workflow names an explicit Skill ordering in `src/security/workflows.ts`.
- The Engagement Lead agent prompt lists Skills as the primary action surface.
- Specialist agents receive Skill-scoped tool subsets, not the universe of tools.

## Consequences

- Operator intent translates to a reproducible Skill sequence — better for audit trails and retest.
- Skills are the stable unit of reuse; tools can evolve behind them.
- Evidence Ledger entries can be grouped by invoking Skill, aiding report generation.
- Cost: every new capability needs to earn a Skill or be composed into an existing one.

## Alternatives considered

- **Tool-first routing.** Rejected: high context burden per turn, poor reproducibility, no natural audit trail.
- **Free-form only.** Rejected: same failure mode plus no pre-authorized guardrail mapping.
