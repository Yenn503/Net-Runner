# agentmemory REST-Backed Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace file-based memory system prompt with agentmemory REST API when server is running, with fallback to existing system.

**Architecture:** Three new files (two skills, one lifecycle script), four single-line changes to existing files. When agentmemory server is detected via `GET /agentmemory/livez`, `loadMemoryPrompt()` returns a 3-line skill hint instead of the full file-based memory prompt. The agent discovers agentmemory through skill descriptions and uses Bash/curl to call the REST API.

**Tech Stack:** TypeScript, Bun, `@agentmemory/agentmemory` (v0.9.16), `tree-kill` (already in deps)

**Spec:** `docs/superpowers/specs/2026-05-16-agentmemory-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/security/skillDefinitions.ts` | Modify | Add `'memory-search'` and `'memory-save'` to type union + definition array |
| `src/skills/bundled/memorySearch.ts` | Create | `registerMemorySearchSkill()` — prompt instructs agent to curl `/agentmemory/smart-search` |
| `src/skills/bundled/memorySave.ts` | Create | `registerMemorySaveSkill()` — prompt instructs agent to curl `/agentmemory/remember` |
| `src/skills/bundled/index.ts` | Modify | Import and register both new skills |
| `src/memdir/memdir.ts` | Modify | Add `isAgentMemoryRunning()` helper + conditional return in `loadMemoryPrompt()` |
| `scripts/start-memory-server.ts` | Create | Spawn agentmemory subprocess, poll livez, write PID, cleanup on exit |
| `package.json` | Modify | Add `memory:start` script + optionalDependency |

## Tasks

### Task 1: Add skill definitions to `skillDefinitions.ts`

**Files:**
- Modify: `src/security/skillDefinitions.ts`
- Verify: `src/security/skills.test.ts`

- [ ] **Step 1: Add names to the union type**

```typescript
// In NetRunnerSkillName, add after 'binary-exploitation':
  | 'memory-search'
  | 'memory-save'
```

- [ ] **Step 2: Add definition objects to the array**

```typescript
// In NET_RUNNER_SKILL_DEFINITIONS, add before `] as const`:
  {
    name: 'memory-search',
    title: 'Memory Search',
    description:
      'Semantic memory search using the local agentmemory server (BM25 + vector + graph hybrid). Faster and more accurate than grepping .md files.',
    primaryExecutionModel: 'skills-and-tools',
  },
  {
    name: 'memory-save',
    title: 'Memory Save',
    description:
      'Save an observation, fact, or finding to the local agentmemory server for future semantic retrieval. Extracts key concepts automatically.',
    primaryExecutionModel: 'skills-and-tools',
  },
```

- [ ] **Step 3: Run existing tests to verify no breakage**

Run: `bun run build 2>&1 | tail -5`
Expected: Build succeeds, no type errors.

Run: `bun test src/security/skills.test.ts 2>&1 | tail -10`
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/security/skillDefinitions.ts
git commit -m "feat: add memory-search and memory-save skill definitions"
```

---

### Task 2: Create `memorySearch` bundled skill

**Files:**
- Create: `src/skills/bundled/memorySearch.ts`
- Verify: Startup smoke test

- [ ] **Step 1: Write the skill file**

```typescript
import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerMemorySearchSkill(): void {
  const definition = getNetRunnerSkillDefinition('memory-search')
  if (!definition) throw new Error('Missing Net-Runner skill definition: memory-search')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Grep', 'Glob'],
    argumentHint: '[semantic search query]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Memory Search

Search the local agentmemory server using semantic (BM25 + vector + graph hybrid) search.

Query: ${args || '(ask the user what to search for)'}

## Steps

1. Check agentmemory is running:
   \`\`\`
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3111/agentmemory/livez
   \`\`\`
   If not 200, reply "agentmemory server not running — use file-based memory search instead."

2. POST the search query:
   \`\`\`
   curl -s -X POST http://localhost:3111/agentmemory/smart-search \
     -H "Content-Type: application/json" \
     -d '{"query": "<search terms>", "limit": 5}'
   \`\`\`

3. Parse the JSON response and present the top results with their relevance scores.

4. If the server returns an error, fall back to grepping .md memory files.`,
        },
      ]
    },
  })
}
```

- [ ] **Step 2: Verify it compiles**

Run: `bun run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/skills/bundled/memorySearch.ts
git commit -m "feat: create memory-search bundled skill"
```

---

### Task 3: Create `memorySave` bundled skill

**Files:**
- Create: `src/skills/bundled/memorySave.ts`
- Verify: Startup smoke test

- [ ] **Step 1: Write the skill file**

```typescript
import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerMemorySaveSkill(): void {
  const definition = getNetRunnerSkillDefinition('memory-save')
  if (!definition) throw new Error('Missing Net-Runner skill definition: memory-save')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Write'],
    argumentHint: '[observation or fact to remember]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Memory Save

Save an observation, fact, or finding to the local agentmemory server.
The server automatically extracts key concepts and indexes for future retrieval.

Content to save: ${args || '(ask the user what to remember)'}

## Steps

1. Check agentmemory is running:
   \`\`\`
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3111/agentmemory/livez
   \`\`\`
   If not 200, reply "agentmemory server not running — save to file-based memory instead."

2. POST the content:
   \`\`\`
   curl -s -X POST http://localhost:3111/agentmemory/remember \
     -H "Content-Type: application/json" \
     -d '{"content": "<observation text>", "category": "observation"}'
   \`\`\`

3. Confirm the response includes an id field.

4. If the server returns an error, fall back to writing a memory .md file.`,
        },
      ]
    },
  })
}
```

- [ ] **Step 2: Verify it compiles**

Run: `bun run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/skills/bundled/memorySave.ts
git commit -m "feat: create memory-save bundled skill"
```

---

### Task 4: Register skills in `skills/bundled/index.ts`

**Files:**
- Modify: `src/skills/bundled/index.ts`

- [ ] **Step 1: Add imports**

```typescript
// In the import block, add after binaryExploitation import:
import { registerMemorySearchSkill } from './memorySearch.js'
import { registerMemorySaveSkill } from './memorySave.js'
```

- [ ] **Step 2: Add registration calls**

```typescript
// In the registration block, add after registerBinaryExploitationSkill():
  registerMemorySearchSkill()
  registerMemorySaveSkill()
```

- [ ] **Step 3: Verify it compiles**

Run: `bun run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/skills/bundled/index.ts
git commit -m "feat: register memory-search and memory-save skills"
```

---

### Task 5: Add agentmemory detection to `loadMemoryPrompt`

**Files:**
- Modify: `src/memdir/memdir.ts`
- Verify: Existing memory tests pass

- [ ] **Step 1: Add `isAgentMemoryRunning` helper before `loadMemoryPrompt`**

```typescript
// Add before loadMemoryPrompt() — after the buildMemoryLines function (line ~408)
async function isAgentMemoryRunning(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), 300)
    const res = await fetch('http://localhost:3111/agentmemory/livez', {
      signal: ctrl.signal,
    })
    clearTimeout(id)
    return res.ok
  } catch {
    return false
  }
}
```

- [ ] **Step 2: Add agentmemory check in `loadMemoryPrompt` after KAIROS branch**

After the KAIROS block (after `return buildAssistantDailyLogPrompt(skipIndex)` on line 435), add:

```typescript
  // agentmemory replaces file-based memory prompt when server is running
  if (await isAgentMemoryRunning()) {
    return [
      'A local agentmemory server is active at http://localhost:3111.',
      'Use the `memory-search` and `memory-save` skills for memory access.',
      'This replaces the file-based auto-memory prompt (backups still written to disk).',
    ].join('\n')
  }
```

- [ ] **Step 3: Run existing memory tests**

Run: `bun test src/memdir 2>&1 | tail -20`
Expected: All tests PASS.

- [ ] **Step 4: Run full build**

Run: `bun run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/memdir/memdir.ts
git commit -m "feat: add agentmemory detection to loadMemoryPrompt"
```

---

### Task 6: Create lifecycle script `scripts/start-memory-server.ts`

**Files:**
- Create: `scripts/start-memory-server.ts`

- [ ] **Step 1: Write the lifecycle script**

```typescript
import { spawn } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { resolve } from 'path'
import treeKill from 'tree-kill'

const PORT = 3111
const PID_PATH = resolve('.netrunner/agentmemory.pid')
const LIVECZ_URL = `http://localhost:${PORT}/agentmemory/livez`
const POLL_INTERVAL = 500
const POLL_TIMEOUT = 30000

async function isRunning(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), 300)
    const res = await fetch(LIVECZ_URL, { signal: ctrl.signal })
    clearTimeout(id)
    return res.ok
  } catch {
    return false
  }
}

async function waitForReady(): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT
  while (Date.now() < deadline) {
    if (await isRunning()) return
    await new Promise(r => setTimeout(r, POLL_INTERVAL))
  }
  throw new Error('agentmemory failed to start within 30s')
}

async function main() {
  // Check if already running
  if (await isRunning()) {
    console.log('agentmemory already running on port', PORT)
    process.exit(0)
  }

  // Check if agentmemory is installed
  const pkg = '@agentmemory/agentmemory'
  const pkgDir = resolve('node_modules', pkg)
  if (!existsSync(pkgDir)) {
    console.log('agentmemory not installed. Run: bun add', pkg)
    process.exit(1)
  }

  console.log('Starting agentmemory on port', PORT, '...')

  const proc = spawn('npx', [pkg, '--port', String(PORT)], {
    stdio: 'pipe',
    detached: false,
  })

  proc.stdout?.on('data', (d: Buffer) => process.stdout.write(d))
  proc.stderr?.on('data', (d: Buffer) => process.stderr.write(d))

  proc.on('error', (err: Error) => {
    console.error('Failed to start agentmemory:', err.message)
    process.exit(1)
  })

  proc.on('exit', (code: number | null) => {
    console.log('agentmemory exited with code', code)
    unlink(PID_PATH).catch(() => {})
  })

  // Wait for ready
  let started = false
  try {
    await waitForReady()
    started = true
  } catch (err) {
    console.error(String(err))
    treeKill(proc.pid!, 'SIGTERM')
    process.exit(1)
  }

  // Write PID file
  if (proc.pid) {
    await writeFile(PID_PATH, String(proc.pid), 'utf8')
  }

  console.log('agentmemory ready on port', PORT)

  // Cleanup on exit — use tree-kill to kill the entire process tree
  const cleanup = () => {
    if (proc.pid) treeKill(proc.pid, 'SIGTERM')
    unlink(PID_PATH).catch(() => {})
    process.exit()
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('exit', () => {
    if (proc.pid) treeKill(proc.pid, 'SIGTERM')
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Verify it parses**

Run: `bun run scripts/start-memory-server.ts 2>&1 | head -5`
Expected: Either reports "already running", "not installed", or actually starts. We won't have agentmemory installed so it should say "agentmemory not installed" and exit 1. That's the correct path when the dependency isn't present.

- [ ] **Step 3: Commit**

```bash
git add scripts/start-memory-server.ts
git commit -m "feat: add start-memory-server lifecycle script"
```

---

### Task 7: Update `package.json`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add `memory:start` script**

```json
    "memory:start": "bun run scripts/start-memory-server.ts",
```

Insert alphabetically near other scripts (after `mcp:stdio` on line 51).

- [ ] **Step 2: Add optionalDependency**

```json
  "optionalDependencies": {
    "@agentmemory/agentmemory": "^0.9.16"
  }
```

Add as a new section after `devDependencies` (after line 147).

- [ ] **Step 3: Verify build still works**

Run: `bun run build 2>&1 | tail -5`
Expected: Build succeeds. The optional dependency won't be installed but `bun install` won't fail.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add memory:start script and agentmemory optional dependency"
```

---

### Task 8: Full verification pass

**Files:**
- All modified/created files

- [ ] **Step 1: Run full build**

Run: `bun run build 2>&1`
Expected: CLI builds to `dist/cli.mjs` successfully, no errors.

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck 2>&1`
Expected: tsc passes with no errors.

- [ ] **Step 3: Run existing memory tests**

Run: `bun test src/memdir 2>&1 | tail -20`
Expected: All tests PASS.

- [ ] **Step 4: Run existing skill tests**

Run: `bun test src/security/skills.test.ts 2>&1 | tail -20`
Expected: All tests PASS.

- [ ] **Step 5: Run smoke test**

Run: `node dist/cli.mjs --version 2>&1`
Expected: Prints version string.

- [ ] **Step 6: Verify `memory:start` script runs correctly (without agentmemory installed)**

Run: `bun run memory:start 2>&1`
Expected: "agentmemory not installed. Run: bun add @agentmemory/agentmemory" and exit code 1.

- [ ] **Step 7: Verify loadMemoryPrompt unchanged when agentmemory not running**

The `loadMemoryPrompt()` function should still return the full file-based prompt when agentmemory isn't running. This is the default path and requires no special verification beyond passing existing tests.

- [ ] **Step 8: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address build/test issues from agentmemory integration"
```
