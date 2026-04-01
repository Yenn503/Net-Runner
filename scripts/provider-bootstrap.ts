// @ts-nocheck
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  getGoalDefaultOpenAIModel,
  normalizeRecommendationGoal,
  recommendOllamaModel,
} from '../src/utils/providerRecommendation.ts'
import {
  buildOllamaProfileEnv,
  buildOpenAIProfileEnv,
  createProfileFile,
  selectAutoProfile,
  type ProfileFile,
  type ProviderProfile,
} from '../src/utils/providerProfile.ts'
import {
  getOllamaChatBaseUrl,
  hasLocalOllama,
  listOllamaModels,
} from './provider-discovery.ts'

function parseArg(name: string): string | null {
  const args = process.argv.slice(2)
  const idx = args.indexOf(name)
  if (idx === -1) return null
  return args[idx + 1] ?? null
}

function parseProviderArg(): ProviderProfile | 'auto' {
  const p = parseArg('--provider')?.toLowerCase()
  if (p === 'openai' || p === 'ollama') return p
  return 'auto'
}

async function resolveOllamaModel(
  argModel: string | null,
  argBaseUrl: string | null,
  goal: ReturnType<typeof normalizeRecommendationGoal>,
) : Promise<string | null> {
  if (argModel) return argModel

  const discovered = await listOllamaModels(argBaseUrl || undefined)
  const recommended = recommendOllamaModel(discovered, goal)
  return recommended?.name ?? null
}

async function main(): Promise<void> {
  const provider = parseProviderArg()
  const argModel = parseArg('--model')
  const argBaseUrl = parseArg('--base-url')
  const argApiKey = parseArg('--api-key')
  const goal = normalizeRecommendationGoal(
    parseArg('--goal') || process.env.OPENCLAUDE_PROFILE_GOAL,
  )

  let selected: ProviderProfile
  let resolvedOllamaModel: string | null = null
  if (provider === 'auto') {
    if (await hasLocalOllama(argBaseUrl || undefined)) {
      resolvedOllamaModel = await resolveOllamaModel(argModel, argBaseUrl, goal)
      selected = selectAutoProfile(resolvedOllamaModel)
    } else {
      selected = 'openai'
    }
  } else {
    selected = provider
  }

  let env: ProfileFile['env']
  if (selected === 'ollama') {
    resolvedOllamaModel ??= await resolveOllamaModel(argModel, argBaseUrl, goal)
    if (!resolvedOllamaModel) {
      console.error('No viable Ollama chat model was discovered. Pull a chat model first or pass --model explicitly.')
      process.exit(1)
    }

    env = buildOllamaProfileEnv(
      resolvedOllamaModel,
      {
        baseUrl: argBaseUrl,
        getOllamaChatBaseUrl,
      },
    )
  } else {
    const builtEnv = buildOpenAIProfileEnv({
      goal,
      model:
        argModel ||
        process.env.OPENAI_MODEL ||
        getGoalDefaultOpenAIModel(goal),
      apiKey: argApiKey || process.env.OPENAI_API_KEY || null,
      processEnv: {
        ...process.env,
        OPENAI_BASE_URL:
          argBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      },
    })

    if (!builtEnv) {
      console.error('OpenAI profile requires a real API key. Use --api-key or set OPENAI_API_KEY.')
      process.exit(1)
    }

    env = builtEnv
  }

  const profile = createProfileFile(selected, env)

  const outputPath = resolve(process.cwd(), '.openclaude-profile.json')
  writeFileSync(outputPath, JSON.stringify(profile, null, 2), 'utf8')

  console.log(`Saved profile: ${selected}`)
  console.log(`Goal: ${goal}`)
  console.log(`Model: ${profile.env.OPENAI_MODEL}`)
  console.log(`Path: ${outputPath}`)
  console.log('Next: bun run dev:profile')
}

await main()

export {}
