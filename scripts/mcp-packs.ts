#!/usr/bin/env bun
/**
 * Optional MCP capability-pack manager.
 *
 * Net-Runner always runs its own `net-runner` MCP server. This tool lets an
 * operator enable extra MCP servers (reverse-engineering / web-proxy tooling)
 * once — the entry is written into `.mcp.json` and the harness preloads it on
 * every launch.
 *
 * Usage:
 *   bun run mcp:packs                 # list packs + enabled state
 *   bun run mcp:packs enable <id>     # add a pack to .mcp.json
 *   bun run mcp:packs disable <id>    # remove a pack from .mcp.json
 *
 * Pack catalog: src/mcp/optionalPacks.ts
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { MCP_PACKS, findMcpPack } from '../src/mcp/optionalPacks.ts'

const MCP_JSON = join(process.cwd(), '.mcp.json')

type McpConfig = { mcpServers: Record<string, unknown> }

function readConfig(): McpConfig {
  if (!existsSync(MCP_JSON)) {
    return { mcpServers: {} }
  }
  try {
    const parsed = JSON.parse(readFileSync(MCP_JSON, 'utf-8'))
    if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object') {
      parsed.mcpServers = {}
    }
    return parsed as McpConfig
  } catch (err) {
    console.error(`✗ .mcp.json is not valid JSON — fix it before continuing.\n  ${err}`)
    process.exit(1)
  }
}

function writeConfig(config: McpConfig): void {
  writeFileSync(MCP_JSON, `${JSON.stringify(config, null, 2)}\n`)
}

function list(): void {
  const config = readConfig()
  console.log('\nNet-Runner optional MCP packs:\n')
  for (const pack of MCP_PACKS) {
    const on = Object.prototype.hasOwnProperty.call(config.mcpServers, pack.id)
    console.log(`  [${on ? 'enabled ' : 'disabled'}]  ${pack.id}`)
    console.log(`              ${pack.name} — ${pack.environment}`)
    console.log(`              ${pack.description}`)
    console.log(`              ${pack.homepage}\n`)
  }
  console.log('  bun run mcp:packs enable <id>   /   disable <id>\n')
}

function enable(id: string): void {
  const pack = findMcpPack(id)
  if (!pack) {
    console.error(`✗ Unknown pack: ${id}\n  Known: ${MCP_PACKS.map(p => p.id).join(', ')}`)
    process.exit(1)
  }
  const config = readConfig()
  if (Object.prototype.hasOwnProperty.call(config.mcpServers, pack.id)) {
    console.log(`· ${pack.id} already enabled in .mcp.json`)
    return
  }
  config.mcpServers[pack.id] = pack.server
  writeConfig(config)
  console.log(`✓ Enabled ${pack.id} in .mcp.json`)
  console.log(`  Install prerequisite: ${pack.install}`)
  if (pack.needsOperatorConfig) {
    console.log(`  ! ${pack.needsOperatorConfig}`)
  }
}

function disable(id: string): void {
  const pack = findMcpPack(id)
  if (!pack) {
    console.error(`✗ Unknown pack: ${id}`)
    process.exit(1)
  }
  const config = readConfig()
  if (!Object.prototype.hasOwnProperty.call(config.mcpServers, pack.id)) {
    console.log(`· ${pack.id} is not enabled`)
    return
  }
  delete config.mcpServers[pack.id]
  writeConfig(config)
  console.log(`✓ Disabled ${pack.id} — removed from .mcp.json`)
}

const [action, id] = process.argv.slice(2)

switch (action) {
  case undefined:
  case 'list':
    list()
    break
  case 'enable':
    if (!id) {
      console.error('Usage: bun run mcp:packs enable <id>')
      process.exit(1)
    }
    enable(id)
    break
  case 'disable':
    if (!id) {
      console.error('Usage: bun run mcp:packs disable <id>')
      process.exit(1)
    }
    disable(id)
    break
  default:
    console.error(`Unknown action: ${action}\nUsage: bun run mcp:packs [list|enable <id>|disable <id>]`)
    process.exit(1)
}
