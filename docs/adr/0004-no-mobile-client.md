# ADR-0004: No Mobile Client Product Surface

Status: Accepted
Date: 2026-04

## Context

Upstream references and prior README drafts hinted at a companion mobile app. No mobile client exists in this repository; none is shipped; no store listing is live.

Claiming a mobile surface that does not exist misleads operators and contributors, and creates pressure to preserve stubs that earn nothing.

## Decision

Net-Runner is a **terminal-first** harness. There is no mobile client. Documentation, onboarding flows, and marketing copy must not imply otherwise. Any future mobile client requires a new ADR superseding this one and a real shipped artifact.

## Consequences

- README, CHANGELOG, and screens must not reference mobile downloads, QR-code app install, or "Net-Runner Mobile".
- Remote-bridge features (`src/bridge/`) inherited from upstream are scoped to web/terminal peers only.
- Contributors are free to prototype mobile clients **out-of-tree**; that work does not land here without a new ADR.

## Alternatives considered

- **Keep aspirational copy.** Rejected: misleading.
- **Strip all remote-bridge code.** Rejected: upstream churn; bridge serves valid terminal peer use cases.
