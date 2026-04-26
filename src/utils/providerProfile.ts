import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  DEFAULT_CODEX_BASE_URL,
  DEFAULT_GITHUB_MODELS_BASE_URL,
  DEFAULT_GITHUB_MODELS_MODEL,
  DEFAULT_OPENAI_BASE_URL,
  isCodexBaseUrl,
  resolveCodexApiCredentials,
  resolveProviderRequest,
} from '../services/api/providerConfig.ts'
import {
  getGoalDefaultOpenAIModel,
  type RecommendationGoal,
} from './providerRecommendation.ts'

const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai'
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'
export const PROFILE_FILE_NAME = '.net-runner-profile.json'

export type ProviderProfile = 'openai' | 'ollama' | 'codex' | 'gemini' | 'github' | 'copilot'

export type ProfileEnv = {
  OPENAI_BASE_URL?: string
  OPENAI_MODEL?: string
  OPENAI_API_KEY?: string
  CODEX_API_KEY?: string
  CHATGPT_ACCOUNT_ID?: string
  CODEX_ACCOUNT_ID?: string
  GITHUB_COPILOT_TOKEN?: string
  COPILOT_TOKEN_EXPIRES_AT?: string
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  GEMINI_BASE_URL?: string
  GITHUB_TOKEN?: string
}

export type ProfileFile = {
  profile: ProviderProfile
  env: ProfileEnv
  createdAt: string
}

type ProfileFileLocation = {
  cwd?: string
  filePath?: string
}

function resolveProfileFilePath(options?: ProfileFileLocation): string {
  if (options?.filePath) {
    return options.filePath
  }

  return resolve(options?.cwd ?? process.cwd(), PROFILE_FILE_NAME)
}

export function sanitizeApiKey(
  key: string | null | undefined,
): string | undefined {
  if (!key || key === 'SUA_CHAVE') return undefined
  return key
}

export function buildOllamaProfileEnv(
  model: string,
  options: {
    baseUrl?: string | null
    getOllamaChatBaseUrl: (baseUrl?: string) => string
  },
): ProfileEnv {
  return {
    OPENAI_BASE_URL: options.getOllamaChatBaseUrl(options.baseUrl ?? undefined),
    OPENAI_MODEL: model,
  }
}

export function buildGeminiProfileEnv(options: {
  model?: string | null
  baseUrl?: string | null
  apiKey?: string | null
  processEnv?: NodeJS.ProcessEnv
}): ProfileEnv | null {
  const processEnv = options.processEnv ?? process.env
  const key = sanitizeApiKey(
    options.apiKey ??
      processEnv.GEMINI_API_KEY ??
      processEnv.GOOGLE_API_KEY,
  )
  if (!key) {
    return null
  }

  const env: ProfileEnv = {
    GEMINI_MODEL:
      options.model || processEnv.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    GEMINI_API_KEY: key,
  }

  const baseUrl = options.baseUrl || processEnv.GEMINI_BASE_URL
  if (baseUrl) {
    env.GEMINI_BASE_URL = baseUrl
  }

  return env
}

export function buildGithubProfileEnv(options: {
  model?: string | null
  baseUrl?: string | null
  token?: string | null
  processEnv?: NodeJS.ProcessEnv
}): ProfileEnv | null {
  const processEnv = options.processEnv ?? process.env
  // Accept GitHub-shaped tokens that users have pasted into OPENAI_API_KEY by
  // mistake (a common confusion since GitHub Models docs describe the API as
  // "OpenAI-compatible"). This prevents a github_pat_* token from being
  // forwarded to api.openai.com and rejected as invalid.
  const openAiAsGithub =
    processEnv.OPENAI_API_KEY &&
    /^(github_pat_|ghp_|gho_|ghu_|ghs_)/.test(processEnv.OPENAI_API_KEY)
      ? processEnv.OPENAI_API_KEY
      : undefined
  const token = sanitizeApiKey(
    options.token ??
      processEnv.GITHUB_TOKEN ??
      processEnv.GH_TOKEN ??
      openAiAsGithub,
  )
  if (!token) {
    return null
  }

  return {
    OPENAI_BASE_URL:
      options.baseUrl ||
      processEnv.OPENAI_BASE_URL ||
      DEFAULT_GITHUB_MODELS_BASE_URL,
    OPENAI_MODEL:
      options.model ||
      processEnv.OPENAI_MODEL ||
      DEFAULT_GITHUB_MODELS_MODEL,
    GITHUB_TOKEN: token,
  }
}

export function buildOpenAIProfileEnv(options: {
  goal: RecommendationGoal
  model?: string | null
  baseUrl?: string | null
  apiKey?: string | null
  processEnv?: NodeJS.ProcessEnv
}): ProfileEnv | null {
  const processEnv = options.processEnv ?? process.env
  const key = sanitizeApiKey(options.apiKey ?? processEnv.OPENAI_API_KEY)
  if (!key) {
    return null
  }

  // Refuse to forward GitHub-issued tokens to OpenAI's endpoint. Users who
  // paste a github_pat_* into OPENAI_API_KEY belong on the github profile,
  // not openai. Returning null here lets the launcher fall through to the
  // walkthrough or the github profile path instead of producing a misleading
  // 401 from api.openai.com.
  if (/^(github_pat_|ghp_|gho_|ghu_|ghs_)/.test(key)) {
    return null
  }

  const defaultModel = getGoalDefaultOpenAIModel(options.goal)
  const shellOpenAIRequest = resolveProviderRequest({
    model: processEnv.OPENAI_MODEL,
    baseUrl: processEnv.OPENAI_BASE_URL,
    fallbackModel: defaultModel,
  })
  const useShellOpenAIConfig = shellOpenAIRequest.transport === 'chat_completions'

  return {
    OPENAI_BASE_URL:
      options.baseUrl ||
      (useShellOpenAIConfig ? processEnv.OPENAI_BASE_URL : undefined) ||
      DEFAULT_OPENAI_BASE_URL,
    OPENAI_MODEL:
      options.model ||
      (useShellOpenAIConfig ? processEnv.OPENAI_MODEL : undefined) ||
      defaultModel,
    OPENAI_API_KEY: key,
  }
}

export function buildCodexProfileEnv(options: {
  model?: string | null
  baseUrl?: string | null
  apiKey?: string | null
  processEnv?: NodeJS.ProcessEnv
}): ProfileEnv | null {
  const processEnv = options.processEnv ?? process.env
  const key = sanitizeApiKey(options.apiKey ?? processEnv.CODEX_API_KEY)
  const credentialEnv = key
    ? ({ ...processEnv, CODEX_API_KEY: key } as NodeJS.ProcessEnv)
    : processEnv
  const credentials = resolveCodexApiCredentials(credentialEnv)
  if (!credentials.apiKey || !credentials.accountId) {
    return null
  }

  const env: ProfileEnv = {
    OPENAI_BASE_URL: options.baseUrl || DEFAULT_CODEX_BASE_URL,
    OPENAI_MODEL: options.model || 'codexplan',
  }

  if (key) {
    env.CODEX_API_KEY = key
  }

  env.CHATGPT_ACCOUNT_ID = credentials.accountId

  return env
}

export function createProfileFile(
  profile: ProviderProfile,
  env: ProfileEnv,
): ProfileFile {
  return {
    profile,
    env,
    createdAt: new Date().toISOString(),
  }
}

export function loadProfileFile(options?: ProfileFileLocation): ProfileFile | null {
  const filePath = resolveProfileFilePath(options)
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<ProfileFile>
    if (
      parsed.profile !== 'openai' &&
      parsed.profile !== 'ollama' &&
      parsed.profile !== 'codex' &&
      parsed.profile !== 'gemini' &&
      parsed.profile !== 'github' &&
      parsed.profile !== 'copilot'
    ) {
      return null
    }

    if (!parsed.env || typeof parsed.env !== 'object') {
      return null
    }

    return {
      profile: parsed.profile,
      env: parsed.env,
      createdAt:
        typeof parsed.createdAt === 'string'
          ? parsed.createdAt
          : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function saveProfileFile(
  profileFile: ProfileFile,
  options?: ProfileFileLocation,
): string {
  const filePath = resolveProfileFilePath(options)
  writeFileSync(filePath, JSON.stringify(profileFile, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  })
  return filePath
}

export function deleteProfileFile(options?: ProfileFileLocation): string {
  const filePath = resolveProfileFilePath(options)
  rmSync(filePath, { force: true })
  return filePath
}

export function selectAutoProfile(
  recommendedOllamaModel: string | null,
  env: NodeJS.ProcessEnv = process.env,
): ProviderProfile | null {
  if (recommendedOllamaModel) return 'ollama'

  // GitHub-issued tokens are routinely pasted into OPENAI_API_KEY by users
  // following GitHub Models docs that talk about "OpenAI-compatible APIs".
  // Detect that case explicitly and route to the github profile so the request
  // hits models.github.ai/inference, not api.openai.com.
  const openAiKey = env.OPENAI_API_KEY
  const looksLikeGithubToken = (value: string | undefined): boolean =>
    !!value && (value.startsWith('github_pat_') || value.startsWith('ghp_') || value.startsWith('gho_') || value.startsWith('ghu_') || value.startsWith('ghs_'))

  if (env.GITHUB_TOKEN || env.GH_TOKEN || looksLikeGithubToken(openAiKey)) {
    return 'github'
  }

  // Auto-detect a usable OpenAI profile from environment credentials.
  // SUA_CHAVE is the documented placeholder string and must never count as a real key.
  if (openAiKey && openAiKey !== 'SUA_CHAVE') return 'openai'
  if (env.GEMINI_API_KEY) return 'gemini'
  // No usable credentials — let the CLI's first-run walkthrough configure one.
  return null
}

export async function buildLaunchEnv(options: {
  profile: ProviderProfile
  persisted: ProfileFile | null
  goal: RecommendationGoal
  processEnv?: NodeJS.ProcessEnv
  getOllamaChatBaseUrl?: (baseUrl?: string) => string
  resolveOllamaDefaultModel?: (goal: RecommendationGoal) => Promise<string>
}): Promise<NodeJS.ProcessEnv> {
  const processEnv = options.processEnv ?? process.env
  const persistedEnv =
    options.persisted?.profile === options.profile
      ? options.persisted.env ?? {}
      : {}

  const shellGeminiKey = sanitizeApiKey(
    processEnv.GEMINI_API_KEY ?? processEnv.GOOGLE_API_KEY,
  )
  const persistedGeminiKey = sanitizeApiKey(persistedEnv.GEMINI_API_KEY)

  if (options.profile === 'gemini') {
    const env: NodeJS.ProcessEnv = {
      ...processEnv,
      NETRUNNER_USE_GEMINI: '1',
    }

    delete env.NETRUNNER_USE_OPENAI

    env.GEMINI_MODEL =
      processEnv.GEMINI_MODEL ||
      persistedEnv.GEMINI_MODEL ||
      DEFAULT_GEMINI_MODEL
    env.GEMINI_BASE_URL =
      processEnv.GEMINI_BASE_URL ||
      persistedEnv.GEMINI_BASE_URL ||
      DEFAULT_GEMINI_BASE_URL

    const geminiKey = shellGeminiKey || persistedGeminiKey
    if (geminiKey) {
      env.GEMINI_API_KEY = geminiKey
    } else {
      delete env.GEMINI_API_KEY
    }

    delete env.GOOGLE_API_KEY
    delete env.OPENAI_BASE_URL
    delete env.OPENAI_MODEL
    delete env.OPENAI_API_KEY
    delete env.CODEX_API_KEY
    delete env.CHATGPT_ACCOUNT_ID
    delete env.CODEX_ACCOUNT_ID

    return env
  }

  if (options.profile === 'copilot') {
    // Copilot profile: persisted env carries OPENAI_BASE_URL pointing at
    // api.githubcopilot.com plus a short-lived OPENAI_API_KEY (the Copilot
    // service token, refreshed by the launcher before reaching here) and the
    // long-lived GITHUB_COPILOT_TOKEN used to mint new service tokens.
    //
    // NETRUNNER_USE_GITHUB is set so the OpenAI shim's GitHub-mode branch
    // fires; combined with the api.githubcopilot.com host that branch
    // attaches the required Editor-Version / Copilot-Integration-Id headers
    // (without those headers Copilot rejects requests with 'missing
    // Editor-Version header for IDE auth').
    const env: NodeJS.ProcessEnv = {
      ...processEnv,
      NETRUNNER_USE_OPENAI: '1',
      NETRUNNER_USE_GITHUB: '1',
      NETRUNNER_USE_COPILOT: '1',
    }
    delete env.NETRUNNER_USE_GEMINI

    env.OPENAI_BASE_URL =
      processEnv.OPENAI_BASE_URL ||
      persistedEnv.OPENAI_BASE_URL ||
      'https://api.githubcopilot.com'
    env.OPENAI_MODEL =
      processEnv.OPENAI_MODEL ||
      persistedEnv.OPENAI_MODEL ||
      'gpt-4o'
    env.OPENAI_API_KEY =
      processEnv.OPENAI_API_KEY ||
      persistedEnv.OPENAI_API_KEY ||
      ''

    if (persistedEnv.GITHUB_COPILOT_TOKEN) {
      env.GITHUB_COPILOT_TOKEN = persistedEnv.GITHUB_COPILOT_TOKEN
    }
    if (persistedEnv.COPILOT_TOKEN_EXPIRES_AT) {
      env.COPILOT_TOKEN_EXPIRES_AT = persistedEnv.COPILOT_TOKEN_EXPIRES_AT
    }

    delete env.GEMINI_API_KEY
    delete env.GEMINI_MODEL
    delete env.GEMINI_BASE_URL
    delete env.GOOGLE_API_KEY
    delete env.CODEX_API_KEY
    delete env.CHATGPT_ACCOUNT_ID
    delete env.CODEX_ACCOUNT_ID
    delete env.GITHUB_TOKEN

    return env
  }

  if (options.profile === 'github') {
    const env: NodeJS.ProcessEnv = {
      ...processEnv,
      NETRUNNER_USE_GITHUB: '1',
      NETRUNNER_USE_OPENAI: '1',
    }

    delete env.NETRUNNER_USE_GEMINI

    env.OPENAI_BASE_URL =
      processEnv.OPENAI_BASE_URL ||
      persistedEnv.OPENAI_BASE_URL ||
      DEFAULT_GITHUB_MODELS_BASE_URL
    env.OPENAI_MODEL =
      processEnv.OPENAI_MODEL ||
      persistedEnv.OPENAI_MODEL ||
      DEFAULT_GITHUB_MODELS_MODEL

    const githubToken =
      sanitizeApiKey(processEnv.GITHUB_TOKEN) ||
      sanitizeApiKey(processEnv.GH_TOKEN) ||
      sanitizeApiKey(persistedEnv.GITHUB_TOKEN)

    if (githubToken) {
      env.GITHUB_TOKEN = githubToken
      env.OPENAI_API_KEY = githubToken
    } else {
      delete env.GITHUB_TOKEN
      delete env.OPENAI_API_KEY
    }

    delete env.GEMINI_API_KEY
    delete env.GEMINI_MODEL
    delete env.GEMINI_BASE_URL
    delete env.GOOGLE_API_KEY
    delete env.CODEX_API_KEY
    delete env.CHATGPT_ACCOUNT_ID
    delete env.CODEX_ACCOUNT_ID

    return env
  }

  const env: NodeJS.ProcessEnv = {
    ...processEnv,
    NETRUNNER_USE_OPENAI: '1',
  }

  delete env.NETRUNNER_USE_GEMINI
  delete env.GEMINI_API_KEY
  delete env.GEMINI_MODEL
  delete env.GEMINI_BASE_URL
  delete env.GOOGLE_API_KEY

  if (options.profile === 'ollama') {
    const getOllamaBaseUrl =
      options.getOllamaChatBaseUrl ?? (() => 'http://localhost:11434/v1')
    const resolveOllamaModel =
      options.resolveOllamaDefaultModel ?? (async () => 'llama3.1:8b')

    env.OPENAI_BASE_URL = persistedEnv.OPENAI_BASE_URL || getOllamaBaseUrl()
    env.OPENAI_MODEL =
      persistedEnv.OPENAI_MODEL ||
      (await resolveOllamaModel(options.goal))

    delete env.OPENAI_API_KEY
    delete env.CODEX_API_KEY
    delete env.CHATGPT_ACCOUNT_ID
    delete env.CODEX_ACCOUNT_ID

    return env
  }

  if (options.profile === 'codex') {
    env.OPENAI_BASE_URL =
      persistedEnv.OPENAI_BASE_URL && isCodexBaseUrl(persistedEnv.OPENAI_BASE_URL)
        ? persistedEnv.OPENAI_BASE_URL
        : DEFAULT_CODEX_BASE_URL
    env.OPENAI_MODEL = persistedEnv.OPENAI_MODEL || 'codexplan'
    delete env.OPENAI_API_KEY

    const codexKey =
      sanitizeApiKey(processEnv.CODEX_API_KEY) ||
      sanitizeApiKey(persistedEnv.CODEX_API_KEY)
    const liveCodexCredentials = resolveCodexApiCredentials(processEnv)
    const codexAccountId =
      processEnv.CHATGPT_ACCOUNT_ID ||
      processEnv.CODEX_ACCOUNT_ID ||
      liveCodexCredentials.accountId ||
      persistedEnv.CHATGPT_ACCOUNT_ID ||
      persistedEnv.CODEX_ACCOUNT_ID
    if (codexKey) {
      env.CODEX_API_KEY = codexKey
    } else {
      delete env.CODEX_API_KEY
    }

    if (codexAccountId) {
      env.CHATGPT_ACCOUNT_ID = codexAccountId
    } else {
      delete env.CHATGPT_ACCOUNT_ID
    }
    delete env.CODEX_ACCOUNT_ID

    return env
  }

  const defaultOpenAIModel = getGoalDefaultOpenAIModel(options.goal)
  const shellOpenAIRequest = resolveProviderRequest({
    model: processEnv.OPENAI_MODEL,
    baseUrl: processEnv.OPENAI_BASE_URL,
    fallbackModel: defaultOpenAIModel,
  })
  const persistedOpenAIRequest = resolveProviderRequest({
    model: persistedEnv.OPENAI_MODEL,
    baseUrl: persistedEnv.OPENAI_BASE_URL,
    fallbackModel: defaultOpenAIModel,
  })
  const useShellOpenAIConfig = shellOpenAIRequest.transport === 'chat_completions'
  const usePersistedOpenAIConfig =
    (!persistedEnv.OPENAI_MODEL && !persistedEnv.OPENAI_BASE_URL) ||
    persistedOpenAIRequest.transport === 'chat_completions'

  env.OPENAI_BASE_URL =
    (useShellOpenAIConfig ? processEnv.OPENAI_BASE_URL : undefined) ||
    (usePersistedOpenAIConfig ? persistedEnv.OPENAI_BASE_URL : undefined) ||
    DEFAULT_OPENAI_BASE_URL
  env.OPENAI_MODEL =
    (useShellOpenAIConfig ? processEnv.OPENAI_MODEL : undefined) ||
    (usePersistedOpenAIConfig ? persistedEnv.OPENAI_MODEL : undefined) ||
    defaultOpenAIModel
  env.OPENAI_API_KEY = processEnv.OPENAI_API_KEY || persistedEnv.OPENAI_API_KEY
  delete env.CODEX_API_KEY
  delete env.CHATGPT_ACCOUNT_ID
  delete env.CODEX_ACCOUNT_ID
  return env
}

export function applyProfileEnvToProcessEnv(
  targetEnv: NodeJS.ProcessEnv,
  nextEnv: NodeJS.ProcessEnv,
): void {
  const keysToClear = [
    'NETRUNNER_USE_OPENAI',
    'NETRUNNER_USE_GEMINI',
    'NETRUNNER_USE_GITHUB',
    'OPENAI_BASE_URL',
    'OPENAI_MODEL',
    'OPENAI_API_KEY',
    'CODEX_API_KEY',
    'CHATGPT_ACCOUNT_ID',
    'CODEX_ACCOUNT_ID',
    'GEMINI_API_KEY',
    'GEMINI_MODEL',
    'GEMINI_BASE_URL',
    'GOOGLE_API_KEY',
    'GITHUB_TOKEN',
  ] as const

  for (const key of keysToClear) {
    delete targetEnv[key]
  }

  Object.assign(targetEnv, nextEnv)
}

export async function buildStartupEnvFromProfile(options?: {
  persisted?: ProfileFile | null
  goal?: RecommendationGoal
  processEnv?: NodeJS.ProcessEnv
  getOllamaChatBaseUrl?: (baseUrl?: string) => string
  resolveOllamaDefaultModel?: (goal: RecommendationGoal) => Promise<string>
}): Promise<NodeJS.ProcessEnv> {
  const processEnv = options?.processEnv ?? process.env
  const persisted = options?.persisted ?? loadProfileFile()

  if (!persisted) {
    return processEnv
  }

  return buildLaunchEnv({
    profile: persisted.profile,
    persisted,
    goal: options?.goal ?? 'balanced',
    processEnv,
    getOllamaChatBaseUrl: options?.getOllamaChatBaseUrl,
    resolveOllamaDefaultModel: options?.resolveOllamaDefaultModel,
  })
}

export async function applySavedProfileToCurrentSession(options: {
  profileFile: ProfileFile
  processEnv?: NodeJS.ProcessEnv
}): Promise<void> {
  const processEnv = options.processEnv ?? process.env
  const nextEnv = await buildLaunchEnv({
    profile: options.profileFile.profile,
    persisted: options.profileFile,
    goal: 'balanced',
    processEnv: { ...processEnv },
  })
  applyProfileEnvToProcessEnv(processEnv, nextEnv)
}
