# Net-Runner Harness Assessment

This document is the candid engineering view of the harness.

## What Is Solid

- The harness is useful as a local assessment control plane: scope envelope, specialist routing, command execution, artifact persistence, evidence ledger, reporting, and MCP exposure live in one runtime.
- Specialist agents have domain-specific role contracts and capability mappings instead of generic "security agent" prompts.
- The single `nr_exec` workhorse keeps the MCP surface small while still exposing the full catalogued toolset.
- Append-only evidence, artifact offload, hash-chain verification, and report generation make the transcript less important than stored state.
- OpenSwarm-style reporting lessons are reflected in the report path: HTML as designed human output, Markdown as editable source, structured exports for downstream tools.

## What Was Weak

- Authorization confirmation in chat was not meaningful. A user could answer yes repeatedly, which added token cost without increasing safety or quality.
- A finding could be worded as "confirmed" before the harness had independent replay/statistical/OOB/artifact validation.
- MITRE coverage could previously count unvalidated findings. That made coverage look better than the actual proof base.

## Current Contract

- Legal authorization is external to Net-Runner. The harness records scope envelope, target list, max impact, and restrictions.
- Runtime guardrails enforce practical boundaries: out-of-scope targets, persistence, destructive actions, C2/callback operations, and read-only impact limits.
- `nr_save_finding` creates an unvalidated finding.
- Validation is separate and typed: replay, statistical, OOB, or artifact review.
- Reports label each finding as `Validated`, `Unvalidated`, `Inconclusive`, or `Disputed`.
- MITRE coverage is based on replay-validated findings, not raw finding text.

## Real-World Usefulness

Useful for humans when:

- They already have a real assessment contract and target scope.
- They want a repeatable command/evidence/report workflow.
- They want specialist agents to reduce coordination load across recon, web, API, AD, mobile, wireless, code audit, exploit validation, retest, evidence, and reporting.
- They care about report quality and artifact traceability.

Not enough by itself when:

- The operator expects autonomous exploitation without senior review.
- The environment requires custom client-specific methodology not encoded in scope/restrictions.
- Tool installation, credentials, test accounts, VPN, or target data are missing.
- Findings require manual business-logic judgment that no replay command can fully prove.

## Bar To Keep

- No report claim without ledger or artifact backing.
- No validated label without typed validation.
- No specialist handoff without target slice, scope boundary, known facts, evidence refs, expected artifacts, stop conditions, and next owner.
- No new MCP tool unless it improves the assessment flow more than `nr_exec` plus structured state.
- Tool installation is one of those exceptions: `nr_tool_install` provides a typed check/install boundary so external LLMs do not have to invent privileged shell commands during an engagement. Install modes still require explicit confirmation.
- No decorative report polish that hides weak evidence.
