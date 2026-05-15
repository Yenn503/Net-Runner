# Net-Runner Bugfix Log

Tracks every fix landed on the `v0.2-stabilize` branch (and beyond). Append-only. New entries on top.

Format:
```
## [YYYY-MM-DD] <one-line summary>
- **Severity:** CRITICAL | HIGH | MEDIUM | LOW
- **Reported by:** user | validator | test | self
- **Files:** comma-separated
- **Problem:** what was wrong
- **Fix:** what changed
- **Validation:** how we confirmed
```

---

## [2026-05-11] Initial audit — open bugs catalogued

Pre-fix snapshot of issues discovered before `v0.2-stabilize` work began.

### Open issues (queued for fix)

1. **HIGH** — `bun test src/security/*.test.ts` glob unexpanded on Windows; zero security tests actually ran. Silent test bypass. `package.json` script `test:security-slice`.
2. **MEDIUM** — `engagement.test.ts:29` regex `/\.netrunner\/engagement\.json$/` fails on Windows back-slashes. Asserts cross-platform path with forward-slash literal.
3. **HIGH** — `engagement-setup` skill prompt instructs LLM to "produce a brief". Drives doc-spam (multiple `/tmp/*.md` per engagement seen in transcripts). `src/skills/bundled/engagementSetup.ts:29`.
4. **HIGH** — No `PreToolUse` hook restricting `Write` to `.netrunner/`. Specialists scatter reports into `/tmp/` and bypass the evidence ledger.
5. **HIGH** — Provider/model picker does not highlight the hovered row (Ink select). Reported by user.
6. **MEDIUM** — Saved provider `copilot` displays as `openai` in startup banner (model label is correct). Reported by user. Suspected: banner reads `OPENAI_*` env vars instead of the saved profile field.
7. **MEDIUM** — 38 bundled skills not yet audited for doc-spam patterns ("produce", "document", "summarize", "create a plan").
8. **LOW** — Subagent specialists emit verbose summaries (boxes, emoji, ASCII tables). Wastes context. No `max_tokens` cap.
9. **LOW** — Findings observed in transcripts never reached `nr_save_finding`. No interceptor catching unsaved discoveries.

---

<!-- new fixes appended below this line -->

## [2026-05-11] Added Linux + Demo bootstrap scripts
- **Severity:** N/A (new capability — not a bug fix)
- **Reported by:** user (demo prep)
- **Files:** `scripts/setup-linux.sh`, `scripts/setup-demo.sh`, `package.json`
- **What:** Two one-shot installers for Linux hosts (tested-target distro is Kali / Debian / Ubuntu, anything apt-based works). `setup-linux.sh` installs Node 22, Bun, build deps, runs `bun install && bun run build`, and points the operator at `bun run setup` for provider config. `setup-demo.sh` runs the Linux bootstrap, ensures Docker is present, pulls OWASP Juice Shop, tags it locally as `octorig-juiceshop:demo`, runs it on port 3000, waits for the container to respond, then seeds `.netrunner/engagement.json` and `.netrunner/run-state.json` with an authorized lab engagement (workflow=`web-app-testing`, target=`http://localhost:3000`, impact=`unrestricted`). After it finishes the harness is one prompt away from "attack the lab".
- **Entry points:** `bun run setup:linux` · `bun run setup:demo` · `bun run setup:demo:teardown` for cleanup.
- **Validation:** `bash -n` syntax check passed for both scripts. End-to-end run pending — needs to be executed on a real Linux/Kali VM.

## [2026-05-11] Stripped doc-spam tails from nine inline skills
- **Severity:** HIGH (root cause of doc-spam pattern)
- **Reported by:** user (continuation of skill-audit work)
- **Files:** `src/skills/bundled/index.ts`
- **Problem:** Nine inline skill definitions (digital-footprint-assessment, identity-correlation, c2-infrastructure, c2-operations, headless-browser-validation, bug-bounty-validation, http-smuggling-cache-poisoning, serverless-edge-recon, wordpress-attack-tree) ended with prose `Output:` bullet lists asking the agent to write paragraph-style summaries. Same antipattern as the standalone skills.
- **Fix:** Replaced each tail with a single-line "Output discipline" contract that points the model at `nr_save_finding` / `nr_save_note` and caps chat reply to one line of metrics. All artifacts route to the existing `.netrunner/artifacts/<skill>/<target>/` directories the skills already create.
- **Validation:** `bun run typecheck` clean.

## [2026-05-11] Added short crew-style display names for the six specialists
- **Severity:** LOW (cosmetic / readability)
- **Reported by:** user
- **Files:** `src/security/agentDefinitions.ts`
- **Problem:** Internal `agentType` strings (`engagement-lead`, `recon-specialist`, `app-testing-specialist`, `infra-specialist`, `code-forensics-specialist`, `evidence-reporting-specialist`) are referenced in 48 files across the repo. Renaming them outright during viva week is high-risk. But the long forms read awkwardly in handoff banners and status lines.
- **Fix:** Added a `displayName` field to `NetRunnerAgentDefinition` with short crew-style names: Lead, Recon, AppSec, Infra, CodeAudit, Reporter. Internal identifiers stay stable. Banner / handoff surfaces can opt in incrementally.
- **Validation:** `bun run typecheck` clean.

## [2026-05-11] Pre-UI log spam on launch (doctor + provider env dump)
- **Severity:** MEDIUM (user-perceived quality)
- **Reported by:** user
- **Files:** `scripts/system-check.ts`, `scripts/provider-launch.ts`
- **Problem:** Every launch printed ~12 lines before the Ink UI took over — six PASS rows from `system-check`, a "Runtime checks completed successfully" banner, plus `Launching profile:`, `OPENAI_BASE_URL=`, `OPENAI_MODEL=`, `..._TOKEN_SET=` from the launcher's `printSummary`. The TUI's own startup banner then drew on top, so the user saw all of that diagnostic noise scroll past every time.
- **Fix:** Default both stages to silent. `system-check` now prints results only when `--verbose`, `-v`, or `NETRUNNER_VERBOSE_LAUNCH=1` is set, OR when a check actually fails (failures print just the failed rows). `printSummary` and the Copilot-refresh log lines are likewise gated on `NETRUNNER_VERBOSE_LAUNCH`. The TUI's own banner is the only thing the user sees on a clean launch.
- **Validation:** `bun run typecheck` clean. Visual confirmation needed via live launch.

## [2026-05-11] Startup banner mislabelled GitHub Copilot / Codex / GitHub Models as "OpenAI"
- **Severity:** MEDIUM (display bug; trust impact every launch)
- **Reported by:** user
- **Files:** `src/components/StartupScreen.ts`, `scripts/provider-launch.ts`
- **Problem:** `detectProvider()` inferred the provider name from `OPENAI_BASE_URL` regex matches. The list covered DeepSeek, OpenRouter, Together, Groq, Mistral, Azure, Ollama, LM Studio — but not `api.githubcopilot.com`, `models.github.ai`, or `chatgpt.com/backend-api/codex`. Anyone who saved Copilot, GitHub Models, or Codex saw "OpenAI" in the banner even though the model and routing were correct.
- **Fix:** Two layers. (1) `provider-launch.ts` now stamps `NETRUNNER_PROFILE_NAME=<saved profile>` into the spawn env, so the TUI always knows which profile the launcher resolved. (2) `StartupScreen.ts` reads `NETRUNNER_PROFILE_NAME` first (authoritative) and falls back to base-URL inference. The URL inference also now covers GitHub Copilot, GitHub Models, and OpenAI Codex.
- **Validation:** `bun run typecheck` clean. Visual confirmation needed via live launch with a copilot profile.

## [2026-05-11] Hover highlight on TUI selection lists invisible on many terminals
- **Severity:** HIGH (visual blocker — user can't tell which option is focused)
- **Reported by:** user
- **Files:** `src/components/design-system/ListItem.tsx`, `src/components/CustomSelect/select.tsx`
- **Problem:** Focused list items only signalled state via `color="suggestion"` (a blue). On many terminal themes (low-contrast, ANSI-mapped, dark schemes) the blue washed into surrounding text and the user could not see which row the cursor was on. The pointer character `❯` was the only reliable indicator.
- **Fix:** Added `bold={(isFocused || isSelected) && !disabled}` to the styled `<Text>` wrapper in `ListItem.tsx` and to the four inline coloured `<Text>` wrappers across the four `select.tsx` layouts (regular, compact-vertical, two-column, default). Bold is a terminal-universal attribute that does not depend on colour mapping. Focused option now reads as bold + blue + pointer — unmistakable on any theme.
- **Validation:** `bun run typecheck` clean. Visual confirmation needed via live launch.

## [2026-05-11] Engagement context: duplicate specialists + missing forensics + no output discipline
- **Severity:** HIGH (drives doc-spam) / MEDIUM (drives bad routing)
- **Reported by:** self (skill audit)
- **Files:** `src/security/engagement.ts`
- **Problem:** `specialistAgents` array contained `app-testing-specialist` ×2, `infra-specialist` ×5, `evidence-reporting-specialist` ×3, and was MISSING `code-forensics-specialist` entirely. Engagement context lacked any output-discipline directive, so every skill prompt fell back to the model's default "write a structured report" behavior.
- **Fix:** Deduped to the 6 real specialists (engagement-lead, recon, app-testing, infra, code-forensics, evidence-reporting). Added `output_discipline` line to every engagement context: tool calls over prose, ledger-only artifacts, no `/tmp/*.md`, one-line replies unless a report is requested.
- **Validation:** `bun test src/security/engagement.test.ts` → 5/5 pass.

## [2026-05-11] engagement-setup, recon-plan, target-fingerprinting, vuln-assessment, exploit-validation, post-exploitation-plan, attack-path-analysis, evidence-capture, report-generation — action-first rewrite
- **Severity:** HIGH (root cause of doc-spam)
- **Reported by:** user ("harness writes more documents than actual pentesting")
- **Files:** `src/skills/bundled/engagementSetup.ts`, `reconPlan.ts`, `targetFingerprinting.ts`, `vulnAssessment.ts`, `exploitValidation.ts`, `postExploitationPlan.ts`, `attackPathAnalysis.ts`, `evidenceCapture.ts`, `reportGeneration.ts`
- **Problem:** Skill prompts asked the model to "produce a brief", "output report-ready markdown", "build a phased plan", with explicit `Output format:` sections demanding section-by-section prose. Model dutifully wrote 6 markdown files in `/tmp/` per engagement.
- **Fix:** Rewrote each skill prompt to `# Skill — ACTION ONLY` style. Imperative numbered tool calls (`nr_engagement_init`, `nr_save_finding`, `nr_validate_finding`, etc.). Explicit `Output discipline:` block forbidding `/tmp/*.md`, chat summaries, ASCII art. Reply contract = one line back to caller. Shrunk `allowedTools` lists to drop write-heavy tools where unnecessary.
- **Validation:** Pending — needs a live engagement run on `v0.2-stabilize` to confirm behavior shift. Build + typecheck pending.

## [2026-05-11] engagement.test.ts Windows path regex
- **Severity:** MEDIUM
- **Reported by:** self (bun test)
- **Files:** `src/security/engagement.test.ts`
- **Problem:** Two assertions used `/\.netrunner\/engagement\.json$/` with hard-coded forward slashes. Windows resolves the path with back-slashes, so the regex never matched.
- **Fix:** Replaced both regexes with character class `[\\/]` to accept either separator.
- **Validation:** `bun test src/security/engagement.test.ts` → 5/5 pass.

## [2026-05-11] test:security-slice glob unexpanded on Windows
- **Severity:** HIGH
- **Reported by:** self (pipeline:redteam)
- **Files:** `package.json`
- **Problem:** Script ran `bun test src/security/*.test.ts`. Bash glob does not expand on Windows shell, Bun did not match any files, security slice silently bypassed. Pipeline exited 1 with cryptic execa error.
- **Fix:** Changed to directory form `bun test src/security`. Bun's discovery walks the tree and finds `.test.ts` / `.spec.ts` files cross-platform.
- **Validation:** `bun test src/security` now discovers 30 files, runs 55 tests. (26 fail for unrelated reasons — tracked separately as task #15.)
