// @ts-nocheck
/**
 * Net-Runner one-command setup.
 *
 * Plain readline-based onboarding that bypasses the Ink TextInput's
 * long-paste wrap bug. Run this once on a fresh checkout — or never; if you
 * launch with `bun run dev:profile` and no profile exists, the launcher
 * invokes this script automatically.
 *
 * Default flow:
 *   1. Pick provider (default: GitHub Models — free with any GitHub account)
 *   2. Paste token (or pick env-var fallback)
 *   3. Pick model (default: openai/gpt-4.1)
 *   4. Profile written to .net-runner-profile.json (gitignored)
 *   5. Done.
 */

import { createInterface } from 'node:readline'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  COPILOT_API_BASE,
  exchangeForCopilotToken,
  fetchCopilotModels,
  isCopilotChatModel,
  pollForAccessToken,
  probeCopilotModel,
  startDeviceCodeFlow,
  type CopilotModelEntry,
} from './copilot-auth.ts'

type Provider = 'github' | 'copilot' | 'openai' | 'gemini' | 'ollama'

const PROFILE_PATH = resolve(process.cwd(), '.net-runner-profile.json')

const PROVIDER_PRESETS: Record<Provider, {
  label: string
  envFlag: string
  baseUrl: string
  defaultModel: string
  tokenVar: 'GITHUB_TOKEN' | 'OPENAI_API_KEY' | 'GEMINI_API_KEY' | null
  tokenHint: string
  tokenPattern?: RegExp
  detectFromEnv: () => string | undefined
}> = {
  github: {
    label: 'GitHub Models — public catalog, free with any GitHub account',
    envFlag: 'NETRUNNER_USE_GITHUB',
    baseUrl: 'https://models.github.ai/inference',
    defaultModel: 'openai/gpt-4.1',
    tokenVar: 'GITHUB_TOKEN',
    tokenHint: 'Paste your GitHub Personal Access Token (github_pat_... or ghp_...)',
    tokenPattern: /^(github_pat_|ghp_|gho_|ghu_|ghs_)/,
    detectFromEnv: () =>
      process.env.GITHUB_TOKEN ||
      process.env.GH_TOKEN ||
      (process.env.OPENAI_API_KEY && /^(github_pat_|ghp_|gho_|ghu_|ghs_)/.test(process.env.OPENAI_API_KEY)
        ? process.env.OPENAI_API_KEY
        : undefined),
  },
  copilot: {
    label: 'GitHub Copilot — your subscription models (Sonnet 4.5, GPT-5, ...)',
    envFlag: 'NETRUNNER_USE_OPENAI',
    baseUrl: COPILOT_API_BASE,
    defaultModel: 'gpt-4o',
    tokenVar: null, // device-code flow — no manual paste
    tokenHint: '',
    detectFromEnv: () => undefined,
  },
  openai: {
    label: 'OpenAI (api.openai.com)',
    envFlag: 'NETRUNNER_USE_OPENAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    tokenVar: 'OPENAI_API_KEY',
    tokenHint: 'Paste your OpenAI API key (sk-...)',
    tokenPattern: /^sk-/,
    detectFromEnv: () =>
      process.env.OPENAI_API_KEY && /^sk-/.test(process.env.OPENAI_API_KEY)
        ? process.env.OPENAI_API_KEY
        : undefined,
  },
  gemini: {
    label: 'Google Gemini',
    envFlag: 'NETRUNNER_USE_GEMINI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    tokenVar: 'GEMINI_API_KEY',
    tokenHint: 'Paste your Google AI Studio API key (AIza...)',
    tokenPattern: /^AIza/,
    detectFromEnv: () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  },
  ollama: {
    label: 'Ollama (local, no key required)',
    envFlag: 'NETRUNNER_USE_OPENAI',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.1:8b',
    tokenVar: null,
    tokenHint: '',
    detectFromEnv: () => undefined,
  },
}

function color(code: string, text: string): string {
  return process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text
}
const bold = (t: string) => color('1', t)
const dim = (t: string) => color('2', t)
const green = (t: string) => color('32', t)
const red = (t: string) => color('31', t)
const cyan = (t: string) => color('36', t)
const yellow = (t: string) => color('33', t)

function prompt(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, answer => resolve(answer)))
}

async function pickProvider(rl: ReturnType<typeof createInterface>): Promise<Provider> {
  console.log()
  console.log(bold('Choose a provider:'))
  console.log(`  ${cyan('1')}. ${PROVIDER_PRESETS.github.label}  ${green('(default)')}`)
  console.log(`  ${cyan('2')}. ${PROVIDER_PRESETS.copilot.label}`)
  console.log(`  ${cyan('3')}. ${PROVIDER_PRESETS.openai.label}`)
  console.log(`  ${cyan('4')}. ${PROVIDER_PRESETS.gemini.label}`)
  console.log(`  ${cyan('5')}. ${PROVIDER_PRESETS.ollama.label}`)
  console.log()
  const ans = (await prompt(rl, dim('Enter 1-5 (or press Enter for GitHub Models): '))).trim()
  if (ans === '' || ans === '1') return 'github'
  if (ans === '2') return 'copilot'
  if (ans === '3') return 'openai'
  if (ans === '4') return 'gemini'
  if (ans === '5') return 'ollama'
  console.log(red(`'${ans}' is not a valid choice. Defaulting to GitHub Models.`))
  return 'github'
}

async function runCopilotAuth(
  rl: ReturnType<typeof createInterface>,
): Promise<{ githubAccessToken: string; copilotToken: string; copilotExpiresAt: number } | undefined> {
  console.log()
  console.log(bold(cyan('GitHub Copilot — choose how to authenticate')))
  console.log(dim('  Requires an active Copilot subscription (Pro / Pro+ / Business / Enterprise).'))
  console.log()
  console.log(`  ${cyan('1')}. Paste a fine-grained PAT with 'Copilot Requests' permission  ${green('(default — fastest)')}`)
  console.log(`  ${cyan('2')}. Browser device-code OAuth flow                                 ${dim('(if you do not want to manage a PAT)')}`)
  console.log()

  const choice = (await prompt(rl, dim('Enter 1 or 2 (Enter for 1): '))).trim()

  let githubAccessToken: string

  if (choice === '' || choice === '1') {
    // PAT path — official, supported. PATs prefixed github_pat_ with the
    // 'Copilot Requests' permission are accepted by /copilot_internal/v2/token.
    console.log()
    console.log(bold('Create a fine-grained PAT here:'))
    console.log(`   ${cyan('https://github.com/settings/personal-access-tokens/new')}`)
    console.log(dim('   Permissions needed: Account permissions → Copilot Requests → Read & write'))
    console.log(dim('   (Classic ghp_* tokens are NOT supported. Use a fine-grained github_pat_* token.)'))
    console.log()
    const pasted = (await prompt(rl, dim('Paste fine-grained PAT (github_pat_...): '))).trim()
    if (!pasted) return undefined
    if (!/^github_pat_/.test(pasted) && !/^gh[opus]_/.test(pasted)) {
      console.log(yellow(`Warning: token doesn't look like a fine-grained PAT or OAuth token.`))
      const confirm = (await prompt(rl, dim('Continue anyway? [y/N]: '))).trim().toLowerCase()
      if (confirm !== 'y' && confirm !== 'yes') return undefined
    }
    githubAccessToken = pasted
  } else if (choice === '2') {
    // Device-code OAuth fallback path.
    const device = await startDeviceCodeFlow()
    console.log()
    console.log(bold('1. Open this URL in any browser:'))
    console.log(`   ${cyan(device.verification_uri)}`)
    console.log()
    console.log(bold('2. Enter this code:'))
    console.log(`   ${bold(green(device.user_code))}`)
    console.log()
    console.log(dim(`   (Expires in ${Math.round(device.expires_in / 60)} min. Polling every ${device.interval}s ...)`))
    githubAccessToken = await pollForAccessToken(device)
    console.log(green('✔ GitHub OAuth complete.'))
  } else {
    console.log(red(`'${choice}' is not a valid choice.`))
    return undefined
  }

  // Both paths converge here: exchange the GitHub credential for a short-lived
  // Copilot service token usable against api.githubcopilot.com.
  console.log(dim('Exchanging for Copilot service token ...'))
  try {
    const copilot = await exchangeForCopilotToken(githubAccessToken)
    console.log(green(`✔ Got Copilot token (expires at ${new Date(copilot.expires_at * 1000).toISOString()}).`))
    return {
      githubAccessToken,
      copilotToken: copilot.token,
      copilotExpiresAt: copilot.expires_at,
    }
  } catch (err) {
    console.log()
    console.log(red(`Copilot exchange failed: ${(err as Error).message}`))
    if (choice === '' || choice === '1') {
      console.log(dim('  Verify the PAT has the "Copilot Requests" permission and that your account has an active Copilot subscription.'))
    }
    return undefined
  }
}

async function getToken(
  rl: ReturnType<typeof createInterface>,
  preset: typeof PROVIDER_PRESETS[Provider],
): Promise<string | undefined> {
  if (!preset.tokenVar) return undefined

  const detected = preset.detectFromEnv()
  if (detected) {
    console.log()
    console.log(green(`Found ${preset.tokenVar} in your environment — using it.`))
    return detected
  }

  console.log()
  console.log(bold(preset.tokenHint))
  if (preset.tokenVar === 'GITHUB_TOKEN') {
    console.log(dim('  Get one at https://github.com/settings/personal-access-tokens/new'))
    console.log(dim('  Permissions needed: Account permissions → Models → Read-only'))
  }
  console.log()
  const token = (await prompt(rl, dim(`Paste token (or leave blank to skip): `))).trim()
  if (!token) return undefined
  if (preset.tokenPattern && !preset.tokenPattern.test(token)) {
    console.log(yellow(`Warning: token doesn't match the expected ${preset.tokenVar} format.`))
    const confirm = (await prompt(rl, dim('Continue anyway? [y/N]: '))).trim().toLowerCase()
    if (confirm !== 'y' && confirm !== 'yes') return undefined
  }
  return token
}

type CatalogModel = {
  id: string
  name?: string
  publisher?: string
  summary?: string
  rate_limit_tier?: string
  supported_input_modalities?: string[]
  supported_output_modalities?: string[]
  tags?: string[]
}

async function fetchGithubModelsCatalog(token: string): Promise<CatalogModel[] | null> {
  try {
    const res = await fetch('https://models.github.ai/catalog/models', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (!res.ok) {
      console.log(yellow(`Could not fetch live model catalog (HTTP ${res.status}). Falling back to common defaults.`))
      return null
    }
    const data = await res.json() as CatalogModel[] | { models?: CatalogModel[] }
    const models = Array.isArray(data) ? data : data?.models
    if (!Array.isArray(models) || models.length === 0) return null
    return models
  } catch (err) {
    console.log(yellow(`Could not fetch live model catalog (${(err as Error).message}). Falling back to common defaults.`))
    return null
  }
}

async function fetchOllamaModels(): Promise<string[] | null> {
  try {
    const res = await fetch('http://localhost:11434/api/tags')
    if (!res.ok) return null
    const data = await res.json() as { models?: { name: string }[] }
    return (data.models ?? []).map(m => m.name).filter(Boolean)
  } catch {
    return null
  }
}

async function pickFromList(
  rl: ReturnType<typeof createInterface>,
  items: { id: string; label: string }[],
  defaultIndex: number,
): Promise<string> {
  const pageSize = 20
  let cursor = 0
  while (true) {
    console.log()
    const slice = items.slice(cursor, cursor + pageSize)
    slice.forEach((it, i) => {
      const idx = cursor + i + 1
      const marker = cursor + i === defaultIndex ? green(' (default)') : ''
      console.log(`  ${cyan(String(idx).padStart(3))}. ${it.label}${marker}`)
    })
    const more = cursor + pageSize < items.length
    if (more) console.log(dim(`  ... ${items.length - cursor - pageSize} more — type 'm' for more, or pick a number`))
    console.log()
    const ans = (await prompt(rl, dim(`Pick model 1-${items.length} (Enter for default${defaultIndex >= 0 ? ` = ${items[defaultIndex].id}` : ''}, 'm' for more, or paste a model id): `))).trim()
    if (ans === '' && defaultIndex >= 0) return items[defaultIndex].id
    if (ans === 'm' || ans === 'M') {
      cursor = more ? cursor + pageSize : 0
      continue
    }
    const n = Number(ans)
    if (Number.isInteger(n) && n >= 1 && n <= items.length) return items[n - 1].id
    if (ans.length > 0) return ans
    console.log(red(`Could not parse '${ans}'. Try a number, 'm', or a literal model id.`))
  }
}

async function getModel(
  rl: ReturnType<typeof createInterface>,
  preset: typeof PROVIDER_PRESETS[Provider],
  provider: Provider,
  token: string | undefined,
  copilotModels?: CopilotModelEntry[],
): Promise<string> {
  console.log()

  if (provider === 'copilot' && copilotModels && copilotModels.length > 0) {
    const chatOnly = copilotModels.filter(isCopilotChatModel)
    const filteredOut = copilotModels.length - chatOnly.length
    console.log(green(
      `Found ${chatOnly.length} chat-capable models in your Copilot subscription` +
      (filteredOut > 0 ? ` (${filteredOut} embedding/completion-only models hidden).` : '.')
    ))
    const items = chatOnly
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(m => {
        const family = m.capabilities?.family ? dim(` [${m.capabilities.family}]`) : ''
        const ctx = m.capabilities?.limits?.max_context_window_tokens
          ? dim(` (${Math.round(m.capabilities.limits.max_context_window_tokens / 1000)}k ctx)`)
          : ''
        const id = bold(m.id.padEnd(36))
        const name = m.name ? dim(`  ${m.name}`) : ''
        return { id: m.id, label: `${id}${family}${ctx}${name}` }
      })
    const defaultIdx = items.findIndex(m =>
      m.id === 'gpt-4o' || m.id === 'claude-sonnet-4.5' || m.id === 'gpt-5'
    )
    return await pickFromList(rl, items, defaultIdx >= 0 ? defaultIdx : 0)
  }

  if (provider === 'github' && token) {
    console.log(dim('Fetching live model catalog from https://models.github.ai/catalog/models ...'))
    const catalog = await fetchGithubModelsCatalog(token)
    if (catalog && catalog.length > 0) {
      console.log(green(`Found ${catalog.length} models on your GitHub Models account.`))
      const items = catalog
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(m => {
          const summary = (m.summary || m.name || '').toString().replace(/\s+/g, ' ').slice(0, 70)
          const tier = m.rate_limit_tier ? dim(` [${m.rate_limit_tier}]`) : ''
          const id = bold(m.id.padEnd(36))
          return { id: m.id, label: `${id}${tier}  ${dim(summary)}` }
        })
      const defaultIdx = items.findIndex(m => m.id === preset.defaultModel)
      return await pickFromList(rl, items, defaultIdx >= 0 ? defaultIdx : 0)
    }
    // fallthrough to hardcoded fallback
    console.log(bold('Common GitHub Models:'))
    console.log(`  ${cyan('•')} openai/gpt-4.1          ${green('(default — strong general)')}`)
    console.log(`  ${cyan('•')} openai/gpt-4o           ${dim('(fast, good tool calling)')}`)
    console.log(`  ${cyan('•')} openai/o1-mini          ${dim('(cheaper reasoning)')}`)
    console.log(`  ${cyan('•')} meta/Llama-3.3-70B-Instruct ${dim('(open weights)')}`)
  } else if (provider === 'ollama') {
    const models = await fetchOllamaModels()
    if (models && models.length > 0) {
      console.log(green(`Found ${models.length} local Ollama models.`))
      const items = models.sort().map(name => ({ id: name, label: bold(name) }))
      const defaultIdx = items.findIndex(m => m.id === preset.defaultModel)
      return await pickFromList(rl, items, defaultIdx >= 0 ? defaultIdx : 0)
    }
    console.log(bold('Common Ollama models: llama3.1:8b, qwen2.5-coder:7b'))
  } else if (provider === 'openai') {
    console.log(bold('Common OpenAI models: gpt-4o, gpt-4o-mini, o1-mini'))
  }
  console.log()
  const ans = (await prompt(rl, dim(`Model (Enter for ${preset.defaultModel}): `))).trim()
  return ans || preset.defaultModel
}

async function main(): Promise<void> {
  console.log()
  console.log(bold(cyan('Net-Runner setup')))
  console.log(dim('  This writes .net-runner-profile.json (gitignored).'))
  console.log(dim('  Safe to re-run any time to switch provider/model.'))

  const force = process.argv.includes('--force')
  if (existsSync(PROFILE_PATH) && !force) {
    try {
      const existing = JSON.parse(readFileSync(PROFILE_PATH, 'utf8'))
      console.log()
      console.log(yellow(`A profile already exists: ${existing.profile}`))
      console.log(dim(`  Re-run with --force to overwrite, or just launch with: bun run dev:profile`))
      process.exit(0)
    } catch {
      // bad profile file — proceed and overwrite
    }
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const provider = await pickProvider(rl)
    const preset = PROVIDER_PRESETS[provider]

    let copilotAuth: { githubAccessToken: string; copilotToken: string; copilotExpiresAt: number } | undefined
    let copilotModels: CopilotModelEntry[] | undefined
    let token: string | undefined

    if (provider === 'copilot') {
      copilotAuth = await runCopilotAuth(rl)
      if (!copilotAuth) {
        console.log()
        console.log(red('Copilot setup failed. Re-run `bun run setup --force` to try again, or pick a different provider.'))
        process.exit(1)
      }
      try {
        console.log(dim('Fetching live model catalog from api.githubcopilot.com/models ...'))
        copilotModels = await fetchCopilotModels(copilotAuth.copilotToken)
      } catch (err) {
        console.log(yellow(`Could not fetch Copilot models live (${(err as Error).message}). Falling back to defaults.`))
      }
    } else {
      token = await getToken(rl, preset)
    }

    let model = await getModel(rl, preset, provider, token, copilotModels)

    // For Copilot, validate that the picked model is actually entitled to
    // the user's subscription. The catalog returns models the user can't
    // necessarily use; only a real /chat/completions request can confirm
    // entitlement. Loop until the user picks something that works.
    if (provider === 'copilot' && copilotAuth) {
      while (true) {
        console.log(dim(`Verifying ${bold(model)} is entitled to your subscription ...`))
        const probe = await probeCopilotModel(copilotAuth.copilotToken, model)
        if (probe.ok) {
          console.log(green(`✔ ${model} is available on your subscription.`))
          break
        }
        console.log(red(`✘ ${model} rejected by Copilot: ${probe.reason}`))
        if (probe.status === 400 || probe.status === 403 || probe.status === 404) {
          console.log(yellow('  Your subscription tier likely does not include this model. Pick a different one.'))
          model = await getModel(rl, preset, provider, token, copilotModels)
          continue
        }
        // Non-entitlement error (network, 5xx, etc.). Save anyway and let the
        // user iterate later if it's transient.
        console.log(yellow('  Treating this as transient and saving the profile anyway. Re-run setup if launch fails.'))
        break
      }
    }

    if (provider !== 'copilot' && preset.tokenVar && !token) {
      console.log()
      console.log(red(`Setup aborted — no ${preset.tokenVar} provided.`))
      console.log(dim('  Re-run `bun run setup` and paste a token, or use --force to overwrite an existing profile.'))
      process.exit(1)
    }

    const env: Record<string, string> = {
      OPENAI_BASE_URL: preset.baseUrl,
      OPENAI_MODEL: model,
    }
    if (provider === 'copilot' && copilotAuth) {
      env.OPENAI_API_KEY = copilotAuth.copilotToken
      env.GITHUB_COPILOT_TOKEN = copilotAuth.githubAccessToken
      env.COPILOT_TOKEN_EXPIRES_AT = String(copilotAuth.copilotExpiresAt)
    } else if (preset.tokenVar === 'GITHUB_TOKEN' && token) {
      env.GITHUB_TOKEN = token
    } else if (preset.tokenVar === 'OPENAI_API_KEY' && token) {
      env.OPENAI_API_KEY = token
    } else if (preset.tokenVar === 'GEMINI_API_KEY' && token) {
      env.GEMINI_MODEL = model
      env.GEMINI_BASE_URL = preset.baseUrl
      env.GEMINI_API_KEY = token
      delete env.OPENAI_BASE_URL
      delete env.OPENAI_MODEL
    }

    const profileFile = {
      profile: provider,
      env,
      createdAt: new Date().toISOString(),
    }

    writeFileSync(PROFILE_PATH, JSON.stringify(profileFile, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    })

    console.log()
    console.log(green(`✔ Saved profile to ${PROFILE_PATH}`))
    console.log()
    console.log(bold('Launch with:'))
    console.log(`  ${cyan('bun run dev:profile')}`)
    console.log()
  } finally {
    rl.close()
  }
}

main().catch(err => {
  console.error(red(`Setup failed: ${err?.message ?? err}`))
  process.exit(1)
})

export {}
