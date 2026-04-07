# Intelligence Engine

Net-Runner's intelligence engine is a set of six modules under `src/security/` that give the LLM runtime adaptive reasoning during live engagements. Each module is registered as a skill and invoked automatically by the engagement lead when the situation calls for it.

The skill layer is now **code-backed**. The bundled intelligence skills under `src/skills/bundled/` call the real TypeScript modules and format live results from persisted engagement state, evidence, and explicit structured input. The same core modules are also wired into the runtime middleware, so the skill layer and automatic execution path stay aligned.

---

## Modules

### Feedback Loop Engine

**Skill:** `/feedback-loop`
**File:** `src/security/feedbackEngine.ts`

When a tool execution or HTTP request fails, the feedback loop engine classifies the failure into one of ten categories:

| Failure Type | Trigger |
|---|---|
| `waf-block` | Response contains WAF signature or 403 with block page |
| `rate-limit` | 429 status or rate-limit headers |
| `captcha` | CAPTCHA challenge in response body |
| `auth-required` | 401/403 without WAF signatures |
| `timeout` | Request exceeded time limit |
| `ip-block` | Connection refused or IP-based block page |
| `payload-filtered` | Payload stripped or sanitized in response |
| `encoding-error` | Malformed response suggesting encoding mismatch |
| `server-error` | 500-series responses |
| `connection-failure` | Network-level connection failure |

Based on the classification, the engine selects mutation strategies and produces a retry plan:

- **Encoding mutations** — double-URL, unicode, hex, base64, mixed-case
- **Payload mutations** — case-toggle, inline-comment injection, space substitution, concat-break
- **Request mutations** — header changes, method switching, delay insertion, proxy rotation

Strategy effectiveness is tracked across attempts. The engine favours strategies with higher historical success rates against the current target.

---

### Statistical Verifier

**Skill:** `/statistical-verification`
**File:** `src/security/statisticalVerifier.ts`

Confirms or rejects suspected blind injection vulnerabilities using formal hypothesis testing.

**How it works:**

1. Collects baseline samples (benign requests) — response time and body length
2. Collects payload samples (injection requests) — same metrics
3. Runs **Welch's t-test** comparing the two distributions
4. Returns a verdict at significance level α = 0.05

**Output includes:**
- Sample statistics (mean, standard deviation, count)
- t-statistic, degrees of freedom, p-value
- 95% confidence interval for the difference
- Verdict: **confirmed** (p < 0.05, effect in expected direction), **inconclusive**, or **rejected**

This eliminates false positives from noisy network conditions and prevents wasted engagement time chasing phantom vulnerabilities.

---

### WAF Detection & Bypass

**Skill:** `/waf-detection`
**File:** `src/security/wafDetection.ts`

Fingerprints Web Application Firewalls from HTTP response data and maps detected WAFs to specific bypass strategies.

**Supported WAFs:**

| WAF | Detection Signals |
|-----|-------------------|
| Cloudflare | `CF-Ray` header, `__cfduid` cookie, `cf-` headers |
| Akamai | `AkamaiGHost` header, `akamai` references |
| Imperva/Incapsula | `visid_incap` cookie, `incapsula` references |
| ModSecurity | `Mod_Security` header, OWASP CRS patterns |
| AWS WAF | `x-amzn-waf` header, `awswaf` tokens |
| F5 BIG-IP | `BIGipServer` cookie, `x-cnection` header |
| Sucuri | `x-sucuri` headers, `sucuri` references |
| Fortinet/FortiWeb | `fortigate`/`fortiweb` signatures |
| Barracuda | `barra_counter` cookie |
| Citrix NetScaler | `ns_af` cookie, `citrix` references |

Each WAF is mapped to ranked bypass techniques: encoding bypasses, protocol tricks, payload mutation, and timing evasion.

---

### MCTS Attack Planner

**Skill:** `/mcts-planning`
**File:** `src/security/mctsPlanner.ts`

Models the penetration test as a decision tree and uses **Monte Carlo Tree Search** to discover optimal attack paths.

**Attack state tracks:**
- Target IP/domain and type
- Open ports and identified services
- Discovered vulnerabilities (with severity)
- Harvested credentials
- Current access level (none → user → root)
- Completed actions

**Action types:** `port-scan`, `service-detect`, `waf-detect`, `web-scan`, `vuln-scan`, `exploit`, `brute-force`, `privesc`, `lateral-move`, `ad-attack`, `exfiltrate`

**How MCTS works here:**

1. **Selection** — traverse the tree using UCB1 (balancing exploitation vs exploration)
2. **Expansion** — generate available actions for the current state
3. **Simulation** — randomly play out the action and estimate reward
4. **Backpropagation** — update visit counts and reward estimates up the tree

The result is a ranked list of next actions, each with an assigned specialist agent, expected reward, and confidence percentage. The engagement lead uses this to prioritize work.

---

### Knowledge Graph

**File:** `src/security/knowledgeGraph.ts`

An in-memory entity/relation graph that builds a structured picture of the target environment as the engagement progresses.

**Entity types:** `host`, `service`, `vulnerability`, `credential`, `network`, `user`, `application`, `finding`

**Relation types:** `runs-on`, `connects-to`, `exploits`, `authenticates`, `exposes`, `belongs-to`, `depends-on`, `discovered-by`

**Capabilities:**
- Entity and relation CRUD with property storage
- BFS shortest-path finding between any two entities
- 1-hop neighborhood queries
- Automatic eviction of oldest entities when capacity is reached
- Bulk ingestion of structured evidence entries
- Formatted output for agent consumption

The knowledge graph is used internally by other modules and by the engagement lead to understand the relationship between discovered assets.

---

### OOB Verification

**Skill:** `/oob-verification`
**File:** `src/security/oobVerification.ts`

Generates out-of-band callback payloads for confirming blind vulnerabilities that don't produce visible responses.

**Supported blind vulnerability types:**

| Type | Payload Examples |
|------|-----------------|
| **Blind XXE** | XML external entity with HTTP/DNS callback |
| **Blind SSRF** | Direct URL, DNS, URL-encoded, and redirect payloads |
| **Blind RCE** | `curl`, `wget`, `nslookup`, `ping`, PowerShell callbacks |
| **Blind SQLi** | MySQL `LOAD_FILE`, MSSQL `xp_dirtree`, Oracle `UTL_HTTP`, PostgreSQL `COPY` |
| **Log4Shell** | JNDI lookup variants with obfuscation (`${jndi:ldap://...}`) |

**Verification lifecycle:**
1. Generate unique callback payloads with a tracking ID
2. Inject payloads into the target parameter
3. Monitor the callback server
4. Status transitions: `pending` → `confirmed` (callback received) or `timeout`

Confirmed callbacks are captured as evidence with source IP, timestamp, and request details.

---

## Workflow Integration

The intelligence modules are wired into workflows via `src/security/workflows.ts`:

| Workflow | Intelligence Skills |
|----------|-------------------|
| **web-app-testing** | feedback-loop, waf-detection, statistical-verification, oob-verification |
| **api-testing** | feedback-loop, waf-detection, statistical-verification, oob-verification |
| **lab-target-testing** | All six (including mcts-planning) |
| **ctf-mode** | feedback-loop, statistical-verification, oob-verification, mcts-planning |
| **ad-testing** | All six (including mcts-planning) |

The engagement lead's prompt includes orchestration guidance for when to invoke each skill. The system does not require manual invocation — the LLM recognises the context and triggers the appropriate module.

## Code-Backed Skill Runtime

The bundled intelligence skills are mediated through `src/skills/bundled/intelligenceSkillRuntime.ts`.

That runtime does three things:

- **Uses the same core modules as runtime middleware** — feedback, WAF detection, MCTS planning, statistical verification, and OOB generation all call the real `src/security/` implementations
- **Consumes persisted engagement context** — skills read `.netrunner/intelligence-state.json`, engagement metadata, and evidence when available
- **Formats operator-facing outputs** — the returned skill text is a computed result, not a static instruction block

This keeps the behavior consistent across two paths:

- **Automatic runtime activation** from `nr_exec`, evidence ingestion, and blind-finding gating
- **Explicit skill invocation** from the engagement lead or operator when deeper analysis is needed

---

## Runtime Middleware Layer

Beyond the skill-facing API, the intelligence engine includes a **runtime middleware layer** (`src/security/intelligenceMiddleware.ts`) that automatically activates during engagements. This moves the modules from passive libraries into the active execution pipeline.

### Architecture

```
src/security/
├── intelligenceState.ts        # Persistent state at .netrunner/intelligence-state.json
├── intelligenceMiddleware.ts   # Middleware functions composing all 6 modules
└── runtimeIntegration.ts       # Runtime hooks (handleToolFailure, handleHttpResponse, syncEvidenceToKnowledgeGraph)
```

### Automatic Behaviors

| Trigger | Middleware | What Happens |
|---------|-----------|--------------|
| Any tool/HTTP failure | `handleToolFailure()` | Feedback engine classifies the failure, selects mutation strategies, produces retry guidance, and persists failure stats to intelligence state |
| First HTTP response | `handleHttpResponse()` | WAF detection runs automatically. If a WAF is found, the profile is persisted for the entire engagement. Subsequent calls return the cached result |
| Evidence ledger write | `syncEvidenceToKnowledgeGraph()` | Finding entries are auto-ingested as knowledge graph entities (hosts, services, vulns, credentials) with relationship linking |
| Phase transition | `planNextActionsWithPersistence()` | MCTS builds attack state from the knowledge graph and produces ranked next-action recommendations with agent assignments |
| Blind finding logged | `shouldGateBlindFinding()` | Returns true for findings matching blind injection patterns — signals that statistical verification is required before promotion |

### Intelligence State

The middleware persists its state to `.netrunner/intelligence-state.json`:

```json
{
  "schemaVersion": 1,
  "wafProfile": { "detected": true, "wafType": "cloudflare", "wafName": "Cloudflare", "confidence": 0.88 },
  "lastMctsPlan": { "rankedActions": [...], "bestPath": [...], "totalIterations": 200 },
  "knowledgeGraphStats": { "totalEntities": 12, "totalRelations": 8 },
  "toolFailureCount": 5,
  "toolFailureReasons": { "waf-blocked": 3, "rate-limited": 2 },
  "pendingBlindVerifications": 0
}
```

This state is initialized automatically when a project is created (`initializeNetRunnerProject`) and updated throughout the engagement. The engagement lead receives a formatted `[Intelligence State]` block in its context showing the current WAF profile, failure stats, MCTS recommendations, and knowledge graph summary.

### Agent Context Injection

Each middleware function produces an `agentContext` string that can be injected directly into the agent's next-turn prompt:

- **Tool failure**: `[Intelligence: Failure Analysis]\nReason: waf-blocked (85% confidence)\n...`
- **WAF detection**: `[WAF Detection] Cloudflare detected (88% confidence).\nMatched signatures: ...\nRecommended bypass strategies: ...`
- **MCTS plan**: `[Attack Path Analysis — MCTS Planner]\nRanked next actions:\n  1. Nmap Full Scan (tool: nmap, agent: recon-specialist)...`
- **Intelligence summary**: `[Intelligence State]\nWAF: Cloudflare (88%)\nTool failures: 5 total, top reasons: waf-blocked(3)...\n[/Intelligence State]`

---

## Testing

All modules have comprehensive unit tests using `node:test`:

```bash
bun test src/security/feedbackEngine.test.ts          # 35 tests
bun test src/security/statisticalVerifier.test.ts      # 18 tests
bun test src/security/wafDetection.test.ts             # 16 tests
bun test src/security/mctsPlanner.test.ts              # 24 tests
bun test src/security/knowledgeGraph.test.ts           # 19 tests
bun test src/security/oobVerification.test.ts          # 16 tests
bun test src/security/intelligenceMiddleware.test.ts   # 31 tests
```

Run all security tests:

```bash
bun test src/security/*.test.ts    # 207 tests across 26 files
```
