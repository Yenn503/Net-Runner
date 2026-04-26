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

type Provider = 'github' | 'openai' | 'gemini' | 'ollama'

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
    label: 'GitHub Models (free with any GitHub account)',
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
  console.log(`  ${cyan('2')}. ${PROVIDER_PRESETS.openai.label}`)
  console.log(`  ${cyan('3')}. ${PROVIDER_PRESETS.gemini.label}`)
  console.log(`  ${cyan('4')}. ${PROVIDER_PRESETS.ollama.label}`)
  console.log()
  const ans = (await prompt(rl, dim('Enter 1-4 (or press Enter for GitHub Models): '))).trim()
  if (ans === '' || ans === '1') return 'github'
  if (ans === '2') return 'openai'
  if (ans === '3') return 'gemini'
  if (ans === '4') return 'ollama'
  console.log(red(`'${ans}' is not a valid choice. Defaulting to GitHub Models.`))
  return 'github'
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

async function getModel(
  rl: ReturnType<typeof createInterface>,
  preset: typeof PROVIDER_PRESETS[Provider],
  provider: Provider,
): Promise<string> {
  console.log()
  if (provider === 'github') {
    console.log(bold('Common GitHub Models:'))
    console.log(`  ${cyan('•')} openai/gpt-4.1          ${green('(default — strong general)')}`)
    console.log(`  ${cyan('•')} openai/gpt-4o           ${dim('(fast, good tool calling)')}`)
    console.log(`  ${cyan('•')} openai/o1-mini          ${dim('(cheaper reasoning)')}`)
    console.log(`  ${cyan('•')} meta/Llama-3.3-70B-Instruct ${dim('(open weights)')}`)
  } else if (provider === 'openai') {
    console.log(bold('Common OpenAI models: gpt-4o, gpt-4o-mini, o1-mini'))
  } else if (provider === 'ollama') {
    console.log(bold('Common Ollama models: llama3.1:8b, qwen2.5-coder:7b'))
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
    const token = await getToken(rl, preset)
    const model = await getModel(rl, preset, provider)

    if (preset.tokenVar && !token) {
      console.log()
      console.log(red(`Setup aborted — no ${preset.tokenVar} provided.`))
      console.log(dim('  Re-run `bun run setup` and paste a token, or use --force to overwrite an existing profile.'))
      process.exit(1)
    }

    const env: Record<string, string> = {
      OPENAI_BASE_URL: preset.baseUrl,
      OPENAI_MODEL: model,
    }
    if (preset.tokenVar === 'GITHUB_TOKEN' && token) {
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
