# ADR-0003: OSS Fork — No Hard Dependence on Anthropic / Vendor APIs

Status: Accepted
Date: 2026-04

## Context

Net-Runner forked from Claude Code. Upstream assumes authenticated Anthropic API access, Bedrock, Vertex, and sandbox-runtime integrations. As an OSS red-team harness, Net-Runner must run end-to-end on local or self-hosted providers (Ollama, OpenAI-compatible endpoints, Gemini) without Anthropic credentials.

## Decision

The red-team harness and MCP control plane **must** function with any of: Ollama, OpenAI-compatible, Gemini, or a direct API-key fallback. Upstream vendor SDKs stay in `package.json` only where:

1. They are transitively required by the inherited Claude Code UI layer, or
2. They are behind a provider-selection switch (`services/api/bootstrap.ts`).

New red-team features **must not** add new vendor-private endpoints. Documentation **must not** imply vendor lock-in.

## Consequences

- `services/api/bootstrap.ts` owns provider selection; `services/api/client.ts` owns the direct API-key fallback.
- `.env` drives provider choice (`PREFERRED_PROVIDER`, `OLLAMA_BASE_URL`, etc.).
- CI smoke + typecheck run without any vendor credential.
- Features requiring a specific vendor (e.g. Claude-only prompt caching) are feature-flagged, not default.

## Alternatives considered

- **Hard-require Anthropic.** Rejected: incompatible with OSS distribution and red-team threat model (offline labs, air-gapped engagements).
- **Rip out all vendor SDKs.** Rejected: upstream UI layer imports them; surgical removal creates merge conflict churn with no product gain.
