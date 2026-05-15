#!/usr/bin/env bun
/**
 * Scaffold a new Net-Runner skill under ~/.netrunner/skills/<name>/SKILL.md.
 *
 * Usage:
 *   bun run skill:new <skill-name> [--project] [--description "..."]
 *
 * Flags:
 *   --project     write to ./.netrunner/skills/<name>/ (per-project) instead
 *                 of the user-global home (~/.netrunner/skills/<name>/)
 *   --description short description shown to the LLM
 *   --agent       which specialist normally runs this skill
 *                 (engagement-lead | recon-specialist | app-testing-specialist
 *                  | infra-specialist | code-forensics-specialist
 *                  | evidence-reporting-specialist)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

const NETRUNNER_AGENTS = [
  'engagement-lead',
  'recon-specialist',
  'app-testing-specialist',
  'infra-specialist',
  'code-forensics-specialist',
  'evidence-reporting-specialist',
]

type Args = {
  name: string
  project: boolean
  description: string
  agent: string | null
}

function parseArgs(argv: string[]): Args {
  let name = ''
  let project = false
  let description = ''
  let agent: string | null = null
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--project') project = true
    else if (arg === '--description') description = argv[++i] ?? ''
    else if (arg === '--agent') agent = argv[++i] ?? null
    else if (arg.startsWith('--')) {
      // unknown flag — ignore so wrappers can add their own
    } else if (!name) name = arg
  }
  if (!name) {
    console.error('Usage: bun run skill:new <skill-name> [--project] [--description "..."] [--agent <agent-type>]')
    process.exit(1)
  }
  if (!/^[a-z][a-z0-9-]{1,63}$/.test(name)) {
    console.error('Skill name must be kebab-case, start with a letter, 2-64 chars (got: ' + JSON.stringify(name) + ')')
    process.exit(1)
  }
  if (agent && !NETRUNNER_AGENTS.includes(agent)) {
    console.error(`Unknown agent "${agent}". Valid: ${NETRUNNER_AGENTS.join(', ')}`)
    process.exit(1)
  }
  return { name, project, description, agent }
}

function template(args: Args): string {
  const desc = args.description || `Custom Net-Runner skill: ${args.name}`
  const allowedTools = args.agent === 'recon-specialist'
    ? "['Bash', 'Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch']"
    : "['Bash', 'Read', 'Write', 'Edit', 'Grep', 'Glob', 'WebFetch', 'TodoWrite']"
  const agentHint = args.agent ? `\n  Usually invoked by: ${args.agent}.` : ''

  return `---
name: ${args.name}
description: ${desc}
allowed-tools: ${allowedTools}
---

# ${args.name}

${desc}${agentHint}

## When to use

Describe in one sentence the specific situation that triggers this skill.

## Inputs

- Argument: \`{{args}}\` — what the operator passes after \`/${args.name}\`
- Engagement state: this skill assumes a valid engagement is initialized

## Execution

1. **Pre-flight** — query \`nr_kg_query\` for relevant prior facts; skip work the KG already has
2. **Scope check** — call \`nr_scope_check\` for anything that touches a new target / new path
3. **Run** — concrete commands, payloads, or analysis steps
4. **Persist** — save findings via \`nr_save_finding\`, notes via \`nr_save_note\` (no markdown report files; ledger is single source of truth)
5. **Hand off** — \`send_message\` to next specialist with target slice + artifact paths

## Output discipline

- No prose reports in chat
- ≤5 lines back to caller: what was done, artifact paths, next specialist
- All evidence flows through nr_save_finding / nr_save_note
`
}

function main(): void {
  const args = parseArgs(process.argv.slice(2))
  const root = args.project
    ? resolve(process.cwd(), '.netrunner', 'skills', args.name)
    : resolve(homedir(), '.netrunner', 'skills', args.name)
  const skillFile = resolve(root, 'SKILL.md')

  if (existsSync(skillFile)) {
    console.error(`Skill already exists at ${skillFile}`)
    process.exit(1)
  }

  mkdirSync(root, { recursive: true })
  writeFileSync(skillFile, template(args), 'utf8')

  console.log(`✓ Scaffolded ${args.name}`)
  console.log(`  ${skillFile}`)
  console.log('')
  console.log('Next:')
  console.log(`  1. Edit ${skillFile}`)
  console.log(`  2. Restart Net-Runner — skill auto-loads on next launch`)
  console.log(`  3. Invoke with /${args.name} in the harness`)
}

main()
