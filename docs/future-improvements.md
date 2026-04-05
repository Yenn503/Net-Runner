# Net-Runner Future Improvements

*Last updated: 2026-04-04*

## High-Impact Enhancements

### 1. Attack Path Planning Algorithm

**Status**: Not implemented  
**Priority**: High  
**Effort**: Medium

Implement intelligent attack path selection using Monte Carlo Tree Search (MCTS) or similar decision-making algorithm.

**Benefits:**
- Optimize tool/skill execution order based on historical success rates
- Balance exploration (trying new paths) vs exploitation (known good paths)
- Reduce wasted time on low-probability attack vectors

**Implementation:**
- Track success rates per (target_type, action) combination
- Use UCB1 algorithm for path selection: `score = win_rate + c * sqrt(log(parent_visits) / node_visits)`
- Store decision tree in engagement memory for session continuity

**Files to create:**
- `src/coordinator/attackPlanner.ts`
- `src/coordinator/pathSelection.ts`

---

### 2. Knowledge Graph for Target Intelligence

**Status**: Not implemented  
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

**Implementation:**
- Lightweight in-memory graph with optional Neo4j export
- Store in `.netrunner/knowledge/graph.json`
- Query API: `findSimilarTargets()`, `getAttackPaths()`, `inferCredentialReuse()`

**Files to create:**
- `src/knowledge/graph.ts`
- `src/knowledge/similarity.ts`
- `src/knowledge/pathFinder.ts`

---

### 3. Advanced Verification Framework

**Status**: Partial (basic verification in skills)  
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

**Implementation:**
- Extend `verify` skill with `--method statistical|boolean-blind|time-based|oob`
- Store verification proofs in evidence ledger
- Auto-escalate findings that pass multiple verification methods

**Files to modify:**
- `src/skills/bundled/verify.ts`
- `src/security/evidence.ts`

**Files to create:**
- `src/verification/statistical.ts`
- `src/verification/timebase.ts`
- `src/verification/oob.ts`

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

**Status**: Not implemented  
**Priority**: Low  
**Effort**: Medium

Automatically mutate payloads to bypass WAF/filters when initial attempts fail.

**Mutation Strategies:**
- **Encoding**: URL encode, double-encode, hex, unicode, base64
- **Case variation**: `SeLeCt`, `sElEcT`
- **Comment injection**: `SEL/**/ECT`, `SEL%00ECT`
- **Syntax alternatives**: `UNION SELECT` vs `UNION ALL SELECT`
- **Whitespace variation**: tabs, newlines, multiple spaces

**Implementation:**
```typescript
const mutator = new PayloadMutator()
for (const variant of mutator.generate('SELECT * FROM users', {
  methods: ['encode', 'case', 'comment'],
  maxVariants: 50
})) {
  const result = await testPayload(variant)
  if (result.success) break
}
```

**Files to create:**
- `src/payloads/mutator.ts`
- `src/payloads/encoders.ts`

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

**External Python Tool Wrappers**: Already have 153 tools. Focus on workflow intelligence, not tool collection.

**Distributed Scanning**: Adds deployment complexity. Single-machine sequential execution is simpler and easier to debug for academic project.
