# Net-Runner Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Net-Runner repo into the first working `Net-Runner` slice: skill-first security-testing branding, workflow scaffolding, built-in specialist agents, and aligned operator docs.

**Architecture:** Add a small `src/security/` runtime surface for product metadata, workflow registry, and security skill definitions, then thread that through existing Net-Runner registration points instead of replacing the query loop. Keep MCP available, but make skills plus built-in tools the primary execution model and treat MCP as selective integration plumbing.

**Tech Stack:** Bun, TypeScript, existing Net-Runner tool/agent/skill system, Node test runner, markdown docs

---

## File Structure

### Runtime and metadata

- Create: `src/security/product.ts`
  - Central product metadata for `Net-Runner` naming, docs links, and CLI labels.
- Create: `src/security/workflows.ts`
  - Typed registry for engagement workflows, capability packs, and default skill mapping.

### Skills and agents

- Create: `src/skills/bundled/engagementSetup.ts`
- Create: `src/skills/bundled/reconPlan.ts`
- Create: `src/skills/bundled/evidenceCapture.ts`
- Create: `src/skills/bundled/scopeGuard.ts`
  - New bundled skills aligned to security testing workflows.
- Create: `src/tools/AgentTool/built-in/engagementLeadAgent.ts`
- Create: `src/tools/AgentTool/built-in/reconSpecialistAgent.ts`
- Create: `src/tools/AgentTool/built-in/webTestingSpecialistAgent.ts`
  - Built-in security specialists for the existing agent runtime.

### Existing files to modify

- Modify: `package.json`
  - Rename package/bin surface and update metadata/scripts where required.
- Modify: `bin/net-runner`
  - Update boot message and compatibility text.
- Create: `bin/net-runner`
  - Primary CLI entrypoint.
- Modify: `README.md`
  - Reframe product, install, quickstart, workflows, and architecture.
- Modify: `src/skills/bundled/index.ts`
  - Register security bundled skills.
- Modify: `src/tools/AgentTool/builtInAgents.ts`
  - Register security-first specialist agents.
- Modify: `src/components/HelpV2/HelpV2.tsx`
  - Update title/docs link and orientation copy.
- Modify: `src/commands.ts`
  - Update high-level descriptions where product branding is baked in.

### Tests

- Create: `src/security/product.test.ts`
  - Verify canonical brand metadata and CLI names.
- Create: `src/security/workflows.test.ts`
  - Verify workflow registry coverage and skill-first capability modeling.

### Docs

- Create: `docs/workflows/overview.md`
  - Operator-facing workflow map for the first Net-Runner slice.
- Create: `docs/capabilities/skills-first-architecture.md`
  - Explain why skills and code execution lead, with MCP as integration support.

### Task 1: Add Product Metadata Surface

**Files:**
- Create: `src/security/product.test.ts`
- Create: `src/security/product.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  NET_RUNNER_BRAND,
  getPrimaryCliName,
  getSupportedCliAliases,
} from './product.js'

test('Net-Runner brand metadata exposes the new primary CLI identity', () => {
  assert.equal(NET_RUNNER_BRAND.productName, 'Net-Runner')
  assert.equal(getPrimaryCliName(), 'net-runner')
  assert.deepEqual(getSupportedCliAliases(), ['net-runner', 'net-runner'])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/security/product.test.ts`
Expected: FAIL because `src/security/product.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement `src/security/product.ts` with:

- `NET_RUNNER_BRAND` object
- `getPrimaryCliName()`
- `getSupportedCliAliases()`
- docs URL and one-line product description helpers for reuse in UI/docs

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/security/product.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/security/product.ts src/security/product.test.ts
git commit -m "feat: add Net-Runner product metadata"
```

### Task 2: Add Security Workflow Registry

**Files:**
- Create: `src/security/workflows.test.ts`
- Create: `src/security/workflows.ts`
- Modify: `src/security/product.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SECURITY_WORKFLOWS,
  findWorkflow,
  getCapabilityPack,
} from './workflows.js'

test('workflow registry is skill-first and includes web + lab testing flows', () => {
  assert.ok(findWorkflow('web-app-testing'))
  assert.ok(findWorkflow('lab-target-testing'))
  assert.equal(getCapabilityPack('web')?.primaryExecutionModel, 'skills-and-tools')
  assert.ok(
    SECURITY_WORKFLOWS.every(workflow => workflow.defaultSkills.length > 0),
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/security/workflows.test.ts`
Expected: FAIL because `src/security/workflows.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement:

- typed workflow definitions for `web-app-testing`, `api-testing`, `lab-target-testing`, `ctf-mode`
- capability pack definitions with `primaryExecutionModel: 'skills-and-tools'`
- lookup helpers `findWorkflow()` and `getCapabilityPack()`
- import brand metadata only if needed for shared descriptions

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/security/workflows.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/security/workflows.ts src/security/workflows.test.ts src/security/product.ts
git commit -m "feat: add Net-Runner workflow registry"
```

### Task 3: Convert Package and CLI Branding

**Files:**
- Modify: `package.json`
- Modify: `bin/net-runner`
- Create: `bin/net-runner`
- Modify: `README.md`
- Modify: `src/components/HelpV2/HelpV2.tsx`
- Modify: `src/commands.ts`
- Modify: `src/security/product.ts`

- [ ] **Step 1: Write the failing test**

Use the existing product metadata tests as the contract and extend `src/security/product.test.ts` with assertions for:

```ts
assert.match(NET_RUNNER_BRAND.description, /security-first/i)
assert.match(NET_RUNNER_BRAND.docsUrl, /net-runner|security/i)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/security/product.test.ts`
Expected: FAIL on the new assertions.

- [ ] **Step 3: Write minimal implementation**

Update:

- package name/bin metadata to make `net-runner` the primary CLI while retaining `net-runner` compatibility alias
- entrypoint script text in `bin/net-runner`
- add `bin/net-runner` with the same runtime bootstrap
- README framing, install, quickstart, workflow overview, and skill-first architecture notes
- Help dialog title/docs link/product references
- command description strings that explicitly mention `Net-Runner` or `Net-Runner` where operator-facing branding matters

- [ ] **Step 4: Run tests and targeted verification**

Run:

```bash
node --test src/security/product.test.ts
bun run smoke
```

Expected:

- product metadata test passes
- smoke command exits successfully and prints version output

- [ ] **Step 5: Commit**

```bash
git add package.json bin/net-runner bin/net-runner README.md src/components/HelpV2/HelpV2.tsx src/commands.ts src/security/product.ts src/security/product.test.ts
git commit -m "feat: rename Net-Runner surface to Net-Runner"
```

### Task 4: Add Skill-First Security Bundled Skills

**Files:**
- Create: `src/skills/bundled/engagementSetup.ts`
- Create: `src/skills/bundled/reconPlan.ts`
- Create: `src/skills/bundled/evidenceCapture.ts`
- Create: `src/skills/bundled/scopeGuard.ts`
- Modify: `src/skills/bundled/index.ts`
- Modify: `src/security/workflows.ts`

- [ ] **Step 1: Write the failing test**

Extend `src/security/workflows.test.ts` with assertions such as:

```ts
assert.deepEqual(findWorkflow('web-app-testing')?.defaultSkills, [
  'engagement-setup',
  'scope-guard',
  'recon-plan',
  'evidence-capture',
])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/security/workflows.test.ts`
Expected: FAIL because the workflow defaults are not wired to the new skill names yet.

- [ ] **Step 3: Write minimal implementation**

Implement four bundled skills using the existing `registerBundledSkill()` pattern:

- `engagement-setup`: gather scope, targets, constraints, environment, and desired workflow
- `scope-guard`: enforce authorization/scope thinking before risky actions
- `recon-plan`: produce phased recon and enumeration approach
- `evidence-capture`: structure artifacts, findings, and report notes

Register them from `src/skills/bundled/index.ts` and wire the workflow registry defaults to these skill names.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/security/workflows.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/skills/bundled/engagementSetup.ts src/skills/bundled/reconPlan.ts src/skills/bundled/evidenceCapture.ts src/skills/bundled/scopeGuard.ts src/skills/bundled/index.ts src/security/workflows.ts src/security/workflows.test.ts
git commit -m "feat: add Net-Runner bundled security skills"
```

### Task 5: Add Built-In Security Specialist Agents

**Files:**
- Create: `src/tools/AgentTool/built-in/engagementLeadAgent.ts`
- Create: `src/tools/AgentTool/built-in/reconSpecialistAgent.ts`
- Create: `src/tools/AgentTool/built-in/webTestingSpecialistAgent.ts`
- Modify: `src/tools/AgentTool/builtInAgents.ts`
- Modify: `src/security/workflows.ts`

- [ ] **Step 1: Write the failing test**

Add a new test file `src/security/agents.test.ts` with:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { getNetRunnerBuiltInAgentTypes } from './workflows.js'

test('Net-Runner publishes security specialist built-in agent types', () => {
  assert.deepEqual(getNetRunnerBuiltInAgentTypes(), [
    'engagement-lead',
    'recon-specialist',
    'web-testing-specialist',
  ])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/security/agents.test.ts`
Expected: FAIL because the helper and agent definitions do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement built-in agents modeled after the existing built-in agent definitions:

- `engagement-lead` for orchestration and workflow routing
- `recon-specialist` for discovery and enumeration
- `web-testing-specialist` for HTTP/app testing

Expose a helper from `src/security/workflows.ts` listing the canonical built-in security agent types and register the new agents in `src/tools/AgentTool/builtInAgents.ts`.

- [ ] **Step 4: Run tests and verification**

Run:

```bash
node --test src/security/agents.test.ts src/security/workflows.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/security/agents.test.ts src/security/workflows.ts src/tools/AgentTool/built-in/engagementLeadAgent.ts src/tools/AgentTool/built-in/reconSpecialistAgent.ts src/tools/AgentTool/built-in/webTestingSpecialistAgent.ts src/tools/AgentTool/builtInAgents.ts
git commit -m "feat: add Net-Runner specialist agents"
```

### Task 6: Add Operator Docs for Skills-First Architecture

**Files:**
- Create: `docs/workflows/overview.md`
- Create: `docs/capabilities/skills-first-architecture.md`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**

No code test. Instead define a verification contract in the docs:

- workflow overview must mention `web-app-testing`, `api-testing`, `lab-target-testing`, and `ctf-mode`
- architecture doc must state that MCP is selective and skills/code execution are primary

- [ ] **Step 2: Run verification to confirm docs are absent/incomplete**

Run:

```bash
test -f docs/workflows/overview.md
test -f docs/capabilities/skills-first-architecture.md
```

Expected: commands fail because files do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add docs that align with the workflow registry and README.

- [ ] **Step 4: Run verification**

Run:

```bash
rg -n "web-app-testing|api-testing|lab-target-testing|ctf-mode" docs/workflows/overview.md
rg -n "skills|code execution|MCP" docs/capabilities/skills-first-architecture.md
```

Expected: each command returns matching lines.

- [ ] **Step 5: Commit**

```bash
git add docs/workflows/overview.md docs/capabilities/skills-first-architecture.md README.md
git commit -m "docs: add Net-Runner workflow and architecture docs"
```

### Task 7: Run Full Verification for This Slice

**Files:**
- Modify: none unless verification reveals issues

- [ ] **Step 1: Run targeted tests**

Run:

```bash
node --test src/security/product.test.ts src/security/workflows.test.ts src/security/agents.test.ts
```

Expected: PASS

- [ ] **Step 2: Run project verification**

Run:

```bash
bun run typecheck
bun run smoke
```

Expected:

- typecheck exits 0
- smoke exits 0

- [ ] **Step 3: Re-read spec and confirm alignment**

Check against: `docs/superpowers/specs/2026-04-02-net-runner-design.md`

Verify this slice covers:

- rename groundwork
- skill-first architecture
- workflow registry
- specialist agents
- aligned docs

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: finalize Net-Runner foundation slice"
```

