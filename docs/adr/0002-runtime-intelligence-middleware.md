# ADR-0002: Runtime Intelligence as Middleware, Not Tools

Status: Accepted
Date: 2026-04

## Context

Net-Runner has six intelligence modules: failure classification (`feedbackEngine.ts`), statistical verification (`statisticalVerifier.ts`), WAF detection (`wafDetection.ts`), MCTS planning (`mctsPlanner.ts`), knowledge graph (`knowledgeGraph.ts`), and OOB verification (`oobVerification.ts`).

These could be exposed as MCP tools (`nr_detect_waf`, `nr_classify_failure`, etc.) or as callable skills. Both would require the agent to **know when** to invoke them — adding decision burden and burning context.

## Decision

Intelligence modules run as **runtime middleware**. They observe tool execution side-effects and auto-trigger without explicit agent invocation:

- On tool failure → `handleToolFailure()` classifies and produces retry guidance.
- On HTTP response → `handleHttpResponse()` auto-detects WAF once per engagement.
- On evidence append → `syncEvidenceToKnowledgeGraph()` ingests into the graph.
- On blind finding save → `shouldGateBlindFinding()` gates for statistical verification.
- On next-action request → `planNextActionsWithPersistence()` builds state from the graph.

State persists at `.netrunner/intelligence-state.json`. Composition lives in `src/security/intelligenceMiddleware.ts`; hooks surface in `src/security/runtimeIntegration.ts`.

## Consequences

- Agents do not need to know intelligence modules exist — they just get smarter retries, WAF-aware payloads, and MCTS-ranked suggestions.
- Intelligence state survives across agent turns for a single Engagement.
- No MCP tool-surface growth (per ADR-0001).
- Failure path: if a middleware throws, it must not block the triggering tool call. All hooks wrap with safe-fallback.

## Alternatives considered

- **Expose as MCP tools.** Rejected: context burden, discovery burden, breaks ADR-0001.
- **Expose as Skills.** Rejected: still requires the agent to remember when to run them; easy to forget; loses the "always-on" property.
