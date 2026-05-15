/**
 * Net-Runner startup screen — filled-block text logo with sunset gradient.
 * Called once at CLI startup before the Ink UI renders.
 *
 * Startup banner retained as a local product surface for the converted CLI.
 */

declare const MACRO: { VERSION: string; DISPLAY_VERSION?: string }

const ESC = '\x1b['
const RESET = `${ESC}0m`
const DIM = `${ESC}2m`

type RGB = [number, number, number]
const rgb = (r: number, g: number, b: number) => `${ESC}38;2;${r};${g};${b}m`

function lerp(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function gradAt(stops: RGB[], t: number): RGB {
  const c = Math.max(0, Math.min(1, t))
  const s = c * (stops.length - 1)
  const i = Math.floor(s)
  if (i >= stops.length - 1) return stops[stops.length - 1]
  return lerp(stops[i], stops[i + 1], s - i)
}

function paintLine(text: string, stops: RGB[], lineT: number): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const t = text.length > 1 ? lineT * 0.5 + (i / (text.length - 1)) * 0.5 : lineT
    const [r, g, b] = gradAt(stops, t)
    out += `${rgb(r, g, b)}${text[i]}`
  }
  return out + RESET
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const SUNSET_GRAD: RGB[] = [
  [255, 180, 100],
  [240, 140, 80],
  [217, 119, 87],
  [193, 95, 60],
  [160, 75, 55],
  [130, 60, 50],
]

const ACCENT: RGB = [240, 148, 100]
const CREAM: RGB = [220, 195, 170]
const DIMCOL: RGB = [120, 100, 82]
const BORDER: RGB = [100, 80, 65]

// ─── Filled Block Text Logo ───────────────────────────────────────────────────

// Figlet "Standard" font using only basic ASCII punctuation. Renders
// identically in qterminal, xterm, GNOME Terminal, Konsole, Windows
// Terminal, iTerm2, etc. — no unicode-block / box-drawing dependencies.
const LOGO_NET = [
  `  _   _ _____ _____`,
  `  | \\ | | ____|_   _|`,
  `  |  \\| |  _|   | |`,
  `  | |\\  | |___  | |`,
  `  |_| \\_|_____| |_|`,
]

const LOGO_RUNNER = [
  `  ____  _   _ _   _ _   _ _____ ____  ____`,
  `  |  _ \\| | | | \\ | | \\ | | ____|  _ \\/ ___|`,
  `  | |_) | | | |  \\| |  \\| |  _| | |_) \\___ \\`,
  `  |  _ <| |_| | |\\  | |\\  | |___|  _ < ___) |`,
  `  |_| \\_\\\\___/|_| \\_|_| \\_|_____|_| \\_\\____/`,
]

// ─── Provider detection ───────────────────────────────────────────────────────

function detectProvider(): { name: string; model: string; baseUrl: string; isLocal: boolean } {
  const useGemini =
    process.env.NETRUNNER_USE_GEMINI === '1' ||
    process.env.NETRUNNER_USE_GEMINI === 'true' ||
    process.env.CLAUDE_CODE_USE_GEMINI === '1' ||
    process.env.CLAUDE_CODE_USE_GEMINI === 'true'
  const useOpenAI =
    process.env.NETRUNNER_USE_OPENAI === '1' ||
    process.env.NETRUNNER_USE_OPENAI === 'true' ||
    process.env.CLAUDE_CODE_USE_OPENAI === '1' ||
    process.env.CLAUDE_CODE_USE_OPENAI === 'true'

  if (useGemini) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai'
    return { name: 'Google Gemini', model, baseUrl, isLocal: false }
  }

  if (useOpenAI) {
    const model = process.env.OPENAI_MODEL || 'gpt-4o'
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const isLocal = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(baseUrl)

    // Saved-profile name is authoritative when the launcher stamped it.
    // Maps the persisted ProviderProfile value to a human-readable label so
    // the banner never lies about which provider the user picked.
    const profileLabels: Record<string, string> = {
      copilot: 'GitHub Copilot',
      codex: 'OpenAI Codex',
      github: 'GitHub Models',
      openai: 'OpenAI',
      gemini: 'Google Gemini',
      ollama: 'Ollama',
    }
    const stamped = process.env.NETRUNNER_PROFILE_NAME
    if (stamped && profileLabels[stamped]) {
      return { name: profileLabels[stamped], model, baseUrl, isLocal: stamped === 'ollama' || isLocal }
    }

    let name = 'OpenAI'
    if (/githubcopilot\.com/i.test(baseUrl))                          name = 'GitHub Copilot'
    else if (/models\.github\.ai/i.test(baseUrl))                     name = 'GitHub Models'
    else if (/chatgpt\.com\/backend-api\/codex/i.test(baseUrl))       name = 'OpenAI Codex'
    else if (/deepseek/i.test(baseUrl) || /deepseek/i.test(model))    name = 'DeepSeek'
    else if (/openrouter/i.test(baseUrl))                             name = 'OpenRouter'
    else if (/together/i.test(baseUrl))                               name = 'Together AI'
    else if (/groq/i.test(baseUrl))                                   name = 'Groq'
    else if (/mistral/i.test(baseUrl) || /mistral/i.test(model))      name = 'Mistral'
    else if (/azure/i.test(baseUrl))                                  name = 'Azure OpenAI'
    else if (/localhost:11434/i.test(baseUrl))                        name = 'Ollama'
    else if (/localhost:1234/i.test(baseUrl))                         name = 'LM Studio'
    else if (/llama/i.test(model))                                    name = 'Meta Llama'
    else if (isLocal)                                                 name = 'Local'
    return { name, model, baseUrl, isLocal }
  }

  // Default: primary account-provider flow
  const model = process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-6'
  return { name: 'Primary account provider', model, baseUrl: 'https://api.anthropic.com', isLocal: false }
}

// ─── Box drawing ──────────────────────────────────────────────────────────────

function boxRow(content: string, width: number, rawLen: number): string {
  const pad = Math.max(0, width - 2 - rawLen)
  return `${rgb(...BORDER)}\u2502${RESET}${content}${' '.repeat(pad)}${rgb(...BORDER)}\u2502${RESET}`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function printStartupScreen(): void {
  // Skip in non-interactive / CI / print mode
  if (process.env.CI || !process.stdout.isTTY) return

  const p = detectProvider()
  const W = 62
  const out: string[] = []

  out.push('')

  // Gradient logo
  const allLogo = [...LOGO_NET, '', ...LOGO_RUNNER]
  const total = allLogo.length
  for (let i = 0; i < total; i++) {
    const t = total > 1 ? i / (total - 1) : 0
    if (allLogo[i] === '') {
      out.push('')
    } else {
      out.push(paintLine(allLogo[i], SUNSET_GRAD, t))
    }
  }

  out.push('')

  // Tagline
  out.push(`  ${rgb(...ACCENT)}\u2726${RESET} ${rgb(...CREAM)}Skill-first workflows. Real tools. Selective MCP.${RESET} ${rgb(...ACCENT)}\u2726${RESET}`)
  out.push('')

  // Provider info box
  out.push(`${rgb(...BORDER)}\u2554${'\u2550'.repeat(W - 2)}\u2557${RESET}`)

  const lbl = (k: string, v: string, c: RGB = CREAM): [string, number] => {
    const padK = k.padEnd(9)
    return [` ${DIM}${rgb(...DIMCOL)}${padK}${RESET} ${rgb(...c)}${v}${RESET}`, ` ${padK} ${v}`.length]
  }

  const provC: RGB = p.isLocal ? [130, 175, 130] : ACCENT
  let [r, l] = lbl('Provider', p.name, provC)
  out.push(boxRow(r, W, l))
  ;[r, l] = lbl('Model', p.model)
  out.push(boxRow(r, W, l))
  const ep = p.baseUrl.length > 38 ? p.baseUrl.slice(0, 35) + '...' : p.baseUrl
  ;[r, l] = lbl('Endpoint', ep)
  out.push(boxRow(r, W, l))

  out.push(`${rgb(...BORDER)}\u2560${'\u2550'.repeat(W - 2)}\u2563${RESET}`)

  const sC: RGB = p.isLocal ? [130, 175, 130] : ACCENT
  const sL = p.isLocal ? 'local' : 'cloud'
  const sRow = ` ${rgb(...sC)}\u25cf${RESET} ${DIM}${rgb(...DIMCOL)}${sL}${RESET}    ${DIM}${rgb(...DIMCOL)}Ready \u2014 type ${RESET}${rgb(...ACCENT)}/help${RESET}${DIM}${rgb(...DIMCOL)} to begin${RESET}`
  const sLen = ` \u25cf ${sL}    Ready \u2014 type /help to begin`.length
  out.push(boxRow(sRow, W, sLen))

  out.push(`${rgb(...BORDER)}\u255a${'\u2550'.repeat(W - 2)}\u255d${RESET}`)
  out.push(`  ${DIM}${rgb(...DIMCOL)}net-runner ${RESET}${rgb(...ACCENT)}v${MACRO.DISPLAY_VERSION ?? MACRO.VERSION}${RESET}`)
  out.push('')

  process.stdout.write(out.join('\n') + '\n')
}
