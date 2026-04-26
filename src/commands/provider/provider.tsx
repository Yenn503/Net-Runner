import * as React from 'react'
import { useState } from 'react'
import type {
  LocalJSXCommandCall,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
import TextInput from '../../components/TextInput.js'
import {
  Select,
  type OptionWithDescription,
} from '../../components/CustomSelect/index.js'
import { Dialog } from '../../components/design-system/Dialog.js'
import { LoadingState } from '../../components/design-system/LoadingState.js'
import { Box, Text } from '../../ink.js'
import {
  buildCodexProfileEnv,
  buildGeminiProfileEnv,
  buildGithubProfileEnv,
  buildOllamaProfileEnv,
  buildOpenAIProfileEnv,
  createProfileFile,
  deleteProfileFile,
  loadProfileFile,
  saveProfileFile,
  applySavedProfileToCurrentSession,
  type ProfileEnv,
  type ProviderProfile,
  PROFILE_FILE_NAME,
} from '../../utils/providerProfile.js'
import {
  getGoalDefaultOpenAIModel,
  recommendOllamaModel,
  type RecommendationGoal,
} from '../../utils/providerRecommendation.js'
import { resolveCodexApiCredentials } from '../../services/api/providerConfig.js'
import {
  getOllamaChatBaseUrl,
  hasLocalOllama,
  listOllamaModels,
} from '../../../scripts/provider-discovery.js'

type ProviderChoice =
  | 'auto'
  | 'anthropic'
  | 'ollama'
  | 'openai'
  | 'github'
  | 'gemini'
  | 'codex'
  | 'clear'

type Step =
  | { name: 'choose' }
  | { name: 'auto-goal' }
  | { name: 'auto-detect'; goal: RecommendationGoal }
  | { name: 'ollama-detect' }
  | { name: 'ollama-pick'; models: string[]; recommended?: string }
  | { name: 'openai-key' }
  | { name: 'openai-base'; apiKey: string }
  | { name: 'openai-model'; apiKey: string; baseUrl: string | null }
  | { name: 'github-token' }
  | { name: 'github-model'; token: string }
  | { name: 'gemini-key' }
  | { name: 'gemini-model'; apiKey: string }
  | { name: 'codex-model' }
  | { name: 'codex-manual-key' }
  | { name: 'codex-manual-account'; apiKey: string }
  | { name: 'codex-manual-model'; apiKey: string; accountId: string }
  | { name: 'message'; title: string; body: string; next: Step }

function isEnvTruthy(value: string | undefined): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized !== '' && normalized !== '0' && normalized !== 'false' && normalized !== 'no'
}

function clearProviderEnv(env: NodeJS.ProcessEnv = process.env): void {
  const keys = [
    'NETRUNNER_USE_OPENAI',
    'NETRUNNER_USE_GEMINI',
    'NETRUNNER_USE_GITHUB',
    'CLAUDE_CODE_USE_GITHUB',
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

  for (const key of keys) {
    delete env[key]
  }
}

function getCurrentProviderSummary(): string {
  const persisted = loadProfileFile()
  if (persisted) {
    return `Saved profile: ${persisted.profile}`
  }

  if (isEnvTruthy(process.env.NETRUNNER_USE_GITHUB)) {
    return `Current env: github (${process.env.OPENAI_MODEL ?? 'openai/gpt-4.1'})`
  }
  if (isEnvTruthy(process.env.NETRUNNER_USE_GEMINI)) {
    return `Current env: gemini (${process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'})`
  }
  if (isEnvTruthy(process.env.NETRUNNER_USE_OPENAI)) {
    return `Current env: openai-compatible (${process.env.OPENAI_MODEL ?? 'gpt-4o'})`
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return 'Current env: Anthropic account/API key'
  }

  return 'No saved provider profile'
}

export function shouldShowStartupProviderWizard(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (loadProfileFile()) {
    return false
  }

  if (env.OPENAI_MODEL?.trim() || env.GEMINI_MODEL?.trim()) {
    return false
  }

  if (
    isEnvTruthy(env.NETRUNNER_USE_OPENAI) ||
    isEnvTruthy(env.NETRUNNER_USE_GEMINI) ||
    isEnvTruthy(env.NETRUNNER_USE_GITHUB)
  ) {
    return false
  }

  if (env.ANTHROPIC_API_KEY?.trim()) {
    return false
  }

  return true
}

type TextEntryDialogProps = {
  title: string
  subtitle?: string
  description: React.ReactNode
  initialValue: string
  placeholder?: string
  mask?: string
  validate?: (value: string) => string | null
  onSubmit: (value: string) => void
  onCancel: () => void
}

function TextEntryDialog(props: TextEntryDialogProps): React.ReactNode {
  const [value, setValue] = useState(props.initialValue)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (rawValue?: string) => {
    const nextValue = (rawValue ?? value).trim()
    const validationError = props.validate?.(nextValue) ?? null
    if (validationError) {
      setError(validationError)
      return
    }
    props.onSubmit(nextValue)
  }

  return (
    <Dialog
      title={props.title}
      subtitle={props.subtitle}
      onCancel={props.onCancel}
      isCancelActive={true}
      inputGuide={() => 'Enter to save · Esc to go back'}
    >
      <Box flexDirection="column" gap={1}>
        <Text>{props.description}</Text>
        <TextInput
          value={value}
          onChange={nextValue => {
            setValue(nextValue)
            if (error) setError(null)
          }}
          onSubmit={handleSubmit}
          placeholder={props.placeholder}
          focus
          showCursor
          mask={props.mask}
        />
        {error && <Text color="error">{error}</Text>}
      </Box>
    </Dialog>
  )
}

function ProviderChooser(props: {
  onChoose: (choice: ProviderChoice) => void
  onCancel: () => void
}): React.ReactNode {
  const options: OptionWithDescription<ProviderChoice>[] = [
    {
      value: 'auto',
      label: 'Auto detect',
      description: 'Prefer local Ollama if available, otherwise guide into a remote provider.',
    },
    {
      value: 'ollama',
      label: 'Ollama',
      description: 'Use a local Ollama model and save it as the default.',
    },
    {
      value: 'github',
      label: 'GitHub Models',
      description: 'Use a GitHub token and a GitHub-hosted model.',
    },
    {
      value: 'openai',
      label: 'OpenAI-compatible',
      description: 'Use OpenAI or another OpenAI-compatible endpoint.',
    },
    {
      value: 'gemini',
      label: 'Gemini',
      description: 'Use Gemini with a direct API key.',
    },
    {
      value: 'codex',
      label: 'Codex',
      description: 'Use Codex auth and the codex backend path.',
    },
    {
      value: 'anthropic',
      label: 'Built-in account flow',
      description: 'Use the default Anthropic/account onboarding path instead of a saved provider profile.',
    },
    {
      value: 'clear',
      label: 'Clear saved profile',
      description: `Delete ${PROFILE_FILE_NAME} and return to unconfigured startup.`,
    },
  ]

  return (
    <Dialog
      title="Set up a provider profile"
      subtitle={getCurrentProviderSummary()}
      onCancel={props.onCancel}
    >
      <Box flexDirection="column" gap={1}>
        <Text>
          Choose how Net-Runner should run the CLI model backend. The selection will be
          saved and loaded automatically on future starts.
        </Text>
        <Select options={options} onChange={props.onChoose} />
      </Box>
    </Dialog>
  )
}

function saveAndApplyProfile(
  profile: ProviderProfile,
  env: ProfileEnv,
  onDone: LocalJSXCommandOnDone,
  onChangeAPIKey?: () => void,
): void {
  const profileFile = createProfileFile(profile, env)
  const filePath = saveProfileFile(profileFile)
  void applySavedProfileToCurrentSession({ profileFile }).then(() => {
    onChangeAPIKey?.()
    onDone(
      `Saved ${profile} provider profile to ${filePath}. Restart is not required; this session has been updated.`,
      { display: 'system' },
    )
  })
}

function ProviderWizard(props: {
  onDone: LocalJSXCommandOnDone
  onChangeAPIKey: () => void
  startup?: boolean
}): React.ReactNode {
  const defaultOpenAIModel = getGoalDefaultOpenAIModel('balanced')
  const [step, setStep] = useState<Step>({ name: 'choose' })

  const handleProviderChoice = async (choice: ProviderChoice) => {
    if (choice === 'auto') {
      setStep({ name: 'auto-goal' })
      return
    }
    if (choice === 'ollama') {
      setStep({ name: 'ollama-detect' })
      return
    }
    if (choice === 'openai') {
      setStep({ name: 'openai-key' })
      return
    }
    if (choice === 'github') {
      setStep({ name: 'github-token' })
      return
    }
    if (choice === 'gemini') {
      setStep({ name: 'gemini-key' })
      return
    }
    if (choice === 'codex') {
      const existing = resolveCodexApiCredentials(process.env)
      if (existing.apiKey && existing.accountId) {
        setStep({ name: 'codex-model' })
      } else {
        setStep({ name: 'codex-manual-key' })
      }
      return
    }
    if (choice === 'anthropic') {
      deleteProfileFile()
      clearProviderEnv()
      props.onDone(
        'Cleared saved provider profile. Net-Runner will use the built-in account/onboarding flow for this session.',
        { display: 'system' },
      )
      return
    }
    if (choice === 'clear') {
      deleteProfileFile()
      clearProviderEnv()
      props.onDone(
        `Removed ${PROFILE_FILE_NAME}. Future starts will prompt for setup again unless environment variables are set.`,
        { display: 'system' },
      )
    }
  }

  if (step.name === 'choose') {
    return <ProviderChooser onChoose={choice => void handleProviderChoice(choice)} onCancel={() => props.onDone(props.startup ? 'Provider setup skipped.' : undefined, { display: props.startup ? 'system' : 'skip' })} />
  }

  if (step.name === 'auto-goal') {
    const goalOptions: OptionWithDescription<RecommendationGoal>[] = [
      { value: 'balanced', label: 'Balanced', description: 'Good default mix of speed and quality.' },
      { value: 'coding', label: 'Coding', description: 'Prefer stronger coding-oriented defaults.' },
      { value: 'latency', label: 'Latency', description: 'Prefer faster local choices when possible.' },
    ]
    return (
      <Dialog
        title="Choose an auto-detect goal"
        subtitle="This influences the default model recommendation."
        onCancel={() => setStep({ name: 'choose' })}
      >
        <Select
          options={goalOptions}
          onChange={goal => setStep({ name: 'auto-detect', goal })}
        />
      </Dialog>
    )
  }

  if (step.name === 'auto-detect') {
    return (
      <AutoDetectProvider
        goal={step.goal}
        onCancel={() => setStep({ name: 'choose' })}
        onDetected={result => {
          if (result.kind === 'ollama') {
            const env = buildOllamaProfileEnv(result.model, {
              getOllamaChatBaseUrl,
            })
            saveAndApplyProfile('ollama', env, props.onDone, props.onChangeAPIKey)
            return
          }
          setStep({ name: 'openai-key' })
        }}
      />
    )
  }

  if (step.name === 'ollama-detect') {
    return (
      <OllamaDetection
        onCancel={() => setStep({ name: 'choose' })}
        onResolved={(models, recommended) => {
          if (models.length === 0) {
            setStep({
              name: 'message',
              title: 'No Ollama models available',
              body: 'Ollama was not reachable or no installed chat models were found. Start Ollama and pull a model such as qwen2.5-coder:14b, then try again.',
              next: { name: 'choose' },
            })
            return
          }
          setStep({ name: 'ollama-pick', models, recommended })
        }}
      />
    )
  }

  if (step.name === 'ollama-pick') {
    const options: OptionWithDescription<string>[] = step.models.map(model => ({
      value: model,
      label: model,
      description:
        model === step.recommended
          ? 'Recommended based on the detected local models.'
          : 'Installed local Ollama model.',
    }))
    return (
      <Dialog
        title="Pick an Ollama model"
        subtitle="This model will be saved as the default local runtime."
        onCancel={() => setStep({ name: 'choose' })}
      >
        <Select
          defaultValue={step.recommended}
          defaultFocusValue={step.recommended}
          options={options}
          onChange={model => {
            const env = buildOllamaProfileEnv(model, {
              getOllamaChatBaseUrl,
            })
            saveAndApplyProfile('ollama', env, props.onDone)
          }}
        />
      </Dialog>
    )
  }

  if (step.name === 'openai-key') {
    return (
      <TextEntryDialog
        title="OpenAI-compatible API key"
        subtitle="Used for OpenAI or another OpenAI-compatible endpoint."
        description="Enter the API key to use for this provider."
        initialValue={process.env.OPENAI_API_KEY ?? ''}
        placeholder="sk-..."
        mask="*"
        validate={value => (value ? null : 'An API key is required.')}
        onCancel={() => setStep({ name: 'choose' })}
        onSubmit={value => setStep({ name: 'openai-base', apiKey: value })}
      />
    )
  }

  if (step.name === 'openai-base') {
    return (
      <TextEntryDialog
        title="OpenAI-compatible base URL"
        subtitle="Press Enter to use the default OpenAI endpoint."
        description="Use the default OpenAI endpoint or enter a different OpenAI-compatible base URL."
        initialValue={process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'}
        placeholder="https://api.openai.com/v1"
        onCancel={() => setStep({ name: 'openai-key' })}
        onSubmit={value => setStep({ name: 'openai-model', apiKey: step.apiKey, baseUrl: value || null })}
      />
    )
  }

  if (step.name === 'openai-model') {
    return (
      <TextEntryDialog
        title="OpenAI-compatible model"
        subtitle="Choose the model that should be saved as the default."
        description="Enter the model name to use with this endpoint."
        initialValue={process.env.OPENAI_MODEL ?? defaultOpenAIModel}
        placeholder={defaultOpenAIModel}
        validate={value => (value ? null : 'A model is required.')}
        onCancel={() => setStep({ name: 'openai-base', apiKey: step.apiKey })}
        onSubmit={value => {
          const env = buildOpenAIProfileEnv({
            goal: 'balanced',
            apiKey: step.apiKey,
            baseUrl: step.baseUrl,
            model: value,
            processEnv: process.env,
          })
          if (!env) {
            setStep({
              name: 'message',
              title: 'Could not save OpenAI-compatible profile',
              body: 'The provider profile could not be built. Check the key and try again.',
              next: { name: 'choose' },
            })
            return
          }
          saveAndApplyProfile('openai', env, props.onDone, props.onChangeAPIKey)
        }}
      />
    )
  }

  if (step.name === 'github-token') {
    return (
      <TextEntryDialog
        title="GitHub Models token"
        subtitle="Use a GitHub token with access to GitHub Models."
        description="Enter GITHUB_TOKEN or GH_TOKEN. This is saved as the GitHub-backed provider credential."
        initialValue={process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? ''}
        placeholder="ghp_..."
        mask="*"
        validate={value => (value ? null : 'A GitHub token is required.')}
        onCancel={() => setStep({ name: 'choose' })}
        onSubmit={value => setStep({ name: 'github-model', token: value })}
      />
    )
  }

  if (step.name === 'github-model') {
    return (
      <TextEntryDialog
        title="GitHub Models model"
        subtitle="GitHub-hosted model identifier."
        description="Enter the model to use through GitHub Models."
        initialValue={process.env.OPENAI_MODEL ?? 'openai/gpt-4.1'}
        placeholder="openai/gpt-4.1"
        validate={value => (value ? null : 'A model is required.')}
        onCancel={() => setStep({ name: 'github-token' })}
        onSubmit={value => {
          const env = buildGithubProfileEnv({
            token: step.token,
            model: value,
            baseUrl: 'https://models.github.ai/inference',
            processEnv: process.env,
          })
          if (!env) {
            setStep({
              name: 'message',
              title: 'Could not save GitHub Models profile',
              body: 'The GitHub provider profile could not be built. Check the token and try again.',
              next: { name: 'choose' },
            })
            return
          }
          saveAndApplyProfile('github', env, props.onDone, props.onChangeAPIKey)
        }}
      />
    )
  }

  if (step.name === 'gemini-key') {
    return (
      <TextEntryDialog
        title="Gemini API key"
        subtitle="Use a Gemini API key directly."
        description="Enter GEMINI_API_KEY or GOOGLE_API_KEY."
        initialValue={process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? ''}
        placeholder="AIza..."
        mask="*"
        validate={value => (value ? null : 'A Gemini API key is required.')}
        onCancel={() => setStep({ name: 'choose' })}
        onSubmit={value => setStep({ name: 'gemini-model', apiKey: value })}
      />
    )
  }

  if (step.name === 'gemini-model') {
    return (
      <TextEntryDialog
        title="Gemini model"
        subtitle="Choose the Gemini model to save."
        description="Enter the Gemini model to use for this profile."
        initialValue={process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'}
        placeholder="gemini-2.0-flash"
        validate={value => (value ? null : 'A model is required.')}
        onCancel={() => setStep({ name: 'gemini-key' })}
        onSubmit={value => {
          const env = buildGeminiProfileEnv({
            apiKey: step.apiKey,
            model: value,
            processEnv: process.env,
          })
          if (!env) {
            setStep({
              name: 'message',
              title: 'Could not save Gemini profile',
              body: 'The Gemini profile could not be built. Check the API key and try again.',
              next: { name: 'choose' },
            })
            return
          }
          saveAndApplyProfile('gemini', env, props.onDone, props.onChangeAPIKey)
        }}
      />
    )
  }

  if (step.name === 'codex-model') {
    return (
      <TextEntryDialog
        title="Codex model"
        subtitle="Codex credentials were detected for this machine."
        description="Choose the Codex model alias to save."
        initialValue={process.env.OPENAI_MODEL ?? 'codexplan'}
        placeholder="codexplan"
        validate={value => (value ? null : 'A model is required.')}
        onCancel={() => setStep({ name: 'choose' })}
        onSubmit={value => {
          const env = buildCodexProfileEnv({
            model: value,
            processEnv: process.env,
          })
          if (!env) {
            setStep({
              name: 'message',
              title: 'Codex credentials missing',
              body: 'Codex credentials were not usable. You can provide them manually or set them up outside Net-Runner and retry.',
              next: { name: 'codex-manual-key' },
            })
            return
          }
          saveAndApplyProfile('codex', env, props.onDone, props.onChangeAPIKey)
        }}
      />
    )
  }

  if (step.name === 'codex-manual-key') {
    return (
      <TextEntryDialog
        title="Codex API key"
        subtitle="Manual Codex setup"
        description="Enter CODEX_API_KEY. The next step will ask for the ChatGPT account id."
        initialValue={process.env.CODEX_API_KEY ?? ''}
        placeholder="codex token"
        mask="*"
        validate={value => (value ? null : 'A Codex API key is required.')}
        onCancel={() => setStep({ name: 'choose' })}
        onSubmit={value => setStep({ name: 'codex-manual-account', apiKey: value })}
      />
    )
  }

  if (step.name === 'codex-manual-account') {
    return (
      <TextEntryDialog
        title="ChatGPT account id"
        subtitle="Required for the Codex backend."
        description="Enter CHATGPT_ACCOUNT_ID / CODEX_ACCOUNT_ID."
        initialValue={process.env.CHATGPT_ACCOUNT_ID ?? process.env.CODEX_ACCOUNT_ID ?? ''}
        placeholder="acct_..."
        validate={value => (value ? null : 'A ChatGPT account id is required.')}
        onCancel={() => setStep({ name: 'codex-manual-key' })}
        onSubmit={value => setStep({ name: 'codex-manual-model', apiKey: step.apiKey, accountId: value })}
      />
    )
  }

  if (step.name === 'codex-manual-model') {
    return (
      <TextEntryDialog
        title="Codex model"
        subtitle="Choose the Codex model alias to save."
        description="Enter the Codex model alias to use."
        initialValue={process.env.OPENAI_MODEL ?? 'codexplan'}
        placeholder="codexplan"
        validate={value => (value ? null : 'A model is required.')}
        onCancel={() => setStep({ name: 'codex-manual-account', apiKey: step.apiKey })}
        onSubmit={value => {
          const env = buildCodexProfileEnv({
            model: value,
            apiKey: step.apiKey,
            processEnv: {
              ...process.env,
              CHATGPT_ACCOUNT_ID: step.accountId,
            },
          })
          if (!env) {
            setStep({
              name: 'message',
              title: 'Could not save Codex profile',
              body: 'The manual Codex profile could not be built. Check the key and account id and try again.',
              next: { name: 'choose' },
            })
            return
          }
          saveAndApplyProfile('codex', env, props.onDone, props.onChangeAPIKey)
        }}
      />
    )
  }

  if (step.name === 'message') {
    return (
      <Dialog title={step.title} onCancel={() => setStep(step.next)}>
        <Box flexDirection="column" gap={1}>
          <Text>{step.body}</Text>
          <Select
            options={[{ value: 'back', label: 'Back', description: 'Return to provider setup.' }]}
            onChange={() => setStep(step.next)}
          />
        </Box>
      </Dialog>
    )
  }

  return <LoadingState message="Loading provider setup…" />
}

function AutoDetectProvider(props: {
  goal: RecommendationGoal
  onDetected: (result: { kind: 'ollama'; model: string } | { kind: 'remote' }) => void
  onCancel: () => void
}): React.ReactNode {
  const [resolved, setResolved] = useState(false)

  React.useEffect(() => {
    let active = true
    void (async () => {
      const ollamaAvailable = await hasLocalOllama()
      if (!active) return
      if (!ollamaAvailable) {
        props.onDetected({ kind: 'remote' })
        return
      }
      const models = await listOllamaModels()
      if (!active) return
      const recommended = recommendOllamaModel(models, props.goal)
      if (recommended?.name) {
        props.onDetected({ kind: 'ollama', model: recommended.name })
        return
      }
      props.onDetected({ kind: 'remote' })
    })().finally(() => {
      if (active) setResolved(true)
    })
    return () => {
      active = false
    }
  }, [props])

  return (
    <Dialog title="Auto-detecting provider" onCancel={props.onCancel}>
      <LoadingState message={resolved ? 'Finishing detection…' : 'Checking local and remote provider defaults…'} />
    </Dialog>
  )
}

function OllamaDetection(props: {
  onResolved: (models: string[], recommended?: string) => void
  onCancel: () => void
}): React.ReactNode {
  const [message, setMessage] = useState('Checking local Ollama models…')

  React.useEffect(() => {
    let active = true
    void (async () => {
      const available = await hasLocalOllama()
      if (!active) return
      if (!available) {
        props.onResolved([], undefined)
        return
      }
      setMessage('Reading installed Ollama models…')
      const models = await listOllamaModels()
      if (!active) return
      const names = models.map(model => model.name)
      const recommended = recommendOllamaModel(models, 'balanced')?.name
      props.onResolved(names, recommended)
    })()
    return () => {
      active = false
    }
  }, [props])

  return (
    <Dialog title="Detecting Ollama" onCancel={props.onCancel}>
      <LoadingState message={message} />
    </Dialog>
  )
}

export const call: LocalJSXCommandCall = async (onDone, context) => {
  return <ProviderWizard onDone={onDone} onChangeAPIKey={context.onChangeAPIKey} />
}

export function StartupProviderWizard(props: {
  onDone: LocalJSXCommandOnDone
  onChangeAPIKey: () => void
}): React.ReactNode {
  return <ProviderWizard onDone={props.onDone} onChangeAPIKey={props.onChangeAPIKey} startup />
}
