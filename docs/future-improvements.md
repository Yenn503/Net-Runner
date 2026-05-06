# Net-Runner — Remaining Work

*Last updated: 2026-05-06*

## Not Yet Implemented

### Session Checkpoint & Resume
**Priority**: Medium | **Effort**: Low

Save full execution state (completed actions, pending tasks, agent memory). Resume from last checkpoint without re-running completed phases.

**Files to create:** `src/coordinator/checkpoint.ts`, `src/coordinator/resume.ts`

### Tool Success Rate Tracking
**Priority**: Low | **Effort**: Low

Track which tools/skills produce findings vs waste time. Log execution time, finding yield, false positive rate.

**File to create:** `src/analytics/toolMetrics.ts`

## Partially Implemented — Needs Completion

### Knowledge Graph Persistence
`src/security/knowledgeGraph.ts` works in-memory. Stats persist to `.netrunner/intelligence-state.json`. Full graph should persist across sessions. Cross-engagement similarity lookups needed.

### Verification Framework Unification
Statistical (`statisticalVerifier.ts`), OOB (`oobVerification.ts`), and boolean-blind verification exist but aren't unified behind a single operator-facing surface. Formal verification evidence should flow directly into the evidence ledger.

### MCTS Cross-Engagement History
`src/security/mctsPlanner.ts` ranks actions per-engagement. Needs cross-engagement action-success history and target-similarity priors.

### Payload Mutation Expansion
`src/security/feedbackEngine.ts` handles encoding, header, delay, and protocol strategies. Needs standalone reusable mutator surface and per-target effectiveness tracking.

## Not Recommended

- **Heavy MCP Integration**: Skills + direct execution is sufficient. More MCP tools = context bloat.
- **Distributed Scanning**: Single-machine sequential execution simpler for academic project.
- **Generic Python Tool Wrappers**: 228 cataloged tools already. Don't add wrappers just to increase count.
