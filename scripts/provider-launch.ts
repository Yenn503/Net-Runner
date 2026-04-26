// @ts-nocheck
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import {
  resolveCodexApiCredentials,
} from '../src/services/api/providerConfig.js'
import { exchangeForCopilotToken } from './copilot-auth.ts'
import {
  normalizeRecommendationGoal,
  recommendOllamaModel,
} from '../src/utils/providerRecommendation.ts'
import {
  buildLaunchEnv,
  loadProfileFile,
  selectAutoProfile,
  type ProviderProfile,
} from '../src/utils/providerProfile.ts'
import {
  getOllamaChatBaseUrl,
  hasLocalOllama,
  listOllamaModels,
} from './provider-discovery.ts'

type LaunchOptions = {
  requestedProfile: ProviderProfile | 'auto' | null
  passthroughArgs: string[]
  fast: boolean
  goal: ReturnType<typeof normalizeRecommendationGoal>
}

function parseLaunchOptions(argv: string[]): LaunchOptions {
  let requestedProfile: ProviderProfile | 'auto' | null = 'auto'
  const passthroughArgs: string[] = []
  let fast = false
  let goal = normalizeRecommendationGoal(process.env.NET_RUNNER_PROFILE_GOAL)

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    const lower = arg.toLowerCase()
    if (lower === '--fast') {
      fast = true
      continue
    }

    if (lower === '--goal') {
      goal = normalizeRecommendationGoal(argv[i + 1] ?? null)
      i++
      continue
    }

    if ((lower === 'auto' || lower === 'openai' || lower === 'ollama' || lower === 'codex' || lower === 'gemini' || lower === 'github' || lower === 'copilot') && requestedProfile === 'auto') {
      requestedProfile = lower as ProviderProfile | 'auto'
      continue
    }

    if (arg.startsWith('--')) {
      passthroughArgs.push(arg)
      continue
    }

    if (requestedProfile === 'auto') {
      requestedProfile = null
      break
    }

    passthroughArgs.push(arg)
  }

  return {
    requestedProfile,
    passthroughArgs,
    fast,
    goal,
  }
}

async function resolveOllamaDefaultModel(
  goal: ReturnType<typeof normalizeRecommendationGoal>,
): Promise<string | null> {
  const models = await listOllamaModels()
  const recommended = recommendOllamaModel(models, goal)
  return recommended?.name ?? null
}

function runCommand(command: string, env: NodeJS.ProcessEnv): Promise<number> {
  return runProcess(command, [], env)
}

function runProcess(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<number> {
  return new Promise(resolve => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
    })

    child.on('close', code => resolve(code ?? 1))
    child.on('error', () => resolve(1))
  })
}

function applyFastFlags(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  env.NETRUNNER_SIMPLE ??= '1'
  env.NETRUNNER_DISABLE_THINKING ??= '1'
  env.CLAUDE_CODE_SIMPLE ??= '1'
  env.CLAUDE_CODE_DISABLE_THINKING ??= '1'
  env.DISABLE_INTERLEAVED_THINKING ??= '1'
  env.DISABLE_AUTO_COMPACT ??= '1'
  env.NETRUNNER_DISABLE_AUTO_MEMORY ??= '1'
  env.NETRUNNER_DISABLE_BACKGROUND_TASKS ??= '1'
  env.CLAUDE_CODE_DISABLE_AUTO_MEMORY ??= '1'
  env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS ??= '1'
  return env
}

function printSummary(profile: ProviderProfile, env: NodeJS.ProcessEnv): void {
  console.log(`Launching profile: ${profile}`)
  if (profile === 'gemini') {
    console.log(`GEMINI_MODEL=${env.GEMINI_MODEL}`)
    console.log(`GEMINI_API_KEY_SET=${Boolean(env.GEMINI_API_KEY)}`)
  } else if (profile === 'github') {
    console.log(`OPENAI_BASE_URL=${env.OPENAI_BASE_URL}`)
    console.log(`OPENAI_MODEL=${env.OPENAI_MODEL}`)
    console.log(`GITHUB_TOKEN_SET=${Boolean(env.GITHUB_TOKEN ?? env.OPENAI_API_KEY)}`)
  } else if (profile === 'codex') {
    console.log(`OPENAI_BASE_URL=${env.OPENAI_BASE_URL}`)
    console.log(`OPENAI_MODEL=${env.OPENAI_MODEL}`)
    console.log(`CODEX_API_KEY_SET=${Boolean(resolveCodexApiCredentials(env).apiKey)}`)
  } else {
    console.log(`OPENAI_BASE_URL=${env.OPENAI_BASE_URL}`)
    console.log(`OPENAI_MODEL=${env.OPENAI_MODEL}`)
    console.log(`OPENAI_API_KEY_SET=${Boolean(env.OPENAI_API_KEY)}`)
  }
}

async function main(): Promise<void> {
  const options = parseLaunchOptions(process.argv.slice(2))
  const requestedProfile = options.requestedProfile
  if (!requestedProfile) {
    console.error('Usage: bun run scripts/provider-launch.ts [openai|ollama|codex|gemini|github|auto] [--fast] [--goal <latency|balanced|coding>] [-- <cli args>]')
    process.exit(1)
  }

  const persisted = loadProfileFile()
  let profile: ProviderProfile | null
  let resolvedOllamaModel: string | null = null

  if (requestedProfile === 'auto') {
    if (persisted) {
      profile = persisted.profile
    } else if (await hasLocalOllama()) {
      resolvedOllamaModel = await resolveOllamaDefaultModel(options.goal)
      profile = selectAutoProfile(resolvedOllamaModel)
    } else {
      profile = null
    }
  } else {
    profile = requestedProfile
  }

  if (
    profile === 'ollama' &&
    (persisted?.profile !== 'ollama' || !persisted?.env?.OPENAI_MODEL)
  ) {
    resolvedOllamaModel ??= await resolveOllamaDefaultModel(options.goal)
    if (!resolvedOllamaModel) {
      console.error('No viable Ollama chat model was discovered. Pull a chat model first or save one with `bun run profile:init -- --provider ollama --model <model>`.')
      process.exit(1)
    }
  }

  let env: NodeJS.ProcessEnv
  if (profile === null) {
    // No saved profile and no usable env credentials. Run the readline-based
    // setup script (bypasses the Ink walkthrough's long-paste wrap bug) so
    // the user lands in a configured state in one shot. After setup writes
    // .net-runner-profile.json, reload it and continue with the launch.
    console.log('No saved provider profile detected. Running Net-Runner setup...')
    const setupCode = await runProcess('bun', ['run', 'scripts/setup.ts'], process.env)
    if (setupCode !== 0) {
      console.error('Setup did not complete. Re-run with `bun run setup` and try again.')
      process.exit(setupCode)
    }
    const reloaded = loadProfileFile()
    if (!reloaded) {
      console.error('Setup completed but no profile was saved. Re-run with `bun run setup`.')
      process.exit(1)
    }
    profile = reloaded.profile
    env = await buildLaunchEnv({
      profile,
      persisted: reloaded,
      goal: options.goal,
      getOllamaChatBaseUrl,
      resolveOllamaDefaultModel: async () => resolvedOllamaModel || 'llama3.1:8b',
    })
  } else {
    env = await buildLaunchEnv({
      profile,
      persisted,
      goal: options.goal,
      getOllamaChatBaseUrl,
      resolveOllamaDefaultModel: async () => resolvedOllamaModel || 'llama3.1:8b',
    })
  }

  if (options.fast) {
    applyFastFlags(env)
  }

  if (
    profile === 'ollama' &&
    (persisted?.profile !== 'ollama' || !persisted?.env?.OPENAI_MODEL)
  ) {
    // already resolved above
  }

  // In auto mode (no profile explicitly requested), missing credentials should
  // fall through to the in-CLI first-run walkthrough rather than fail-fast.
  // Explicit profile selection (e.g. `dev:github`) keeps the strict gate.
  const isAutoMode = options.requestedProfile === 'auto'
  const fallThroughToWalkthrough = (reason: string): void => {
    console.log(`${reason} Launching the built-in first-run walkthrough instead.`)
    profile = null
    env = { ...process.env }
    if (env.OPENAI_API_KEY === 'SUA_CHAVE') delete env.OPENAI_API_KEY
  }

  if (profile === 'gemini' && !env.GEMINI_API_KEY) {
    if (isAutoMode) {
      fallThroughToWalkthrough('No GEMINI_API_KEY detected.')
    } else {
      console.error('GEMINI_API_KEY is required for gemini profile. Run: bun run profile:init -- --provider gemini --api-key <key>')
      process.exit(1)
    }
  }

  if (profile === 'github' && !(env.GITHUB_TOKEN || process.env.GH_TOKEN || env.OPENAI_API_KEY)) {
    if (isAutoMode) {
      fallThroughToWalkthrough('No GITHUB_TOKEN or GH_TOKEN detected.')
    } else {
      console.error('GITHUB_TOKEN or GH_TOKEN is required for github profile. Run: bun run profile:init -- --provider github --api-key <token>')
      process.exit(1)
    }
  }

  if (profile === 'openai' && (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'SUA_CHAVE')) {
    if (isAutoMode) {
      fallThroughToWalkthrough('No usable OPENAI_API_KEY detected.')
    } else {
      console.error('OPENAI_API_KEY is required for openai profile and cannot be SUA_CHAVE. Run: bun run profile:init -- --provider openai --api-key <key>')
      process.exit(1)
    }
  }

  if (profile === 'codex') {
    const credentials = resolveCodexApiCredentials(env)
    if (!credentials.apiKey || !credentials.accountId) {
      if (isAutoMode) {
        fallThroughToWalkthrough('Codex credentials incomplete.')
      } else if (!credentials.apiKey) {
        const authHint = credentials.authPath
          ? ` or make sure ${credentials.authPath} exists`
          : ''
        console.error(`CODEX_API_KEY is required for codex profile${authHint}. Run: bun run profile:init -- --provider codex --model codexplan`)
        process.exit(1)
      } else {
        console.error('CHATGPT_ACCOUNT_ID is required for codex profile. Set CHATGPT_ACCOUNT_ID/CODEX_ACCOUNT_ID or use an auth.json that includes it.')
        process.exit(1)
      }
    }
  }

  // Refresh the Copilot service token if it's near expiry. The Copilot token
  // saved by setup is short-lived (~30 min). The long-lived GitHub OAuth
  // token is what we use to mint a new one. Token expiry is tracked via the
  // COPILOT_TOKEN_EXPIRES_AT field saved alongside the profile.
  if (profile === 'copilot') {
    await refreshCopilotTokenIfExpired(env)
  }

  if (profile !== null) {
    printSummary(profile, env)
  }

  // Doctor is informational. A failed pre-flight should not block first-run launch —
  // upstream OpenClaude does not gate on this and the in-CLI walkthrough handles
  // configuration interactively. Skip entirely when no profile is set so the
  // walkthrough is the very first thing the user sees.
  if (profile !== null && process.env.NETRUNNER_SKIP_DOCTOR !== '1') {
    const doctorCode = await runProcess('bun', ['run', 'scripts/system-check.ts'], env)
    if (doctorCode !== 0) {
      console.warn('Runtime doctor reported issues. Continuing launch — set NETRUNNER_SKIP_DOCTOR=1 to silence, or fix configuration if startup fails.')
    }
  }

  // Rebuild when needed. We rebuild if any of:
  //   - NETRUNNER_FORCE_BUILD=1 (explicit)
  //   - dist/cli.mjs missing (fresh checkout)
  //   - any source/package file newer than dist/cli.mjs (stale build, e.g.
  //     after `git pull` introduced fixes that need to be re-bundled). This
  //     is what bites users who pull a banner / shim fix and don't see it
  //     because the launcher reuses a stale dist.
  const distEntry = resolvePath(process.cwd(), 'dist/cli.mjs')
  const needsBuild =
    process.env.NETRUNNER_FORCE_BUILD === '1' ||
    !existsSync(distEntry) ||
    isDistStale(distEntry)
  if (needsBuild) {
    const buildCode = await runProcess('bun', ['run', 'build'], env)
    if (buildCode !== 0) {
      process.exit(buildCode)
    }
  }

  const devCode = await runProcess('node', ['dist/cli.mjs', ...options.passthroughArgs], env)
  process.exit(devCode)
}

function isDistStale(distEntry: string): boolean {
  try {
    const distMtime = statSync(distEntry).mtimeMs
    const candidates = [
      'src',
      'scripts',
      'package.json',
      'bun.lock',
      'package-lock.json',
    ]
    for (const c of candidates) {
      const full = resolvePath(process.cwd(), c)
      if (!existsSync(full)) continue
      const stat = statSync(full)
      if (stat.isDirectory()) {
        if (newestMtimeInDir(full) > distMtime) return true
      } else if (stat.mtimeMs > distMtime) {
        return true
      }
    }
    return false
  } catch {
    // If anything goes wrong with the comparison, force a rebuild rather
    // than risk launching from a stale dist.
    return true
  }
}

function newestMtimeInDir(dir: string): number {
  let newest = 0
  const stack = [dir]
  while (stack.length > 0) {
    const current = stack.pop()!
    let entries: { name: string; isDirectory: () => boolean; isFile: () => boolean }[]
    try {
      entries = readdirSync(current, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) continue
      const full = resolvePath(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
      } else if (entry.isFile()) {
        try {
          const m = statSync(full).mtimeMs
          if (m > newest) newest = m
        } catch {
          // ignore
        }
      }
    }
  }
  return newest
}

async function refreshCopilotTokenIfExpired(env: NodeJS.ProcessEnv): Promise<void> {
  const githubToken = env.GITHUB_COPILOT_TOKEN
  const expiresAtRaw = env.COPILOT_TOKEN_EXPIRES_AT
  if (!githubToken) {
    console.warn('Copilot profile is missing GITHUB_COPILOT_TOKEN; cannot refresh service token. Re-run `bun run setup --force`.')
    return
  }
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0
  const nowSec = Math.floor(Date.now() / 1000)
  // Refresh if the token expires within the next 60 seconds.
  if (expiresAt > nowSec + 60) {
    return
  }

  console.log('Refreshing Copilot service token...')
  try {
    const refreshed = await exchangeForCopilotToken(githubToken)
    env.OPENAI_API_KEY = refreshed.token
    env.COPILOT_TOKEN_EXPIRES_AT = String(refreshed.expires_at)

    // Persist the new token back to the profile so subsequent launches reuse it.
    const profilePath = resolvePath(process.cwd(), '.net-runner-profile.json')
    if (existsSync(profilePath)) {
      try {
        const current = JSON.parse(readFileSync(profilePath, 'utf8'))
        current.env = current.env || {}
        current.env.OPENAI_API_KEY = refreshed.token
        current.env.COPILOT_TOKEN_EXPIRES_AT = String(refreshed.expires_at)
        writeFileSync(profilePath, JSON.stringify(current, null, 2), { mode: 0o600 })
      } catch (err) {
        console.warn(`Could not persist refreshed Copilot token: ${(err as Error).message}`)
      }
    }
    console.log(`Copilot token refreshed (expires at ${new Date(refreshed.expires_at * 1000).toISOString()}).`)
  } catch (err) {
    console.error(`Failed to refresh Copilot token: ${(err as Error).message}`)
    console.error('Re-run `bun run setup --force` to re-authorise.')
    process.exit(1)
  }
}

await main()

export {}
