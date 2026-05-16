# agentmemory REST-Backed Memory Replacement

**Date:** 2026-05-16
**Status:** Draft

## Summary

Replace the file-based auto-memory system prompt with agentmemory's REST API when the agentmemory server is running. When agentmemory is not running, the old system prompt returns unchanged. Zero config, zero flags. Agent discovers agentmemory through skill descriptions.

## Motivation

Current system: LLM-as-retriever over `.md` files (slow, imprecise, consumes prompt budget). agentmemory provides BM25 + vector + graph hybrid search with RRF fusion — no LLM calls for retrieval, 95.2% R@5 on LongMemEval-S.

## Approach: Replace, Don't Stack

When agentmemory is running → `loadMemoryPrompt()` returns a 3-line replacement instead of the full file-based prompt. The agent sees "Use `memory-search` and `memory-save` skills" instead of "auto-memory files are stored as type/name.md in .netrunner/memory/...".

When agentmemory is not running → full existing prompt returns. Zero change.

Auto-memory file writes (extractMemories, agentMemory.ts, teamMemorySync) continue as a safety backup — they are the rollback if agentmemory data is lost. But the agent is no longer instructed to interact with them.

## What Changes

### 1. `src/memdir/memdir.ts` — `loadMemoryPrompt()` conditional

Add an inline helper:
```typescript
async function isAgentMemoryRunning(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), 300)
    const res = await fetch('http://localhost:3111/agentmemory/livez', { signal: ctrl.signal })
    clearTimeout(id)
    return res.ok
  } catch { return false }
}
```

Insert the agentmemory check AFTER the KAIROS branch but BEFORE auto/team:

```typescript
export async function loadMemoryPrompt(): Promise<string | null> {
  const autoEnabled = isAutoMemoryEnabled()
  const skipIndex = isRelevantMemoryPrefetchEnabled()

  // KAIROS daily-log is orthogonal to memory retrieval — not replaced
  if (feature('KAIROS') && autoEnabled && getKairosActive()) {
    logMemoryDirCounts(getAutoMemPath(), { memory_type: 'auto' })
    return buildAssistantDailyLogPrompt(skipIndex)
  }

  // agentmemory replaces file-based memory prompt when running
  if (await isAgentMemoryRunning()) {
    return [
      'A local agentmemory server is active at http://localhost:3111.',
      'Use the `memory-search` and `memory-save` skills for memory access.',
      'This replaces the file-based auto-memory prompt (backups still written to disk).',
    ].join('\n')
  }

  // ... rest unchanged (TEAMMEM, auto-only, disabled) ...
}
```

KAIROS is an append-only daily log format for the assistant's session activity — it is not memory retrieval and is orthogonal to agentmemory. The agentmemory check must be after the KAIROS return so KAIROS still works when both are active.

### 2. Two Bundled Skills

Each is a `registerBundledSkill()` call following the pattern in `src/skills/bundled/scopeGuard.ts` — a prompt instructing the agent step-by-step, using Bash/curl.

**`memory-search`** — `src/skills/bundled/memorySearch.ts`
- Description: "Semantic memory search using the local agentmemory server (BM25 + vector + graph hybrid). Faster and more accurate than grepping .md files."
- Prompt: check livez, POST query to `/agentmemory/smart-search` with `curl`, return top-5 with scores. If not running: "agentmemory not available — use file-based memory."
- `allowedTools: ['Bash', 'Read', 'Grep', 'Glob']`

**`memory-save`** — `src/skills/bundled/memorySave.ts`
- Description: "Save an observation, fact, or finding to the local agentmemory server. Extracts key concepts automatically."
- Prompt: check livez, POST content to `/agentmemory/remember` with `curl`. If not running: "agentmemory not available — save to file-based memory."
- `allowedTools: ['Bash', 'Write']`

### 3. API Reference (for skill prompts)

**`GET /agentmemory/livez`** → `200 OK` (server is ready) or no response/timed out

**`POST /agentmemory/smart-search`**
```json
{ "query": "search terms", "category": "fact", "limit": 5 }
```
→ `200`
```json
{ "results": [{ "id": "...", "title": "...", "content": "...", "score": 0.95, "created_at": "..." }] }
```

**`POST /agentmemory/remember`**
```json
{ "content": "observation text", "category": "observation", "tags": ["key-concepts"] }
```
→ `201`
```json
{ "id": "mem_..." }
```

### 4. `src/security/skillDefinitions.ts`

- Add `'memory-search'` and `'memory-save'` to `NetRunnerSkillName` union
- Add two definition objects to `NET_RUNNER_SKILL_DEFINITIONS` array

### 4. `src/skills/bundled/index.ts`

- Import and call `registerMemorySearchSkill()` and `registerMemorySaveSkill()`

### 5. `scripts/start-memory-server.ts`

Lifecycle script:
1. Detect agentmemory (`npx @agentmemory/agentmemory --version` or `node_modules`)
2. Spawn as child process on port 3111
3. Poll `GET /agentmemory/livez` with raw `fetch()` (300ms timeout, max 30s)
4. Write PID to `.netrunner/agentmemory.pid`
5. Cleanup on exit via `tree-kill`

### 6. `package.json`

```json
"memory:start": "bun run scripts/start-memory-server.ts"
```
```json
"optionalDependencies": {
  "@agentmemory/agentmemory": "^0.9.16"
}
```

## What Stays the Same

| File | Status |
|------|--------|
| `src/memdir/` (except `memdir.ts` `loadMemoryPrompt`) | Untouched |
| `src/services/extractMemories/` | Untouched |
| `src/utils/attachments.ts` — relevant_memories prefetch | Untouched |
| `src/utils/messages.ts` — memory attachment rendering | Untouched |
| `src/utils/netRunnerMd.ts` — memory file reading | Untouched |
| `src/utils/permissions/filesystem.ts` — auto-memory write carve-out | Untouched |
| `src/tools/AgentTool/agentMemory.ts` — agent-specific memory | Untouched |
| `src/services/teamMemorySync/` — team memory sync | Untouched |
| `src/constants/prompts.ts` — system prompt assembly | Untouched (hint inside loadMemoryPrompt) |

File-based memory **writes** continue (safety backup). Only the **prompt** changes.

## Agent Discovery Path

1. Agent reads system prompt → sees agentmemory hint (not file-based memory instructions)
2. Agent reads skill list → sees `memory-search` and `memory-save`
3. Agent calls `memory-search` → skill prompt instructs agent to curl agentmemory
4. If agentmemory is running → results returned
5. If agentmemory is NOT running → skill prompt says "not available, use file-based"
6. Agent falls back to grepping `.md` files or checking memory directories

If agentmemory starts mid-session, on the next turn `loadMemoryPrompt()` detects it and switches.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| agentmemory not installed | `bun run memory:start` offers to install via npx |
| agentmemory crashes mid-session | Next prompt rebuild detects dead server, falls back to old prompt |
| Port 3111 in use | Script logs warning, skips spawn |
| livez timeout (300ms) | Treated as "not running" → old prompt |
| curl fails in skill | Agent reports failure, falls back to file search |

## Testing

| Test | How |
|------|-----|
| Existing memory tests | Run `bun test src/memdir` — must pass unchanged |
| Existing skill tests | Run `bun test src/security/skills.test.ts` — must pass unchanged |
| Skill compilation | Skills register without error (startup smoke test) |
| `loadMemoryPrompt` agentmemory path | Can be verified by starting server and checking prompt output |
| `bun run build` | CLI builds successfully |

No integration test against live agentmemory server for v1 (requires Rust iii-engine binary).

## Implementation Order

1. Update `src/security/skillDefinitions.ts` — add type entries
2. Create `src/skills/bundled/memorySearch.ts`
3. Create `src/skills/bundled/memorySave.ts`
4. Update `src/skills/bundled/index.ts` — register both
5. Update `src/memdir/memdir.ts` — add `isAgentMemoryRunning()` + conditional in `loadMemoryPrompt()`
6. Create `scripts/start-memory-server.ts`
7. Update `package.json` — script + optionalDependency
8. `bun run build` + `bun run typecheck`
9. Run existing tests — confirm no regressions
