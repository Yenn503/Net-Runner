#!/usr/bin/env bun
/**
 * Install a Net-Runner skill from a git URL or local directory into
 * ~/.netrunner/skills/<name>/ (or ./.netrunner/skills/<name>/ with --project).
 *
 * Usage:
 *   bun run skill:install <git-url|local-path> [--project] [--name <override>]
 *
 * Accepts:
 *   - GitHub HTTPS clone URL (https://github.com/user/repo.git)
 *   - SSH clone URL (git@github.com:user/repo.git)
 *   - Local directory with a SKILL.md inside
 *
 * Validation:
 *   - target must contain SKILL.md with valid YAML frontmatter (name + description)
 *   - skill name must be kebab-case (or use --name to override)
 *   - refuses to overwrite an existing skill directory
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { resolve, basename } from 'node:path'

type Args = {
  source: string
  project: boolean
  nameOverride: string | null
}

function parseArgs(argv: string[]): Args {
  let source = ''
  let project = false
  let nameOverride: string | null = null
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--project') project = true
    else if (arg === '--name') nameOverride = argv[++i] ?? null
    else if (arg.startsWith('--')) {
      // ignore unknown flags
    } else if (!source) source = arg
  }
  if (!source) {
    console.error('Usage: bun run skill:install <git-url|local-path> [--project] [--name <override>]')
    process.exit(1)
  }
  if (nameOverride && !/^[a-z][a-z0-9-]{1,63}$/.test(nameOverride)) {
    console.error('--name must be kebab-case, 2-64 chars')
    process.exit(1)
  }
  return { source, project, nameOverride }
}

function isGitUrl(src: string): boolean {
  return /^(https?:\/\/|git@|ssh:\/\/)/.test(src) || src.endsWith('.git')
}

function readFrontmatter(skillFile: string): { name: string; description: string } | null {
  if (!existsSync(skillFile)) return null
  const body = readFileSync(skillFile, 'utf8')
  const match = body.match(/^---\s*\n([\s\S]*?)\n---/m)
  if (!match) return null
  const yaml = match[1]
  const nameLine = yaml.match(/^name:\s*(.+)$/m)
  const descLine = yaml.match(/^description:\s*(.+)$/m)
  if (!nameLine || !descLine) return null
  return {
    name: nameLine[1].trim().replace(/^['"]|['"]$/g, ''),
    description: descLine[1].trim().replace(/^['"]|['"]$/g, ''),
  }
}

function deriveNameFromUrl(url: string): string {
  let n = basename(url).replace(/\.git$/, '')
  if (n.startsWith('netrunner-skill-')) n = n.slice('netrunner-skill-'.length)
  return n.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
}

function stageSource(src: string): string {
  if (isGitUrl(src)) {
    const stage = resolve(tmpdir(), `nr-skill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    console.log(`Cloning ${src} ...`)
    execSync(`git clone --depth 1 ${JSON.stringify(src)} ${JSON.stringify(stage)}`, { stdio: 'inherit' })
    return stage
  }
  const localPath = resolve(src)
  if (!existsSync(localPath) || !statSync(localPath).isDirectory()) {
    console.error(`Local path not found or not a directory: ${localPath}`)
    process.exit(1)
  }
  return localPath
}

function main(): void {
  const args = parseArgs(process.argv.slice(2))
  const staged = stageSource(args.source)
  const skillFile = resolve(staged, 'SKILL.md')
  const meta = readFrontmatter(skillFile)

  if (!meta) {
    console.error(`Source has no valid SKILL.md (missing frontmatter or file absent at ${skillFile}).`)
    console.error('A Net-Runner skill folder must contain SKILL.md with YAML frontmatter (at minimum: name, description).')
    process.exit(1)
  }

  const name = args.nameOverride ?? meta.name
  if (!/^[a-z][a-z0-9-]{1,63}$/.test(name)) {
    console.error(`Resolved skill name "${name}" is not kebab-case. Use --name to override.`)
    process.exit(1)
  }

  const destRoot = args.project
    ? resolve(process.cwd(), '.netrunner', 'skills', name)
    : resolve(homedir(), '.netrunner', 'skills', name)

  if (existsSync(destRoot)) {
    console.error(`Skill already installed at ${destRoot}. Remove it first or pick a different --name.`)
    process.exit(1)
  }

  mkdirSync(destRoot, { recursive: true })
  cpSync(staged, destRoot, {
    recursive: true,
    filter: (src) => !src.includes(`${'\\'}.git${'\\'}`) && !src.includes('/.git/') && !src.endsWith('/.git'),
  })

  console.log(`✓ Installed skill "${name}"`)
  console.log(`  ${destRoot}`)
  console.log(`  Description: ${meta.description}`)
  console.log('')
  console.log(`Restart Net-Runner. Invoke with /${name}.`)
}

main()
