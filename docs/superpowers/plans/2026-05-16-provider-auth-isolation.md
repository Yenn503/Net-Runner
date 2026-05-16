# Provider Auth Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate provider auth overlaps, edge cases, and confusing flows — make every launch path seamless and unambiguous.

**Architecture:** Changes confined to `scripts/setup.ts`, `scripts/provider-launch.ts`, and `src/utils/providerProfile.ts`. Each task is isolated (touches different functions/branches) so they can be implemented independently. The core principle: **profile values always beat shell env for shared variables**, and each provider owns a unique env var namespace.

**Tech Stack:** TypeScript, Node.js (Bun runtime), JSON profile files

---

### Task 1: Namespace isolation — copilot and github profiles don't read OPENAI_API_KEY from shell

**Problem:** `buildLaunchEnv()` copilot branch reads `processEnv.OPENAI_API_KEY || persistedEnv.OPENAI_API_KEY`. If a user has a stale `OPENAI_API_KEY` in their shell, it silently overrides the Copilot service token. Same issue in the github branch: `sanitizeApiKey(processEnv.GITHUB_TOKEN)` — if the token moved or was revoked, the profile's own `GITHUB_TOKEN` should be authoritative.

**Files:**
- Modify: `src/utils/providerProfile.ts:391-394` (copilot env)
- Modify: `src/utils/providerProfile.ts:433-436` (github token resolution)

- [ ] **Step 1: Change copilot branch to prefer persisted OPENAI_API_KEY over shell**

In `src/utils/providerProfile.ts`, copilot branch (around line 391), change:
```typescript
env.OPENAI_API_KEY =
  processEnv.OPENAI_API_KEY ||
  persistedEnv.OPENAI_API_KEY ||
  ''
```
To:
```typescript
env.OPENAI_API_KEY =
  persistedEnv.OPENAI_API_KEY ||
  processEnv.OPENAI_API_KEY ||
  ''
```

The Copilot service token lives in the profile and must never be overridden by a stale shell env.

- [ ] **Step 2: Change github branch to prefer persisted GITHUB_TOKEN over shell**

In `src/utils/providerProfile.ts`, github branch (around line 433), change:
```typescript
const githubToken =
  sanitizeApiKey(processEnv.GITHUB_TOKEN) ||
  sanitizeApiKey(processEnv.GH_TOKEN) ||
  sanitizeApiKey(persistedEnv.GITHUB_TOKEN)
```
To:
```typescript
const githubToken =
  sanitizeApiKey(persistedEnv.GITHUB_TOKEN) ||
  sanitizeApiKey(processEnv.GITHUB_TOKEN) ||
  sanitizeApiKey(processEnv.GH_TOKEN)
```

If the user has an enrolled github profile on disk, the profile's token should be the source of truth. Shell env only used as fallback.

- [ ] **Step 3: Verify the openai profile still prefers shell env (expected behavior)**

In `src/utils/providerProfile.ts`, openai branch (around line 545), the current order is correct for this profile:
```typescript
env.OPENAI_API_KEY = processEnv.OPENAI_API_KEY || persistedEnv.OPENAI_API_KEY
```
Keep as-is. OpenAI API keys are frequently rotated by users via shell env, unlike Copilot service tokens.

- [ ] **Step 4: Review changes**

Re-read the modified regions to ensure no other branches have the same issue (codex, ollama, gemini don't use `OPENAI_API_KEY` from the shared namespace, so they're fine).

---

### Task 2: Anthropic profile backup/restore

**Problem:** Selecting Anthropic in setup (`scripts/setup.ts:526-551`) permanently deletes `.net-runner-profile.json`. If the user selected Anthropic accidentally or wants to switch back, their profile is gone.

**Files:**
- Modify: `scripts/setup.ts:526-551`

- [ ] **Step 1: Backup profile before deleting**

Around line 527, change:
```typescript
if (provider === 'anthropic') {
  let removedProfile = false
  if (existsSync(PROFILE_PATH)) {
    try {
      rmSync(PROFILE_PATH, { force: true })
      removedProfile = true
    } catch (err) {
```
To:
```typescript
if (provider === 'anthropic') {
  let removedProfile = false
  if (existsSync(PROFILE_PATH)) {
    try {
      const backupPath = PROFILE_PATH + '.bak'
      copyFileSync(PROFILE_PATH, backupPath)
      rmSync(PROFILE_PATH, { force: true })
      removedProfile = true
    } catch (err) {
```

- [ ] **Step 2: Offer restore when user switches back to a profile provider**

In the `pickProvider` function or after `provider` is selected (around line 553 where preset is resolved), add a restore check:

```typescript
if (provider !== 'anthropic') {
  const backupPath = PROFILE_PATH + '.bak'
  if (existsSync(backupPath) && !existsSync(PROFILE_PATH)) {
    console.log()
    console.log(yellow('A previous profile backup was found.'))
    const restore = (await prompt(rl, dim('Restore it? [Y/n]: '))).trim().toLowerCase()
    if (restore === '' || restore === 'y' || restore === 'yes') {
      copyFileSync(backupPath, PROFILE_PATH)
      rmSync(backupPath, { force: true })
      console.log(green('✔ Restored previous profile.'))
      console.log(dim('  Launch with: bun run dev:profile'))
      console.log()
      return
    }
  }
}
```

Also add `copyFileSync` import from `node:fs` at the top of the file.

---

### Task 3: Auto-detect warning when multiple providers detected

**Problem:** `selectAutoProfile()` (providerProfile.ts:284-308) silently picks github if multiple env vars are set. User might expect Gemini or OpenAI to be used.

**Files:**
- Modify: `src/utils/providerProfile.ts:284-308`

- [ ] **Step 1: Add multi-provider detection warning**

After the github detection branch (line 298-299) and before the openai branch (line 304), add a warning when multiple provider keys are detected:

```typescript
// Warn if multiple provider credentials are present — the priority order
// (github > openai > gemini) may surprise users who set more than one.
const detectedProviders: string[] = []
if (env.GITHUB_TOKEN || env.GH_TOKEN || looksLikeGithubToken(openAiKey)) detectedProviders.push('github')
if (openAiKey && openAiKey !== 'SUA_CHAVE') detectedProviders.push('openai')
if (env.GEMINI_API_KEY) detectedProviders.push('gemini')
if (detectedProviders.length > 1) {
  console.warn(`[net-runner] Multiple provider credentials detected: ${detectedProviders.join(', ')}. Auto-selected "${'github'}" (priority order: github > openai > gemini). Set only the one you intend, or use an explicit launch command like \`bun run dev:openai\`.`)
}
```

But wait — `selectAutoProfile()` is used both in the CLI (where console.warn is visible) and potentially in tests/automation. The warning should only fire in interactive contexts. A simple way: just log it. The user will see it once and adjust.

Actually, looking at how it's called — only in `provider-launch.ts:166` — console.warn is fine.

---

### Task 4: NETRUNNER_PROVIDER flag for GitHub vs Copilot disambiguation

**Problem:** Both `github` and `copilot` profiles set `NETRUNNER_USE_GITHUB: '1'` and `NETRUNNER_USE_OPENAI: '1'`. The only distinguishing flag is `NETRUNNER_USE_COPILOT`. At runtime, `resolveProviderRequest()` checks `NETRUNNER_USE_GITHUB` but not `NETRUNNER_USE_COPILOT` — disambiguation relies on the URL. A `NETRUNNER_PROVIDER` flag makes intent explicit.

**Note:** This task was partially done — `NETRUNNER_PROFILE_NAME` is already set in `provider-launch.ts:292`. We just need to make it a `NETRUNNER_PROVIDER` flag and have `resolveProviderRequest` or the auth layer check it.

**Files:**
- Modify: `src/utils/providerProfile.ts:375-380` (copilot env flags)
- Modify: `src/utils/providerProfile.ts:416-420` (github env flags)
- Modify (review): `src/services/api/providerConfig.ts:210-253` (add NETRUNNER_PROVIDER check)

- [ ] **Step 1: Set NETRUNNER_PROVIDER in both copilot and github env**

In the copilot branch (line 375-380), add:
```typescript
NETRUNNER_PROVIDER: 'copilot',
```

In the github branch (line 416-420), add:
```typescript
NETRUNNER_PROVIDER: 'github',
```

Also add `NETRUNNER_PROVIDER` to the clean-up `delete` calls if it's deleted elsewhere (it's not currently set, so no cleanup needed).

- [ ] **Step 2: Document in resolveProviderRequest**

In `src/services/api/providerConfig.ts`, `resolveProviderRequest()` function, add a reference check. This is mainly for documentation and future-proofing:

```typescript
// NETRUNNER_PROVIDER explicitly disambiguates copilot from github when
// both set NETRUNNER_USE_GITHUB. Currently the URL (api.githubcopilot.com
// vs models.github.ai/inference) serves the same purpose.
const providerName = process.env.NETRUNNER_PROVIDER
```

Don't actually change the transport logic — the URL-based routing works correctly. The `NETRUNNER_PROVIDER` flag is for diagnostic clarity and future use.

---

### Task 5: SUA_CHAVE check at profile load time

**Problem:** The `SUA_CHAVE` sentinel (Portuguese for "YOUR_KEY") is only checked at validation time (`validateProviderEnvForStartupOrExit`) and in specific branches of `provider-launch.ts`. If the sentinel is persisted to disk (e.g., user ran `--force` and pasted it), it's not caught at profile load, causing confusing launch failures.

**Files:**
- Modify: `src/utils/providerProfile.ts:230-263` (`loadProfileFile`)

- [ ] **Step 1: Check for SUA_CHAVE in loaded profile env**

In `loadProfileFile()`, after the env object is validated (around line 253, before the return), scan for sentinel values:

```typescript
// Reject persisted sentinel values that would cause confusing auth failures.
const sentinelKeys = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'GITHUB_TOKEN', 'CODEX_API_KEY']
for (const key of sentinelKeys) {
  const val = parsed.env[key]
  if (typeof val === 'string' && val === 'SUA_CHAVE') {
    delete parsed.env[key]
  }
}
```

This silently strips sentinel values at load time instead of letting them propagate to validation. If after stripping, the env is empty of credentials, the caller's validation logic will handle it naturally.

---

### Task 6: Remove GOOGLE_API_KEY fallback

**Problem:** `GOOGLE_API_KEY` is a general Google Cloud key, not a Gemini API key. Using it as a fallback for `GEMINI_API_KEY` causes confusing auth errors if the key lacks Generative Language API access.

**Files:**
- Modify: `src/utils/providerProfile.ts:77-105` (`buildGeminiProfileEnv`)
- Modify: `src/utils/providerProfile.ts:324-327` (shell gemini key in `buildLaunchEnv`)
- Modify: `src/utils/providerProfile.ts:353` (delete GOOGLE_API_KEY — keep this cleanup)
- Modify: `scripts/setup.ts:104` (gemini `detectFromEnv`)

- [ ] **Step 1: Remove GOOGLE_API_KEY fallback from buildGeminiProfileEnv**

Change:
```typescript
const key = sanitizeApiKey(
  options.apiKey ??
    processEnv.GEMINI_API_KEY ??
    processEnv.GOOGLE_API_KEY,
)
```
To:
```typescript
const key = sanitizeApiKey(
  options.apiKey ??
    processEnv.GEMINI_API_KEY,
)
```

- [ ] **Step 2: Remove GOOGLE_API_KEY fallback from buildLaunchEnv gemini branch**

Change:
```typescript
const shellGeminiKey = sanitizeApiKey(
  processEnv.GEMINI_API_KEY ?? processEnv.GOOGLE_API_KEY,
)
```
To:
```typescript
const shellGeminiKey = sanitizeApiKey(
  processEnv.GEMINI_API_KEY,
)
```

- [ ] **Step 3: Remove GOOGLE_API_KEY from gemini detectFromEnv in setup.ts**

Change:
```typescript
detectFromEnv: () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
```
To:
```typescript
detectFromEnv: () => process.env.GEMINI_API_KEY,
```

- [ ] **Step 4: Keep GOOGLE_API_KEY cleanup (delete it)**

In `buildLaunchEnv` gemini branch, the `delete env.GOOGLE_API_KEY` (line 353) should stay. We still want to clean up any stray `GOOGLE_API_KEY` that might be in the environment — we just don't want to use it as a credential.

---

### Task 7: Copilot refresh profile validation

**Problem:** `refreshCopilotTokenIfExpired()` reads `.net-runner-profile.json` from disk and writes the refreshed Copilot token into it without verifying the profile type is still `copilot`. If the profile was switched between load and refresh, it could corrupt another provider's profile.

**Files:**
- Modify: `scripts/provider-launch.ts:386-397`

- [ ] **Step 1: Verify profile type before writing refreshed token**

In `refreshCopilotTokenIfExpired()`, around line 389, add a profile type check:

```typescript
const current = JSON.parse(readFileSync(profilePath, 'utf8'))
if (current.profile !== 'copilot') {
  // Profile was switched since launch — don't write Copilot tokens into it.
  if (verbose) console.log('Profile on disk is no longer copilot; skipping token persist.')
  return
}
```

Also wrap or indent the existing write logic inside this guard.

---

## Review Loop

After writing the plan, dispatch plan-document-reviewer subagent.

## Execution Handoff

After plan review passes, offer Subagent-Driven or Inline execution.
