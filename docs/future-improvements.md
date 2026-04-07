# Net-Runner Future Improvements

*Last updated: 2026-04-04*

Several items below were originally proposed before the intelligence engine and MCP runtime middleware were wired into production. The statuses in this document now reflect the current codebase rather than the earlier design intent.

## High-Impact Enhancements

### 1. Attack Path Planning Algorithm

**Status**: Implemented in the current engagement-scoped runtime
**Priority**: High
**Effort**: Medium

Implement intelligent attack path selection using Monte Carlo Tree Search (MCTS) or similar decision-making algorithm.

**Benefits:**
- Optimize tool/skill execution order based on historical success rates
- Balance exploration (trying new paths) vs exploitation (known good paths)
- Reduce wasted time on low-probability attack vectors

**Current state:**
- `src/security/mctsPlanner.ts` implements MCTS ranking with UCB1-style exploration
- `src/security/intelligenceMiddleware.ts` and `runtimeIntegration.ts` persist and surface ranked next actions
- `nr_save_finding` and engagement intelligence updates can trigger fresh planning

**Remaining future work:**
- Persist richer action-success history across engagements instead of per-engagement state only
- Add target-similarity and historical path priors to improve ranking
- Expose higher-level path summaries in reporting

---

### 2. Knowledge Graph for Target Intelligence

**Status**: Partially implemented
**Priority**: High
**Effort**: High

Build persistent knowledge graph to remember relationships between targets, services, vulnerabilities, and credentials across all engagements.

**Benefits:**
- "This target looks similar to one we tested 3 months ago" - auto-suggest known attack paths
- Speed up assessments on similar infrastructure
- Build institutional memory across engagements

**Schema:**
```
Target --[HOSTS]--> Service --[HAS_VULN]--> Vulnerability
Target --[HAS_CRED]--> Credential
Service --[ACCESSED_VIA]--> Credential
```

**Current state:**
- `src/security/knowledgeGraph.ts` implements the in-memory entity/relation graph and pathfinding
- Evidence can already be ingested automatically through the runtime intelligence middleware
- Knowledge-graph stats are persisted into `.netrunner/intelligence-state.json`

**Remaining future work:**
- Persist the full graph itself across sessions instead of only derived stats
- Add cross-engagement similarity lookups and credential-reuse inference
- Support export/sync to external graph backends when needed

---

### 3. Advanced Verification Framework

**Status**: Partially implemented
**Priority**: Medium
**Effort**: Medium

Reduce false positives through multi-method vulnerability verification.

**Verification Methods:**

1. **Statistical Verification**
   - Sample payload 10+ times, measure response variance
   - Compare variance against baseline (normal payloads)
   - Use t-test or chi-square for significance

2. **Boolean Blind Validation**
   - For SQL injection: send TRUE condition vs FALSE condition
   - Compare response lengths/times
   - Require consistent delta across multiple samples

3. **Time-Based Validation**
   - Send delay payload (e.g., `sleep(5)`)
   - Measure response time with network jitter compensation
   - Require 3+ consecutive successful delays

4. **Out-of-Band (OOB) Validation**
   - Use DNS/HTTP callback verification
   - Requires callback server setup
   - Gold standard for confirming exploitation

**Current state:**
- `src/security/statisticalVerifier.ts` implements Welch's t-test and response-length differential analysis
- `src/security/oobVerification.ts` generates blind-verification callback payloads and tracks statuses
- Blind findings can be gated by intelligence middleware before promotion
- The corresponding intelligence skills are now code-backed rather than prompt-only

**Remaining future work:**
- Unify the verification flows behind a single operator-facing verification surface
- Persist formal verification evidence directly into the evidence ledger and reporting path
- Auto-promote or suppress findings based on combined verification outcomes

---

### 4. Session Checkpoint & Resume

**Status**: Partial (run state exists, resume not implemented)
**Priority**: Medium
**Effort**: Low

Enable pause/resume for long-running assessments.

**Features:**
- Save full execution state: completed actions, pending tasks, agent memory
- Resume from last checkpoint without re-running completed phases
- Handle tool installation state (don't re-install nmap if already checked)

**Implementation:**
```typescript
// Save checkpoint
await saveCheckpoint({
  completedPhases: ['recon', 'vuln-scan'],
  currentPhase: 'exploitation',
  agentStates: {...},
  findings: [...],
  timestamp: Date.now()
})

// Resume
await resumeFromCheckpoint(engagementPath)
```

**Files to modify:**
- `src/security/runState.ts`

**Files to create:**
- `src/coordinator/checkpoint.ts`
- `src/coordinator/resume.ts`

---

### 5. Payload Mutation Engine

**Status**: Partially implemented
**Priority**: Low
**Effort**: Medium

Automatically mutate payloads to bypass WAF/filters when initial attempts fail.

**Mutation Strategies:**
- **Encoding**: URL encode, double-encode, hex, unicode, base64
- **Case variation**: `SeLeCt`, `sElEcT`
- **Comment injection**: `SEL/**/ECT`, `SEL%00ECT`
- **Syntax alternatives**: `UNION SELECT` vs `UNION ALL SELECT`
- **Whitespace variation**: tabs, newlines, multiple spaces

**Current state:**
- `src/security/feedbackEngine.ts` already selects encoding, payload-mutation, header, delay, and protocol strategies
- The runtime feedback loop generates mutated payload guidance for blocked or filtered attempts

**Remaining future work:**
- Add a standalone reusable mutator surface for non-intelligence workflows
- Track per-target mutation effectiveness over longer histories
- Expand payload-generation coverage beyond the current feedback-engine strategy set

---

### 6. Tool Success Rate Tracking

**Status**: Not implemented  
**Priority**: Low  
**Effort**: Low

Track which tools/skills produce findings vs waste time.

**Metrics:**
- Tool execution time
- Finding yield (findings per hour)
- False positive rate
- Success rate by target type

**Output:**
```
Tool Performance Report:
- nuclei: 12 findings / 45min = 16 findings/hour ⭐⭐⭐⭐⭐
- wpscan: 0 findings / 30min = 0 findings/hour ⭐
- sqlmap: 3 findings / 2hr = 1.5 findings/hour ⭐⭐⭐
```

**Implementation:**
- Log tool start/end times in run state
- Correlate with evidence ledger findings
- Generate report: `/tool-performance`

**Files to create:**
- `src/analytics/toolMetrics.ts`

---

## Implementation Priority

**Phase 1 (Q2 2026):**
1. Attack Path Planning Algorithm
2. Session Checkpoint & Resume

**Phase 2 (Q3 2026):**
3. Knowledge Graph for Target Intelligence
4. Advanced Verification Framework

**Phase 3 (Q4 2026):**
5. Payload Mutation Engine
6. Tool Success Rate Tracking

---

## Not Recommended

**Heavy MCP Integration**: Net-Runner uses skills + direct code execution. Adding MCP tool layer would add complexity without clear benefit.

**MCP Tool Surface Expansion for Batch/Skill Logic**: Composite execution and intelligence behavior now live inside existing tool/skill boundaries. Adding more MCP tools for these same concerns would reintroduce context bloat.

**External Python Tool Wrappers**: Already have 153 tools. Focus on workflow intelligence, not tool collection.

**Distributed Scanning**: Adds deployment complexity. Single-machine sequential execution is simpler and easier to debug for academic project.
