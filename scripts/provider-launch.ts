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
  clearManagedProfileEnv,
  loadProfileFile,
  selectAutoProfile,
  type ProviderProfile,
} from '../src/utils/providerProfile.ts'
import {
  getOllamaChatBaseUrl,
  hasLocalOllama,
  listOllamaModels,
} from './provider-discovery.ts'

type LaunchProfile = ProviderProfile | 'anthropic'

type LaunchOptions = {
  requestedProfile: LaunchProfile | 'auto' | null
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

    if (
      (lower === 'auto' || lower === 'openai' || lower === 'ollama' ||
       lower === 'codex' || lower === 'gemini' || lower === 'github' ||
       lower === 'copilot' || lower === 'anthropic') &&
      requestedProfile === 'auto'
    ) {
      requestedProfile = lower as LaunchProfile | 'auto'
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

  return { requestedProfile, passthroughArgs, fast, goal }
}

async function resolveOllamaDefaultModel(
  goal: ReturnType<typeof normalizeRecommendationGoal>,
): Promise<string | null> {
  const models = await listOllamaModels()
  const recommended = recommendOllamaModel(models, goal)
  return recommended?.name ?? null
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
  // Verbose mode reproduces the original env dump for diagnostics.
  // Default mode stays silent — the startup banner inside the TUI shows
  // provider, model, and endpoint cleanly. Pre-UI noise was the complaint.
  const verbose =
    process.env.NETRUNNER_VERBOSE_LAUNCH === '1' ||
    process.env.NETRUNNER_VERBOSE_LAUNCH === 'true'
  if (!verbose) return

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
  } else if (profile === 'copilot') {
    console.log(`OPENAI_BASE_URL=${env.OPENAI_BASE_URL}`)
    console.log(`OPENAI_MODEL=${env.OPENAI_MODEL}`)
    console.log(`COPILOT_TOKEN_SET=${Boolean(env.OPENAI_API_KEY)}`)
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
    console.error('Usage: bun run scripts/provider-launch.ts [openai|ollama|codex|gemini|github|copilot|anthropic|auto] [--fast] [--goal <latency|balanced|coding>] [-- <cli args>]')
    process.exit(1)
  }

  const persisted = loadProfileFile()
  let profile: ProviderProfile | null
  let resolvedOllamaModel: string | null = null
  const useBuiltInWalkthrough = requestedProfile === 'anthropic'

  if (useBuiltInWalkthrough) {
    profile = null
  } else if (requestedProfile === 'auto') {
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
  if (useBuiltInWalkthrough) {
    console.log('Launching the built-in Anthropic account/API-key walkthrough.')
    env = { ...process.env }
    clearManagedProfileEnv(env)
    if (env.OPENAI_API_KEY === 'SUA_CHAVE') delete env.OPENAI_API_KEY
  } else if (profile === null) {
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

  // In auto mode, missing credentials fall through to the in-CLI first-run
  // walkthrough. Explicit profile selection (e.g. `dev:github`) fails fast.
  const isAutoMode = options.requestedProfile === 'auto'
  const fallThroughToWalkthrough = (reason: string): void => {
    console.log(`${reason} Launching the built-in first-run walkthrough instead.`)
    profile = null
    env = { ...process.env }
    clearManagedProfileEnv(env)
    if (env.OPENAI_API_KEY === 'SUA_CHAVE') delete env.OPENAI_API_KEY
  }

  if (profile === 'gemini' && !env.GEMINI_API_KEY) {
    if (isAutoMode) {
      fallThroughToWalkthrough('No GEMINI_API_KEY detected.')
    } else {
      console.error('GEMINI_API_KEY is required for gemini profile. Run: bun run setup --force')
      process.exit(1)
    }
  }

  if (profile === 'github' && !(env.GITHUB_TOKEN || process.env.GH_TOKEN || env.OPENAI_API_KEY)) {
    if (isAutoMode) {
      fallThroughToWalkthrough('No GITHUB_TOKEN or GH_TOKEN detected.')
    } else {
      console.error('GITHUB_TOKEN or GH_TOKEN is required for github profile. Run: bun run setup --force')
      process.exit(1)
    }
  }

  if (profile === 'openai' && (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'SUA_CHAVE')) {
    if (isAutoMode) {
      fallThroughToWalkthrough('No usable OPENAI_API_KEY detected.')
    } else {
      console.error('OPENAI_API_KEY is required for openai profile. Run: bun run setup --force')
      process.exit(1)
    }
  }

  if (profile === 'codex') {
    const credentials = resolveCodexApiCredentials(env)
    if (!credentials.apiKey) {
      const authHint = credentials.authPath ? ` (checked ${credentials.authPath})` : ''
      if (isAutoMode) {
        fallThroughToWalkthrough(`No Codex credentials found${authHint}.`)
      } else {
        console.error(`No Codex credentials found${authHint}. Run: bun run setup --force  or  npm i -g @openai/codex && codex login`)
        process.exit(1)
      }
    }
  }

  if (profile === 'copilot' && !env.GITHUB_COPILOT_TOKEN) {
    if (isAutoMode) {
      fallThroughToWalkthrough('No Copilot token in profile.')
    } else {
      console.error('Copilot profile requires a GitHub token. Run: bun run setup --force')
      process.exit(1)
    }
  }

  // Refresh the short-lived Copilot service token before launch if near expiry.
  if (profile === 'copilot') {
    await refreshCopilotTokenIfExpired(env)
  }

  if (profile !== null) {
    // Stamp the saved profile name so the startup banner can label the
    // provider correctly even when several profiles share OPENAI_BASE_URL
    // semantics (Copilot, Codex, GitHub Models all run over the OpenAI shim).
    env.NETRUNNER_PROFILE_NAME = profile
    printSummary(profile, env)
  }

  if (profile !== null && process.env.NETRUNNER_SKIP_DOCTOR !== '1') {
    const doctorCode = await runProcess('bun', ['run', 'scripts/system-check.ts'], env)
    if (doctorCode !== 0) {
      console.warn('Runtime doctor reported issues. Continuing — set NETRUNNER_SKIP_DOCTOR=1 to silence.')
    }
  }

  const distEntry = resolvePath(process.cwd(), 'dist/cli.mjs')
  const needsBuild =
    process.env.NETRUNNER_FORCE_BUILD === '1' ||
    !existsSync(distEntry) ||
    isDistStale(distEntry)
  if (needsBuild) {
    const buildCode = await runProcess('bun', ['run', 'build'], env)
    if (buildCode !== 0) process.exit(buildCode)
  }

  const devCode = await runProcess('node', ['dist/cli.mjs', ...options.passthroughArgs], env)
  process.exit(devCode)
}

function isDistStale(distEntry: string): boolean {
  try {
    const distMtime = statSync(distEntry).mtimeMs
    const candidates = ['src', 'scripts', 'package.json', 'bun.lock', 'package-lock.json']
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
  if (expiresAt > nowSec + 60) return

  const verbose =
    process.env.NETRUNNER_VERBOSE_LAUNCH === '1' ||
    process.env.NETRUNNER_VERBOSE_LAUNCH === 'true'
  if (verbose) console.log('Refreshing Copilot service token...')
  try {
    const refreshed = await exchangeForCopilotToken(githubToken)
    env.OPENAI_API_KEY = refreshed.token
    env.COPILOT_TOKEN_EXPIRES_AT = String(refreshed.expires_at)

    const profilePath = resolvePath(process.cwd(), '.net-runner-profile.json')
    if (existsSync(profilePath)) {
      try {
        const current = JSON.parse(readFileSync(profilePath, 'utf8'))
        if (current.profile !== 'copilot') {
          if (verbose) console.log('Profile on disk is no longer copilot; skipping token persist.')
          return
        }
        current.env = current.env || {}
        current.env.OPENAI_API_KEY = refreshed.token
        current.env.COPILOT_TOKEN_EXPIRES_AT = String(refreshed.expires_at)
        writeFileSync(profilePath, JSON.stringify(current, null, 2), { mode: 0o600 })
      } catch (err) {
        console.warn(`Could not persist refreshed Copilot token: ${(err as Error).message}`)
      }
    }
    if (verbose) console.log(`Copilot token refreshed (expires at ${new Date(refreshed.expires_at * 1000).toISOString()}).`)
  } catch (err) {
    console.error(`Failed to refresh Copilot token: ${(err as Error).message}`)
    console.error('Re-run `bun run setup --force` to re-authorise.')
    process.exit(1)
  }
}

await main()

export {}
