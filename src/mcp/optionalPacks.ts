/**
 * Optional MCP capability packs.
 *
 * Net-Runner ships its own `net-runner` MCP server (always on). These packs
 * are extra, operator-selected MCP servers — reverse-engineering and web-proxy
 * tooling — that an operator can enable once and have the harness preload on
 * every launch. Enabling a pack writes its entry into `.mcp.json`.
 *
 * Managed by `bun run mcp:packs` (scripts/mcp-packs.ts). The configs here are
 * taken verbatim from each project's official documentation — not guessed.
 */

export type McpPackTransport =
  | { type: 'stdio'; command: string; args: string[]; env?: Record<string, string> }
  | { type: 'http'; url: string }

export interface McpPack {
  /** Stable id — also the key written under `.mcp.json` -> mcpServers. */
  id: string
  name: string
  description: string
  /** Official upstream project. */
  homepage: string
  /** Operator environment this pack is meant to run in. */
  environment: 'kali-operator' | 'windows-operator' | 'any'
  /** Human-readable install prerequisite, shown before enabling. */
  install: string
  /** The `.mcp.json` server entry written when the pack is enabled. */
  server: McpPackTransport
  /**
   * Set when the operator must confirm/edit something after enabling — e.g. a
   * local path or a port the host tool prints. The pack still enables; this is
   * surfaced as a warning.
   */
  needsOperatorConfig?: string
}

export const MCP_PACKS: McpPack[] = [
  {
    id: 'ghidra-mcp',
    name: 'Ghidra MCP',
    description:
      'Reverse-engineering MCP — drives Ghidra (decompilation, call graphs, P-code emulation, debugger). For the code-forensics and infra specialists on binary work.',
    homepage: 'https://github.com/bethington/ghidra-mcp',
    environment: 'any',
    install:
      'Install the Ghidra MCP GUI plugin + Python bridge per the upstream README, then start the HTTP bridge: `python bridge_mcp_ghidra.py --transport streamable-http --mcp-port 8081`.',
    // HTTP transport (path-free). Per upstream README "Option 2".
    server: { type: 'http', url: 'http://127.0.0.1:8081/mcp' },
    needsOperatorConfig:
      'Start the Ghidra MCP bridge before launching the harness, or the server will be unreachable.',
  },
  {
    id: 'binary-ninja-mcp',
    name: 'Binary Ninja MCP',
    description:
      'Reverse-engineering MCP — drives Binary Ninja. Alternative/complement to Ghidra MCP for binary analysis.',
    homepage: 'https://github.com/fosdickio/binary_ninja_mcp',
    environment: 'any',
    install:
      'Install the Binary Ninja plugin via its Plugin Manager. The MCP bridge runs via npx — no extra install. Requires a licensed Binary Ninja.',
    // stdio via the official npm package. Per upstream README "Using npm package".
    server: {
      type: 'stdio',
      command: 'npx',
      args: ['-y', 'binary-ninja-mcp', '--host', 'localhost', '--port', '9009'],
    },
    needsOperatorConfig:
      'Binary Ninja must be running with the MCP server plugin started on port 9009.',
  },
  {
    id: 'burp-mcp',
    name: 'Burp Suite MCP',
    description:
      'Web-proxy MCP — connects to Burp Suite via PortSwigger’s official MCP server BApp. For the app-testing specialist on a Kali operator box.',
    homepage:
      'https://portswigger.net/bappstore/9952290f04ed4f628e624d0aa9dccebc',
    environment: 'kali-operator',
    install:
      'In Burp Suite: Extensions -> BApp Store -> install "MCP Server". Enable it; Burp prints the MCP server URL.',
    // Burp's MCP server BApp serves over SSE locally.
    server: { type: 'http', url: 'http://127.0.0.1:9876/sse' },
    needsOperatorConfig:
      'Confirm the URL Burp prints when the MCP Server extension loads — edit the .mcp.json entry if it differs from the default port 9876.',
  },
  {
    id: 'windows-mcp',
    name: 'Windows MCP',
    description:
      'Agentic Windows control MCP — file navigation, application control, GUI interaction, screen/snapshot capture on a Windows machine. Lets the harness drive a Windows operator host or detonation VM end-to-end (running tools that have no Linux build, AD tradecraft, payload prep against Defender).',
    homepage: 'https://github.com/CursorTouch/Windows-MCP',
    environment: 'windows-operator',
    install:
      'On the Windows box: install Python 3.13+ and uv (`pip install uv`). The pack invokes `uvx windows-mcp` so no global install is required.',
    // stdio transport per upstream README. Runs on the Windows machine being controlled.
    server: { type: 'stdio', command: 'uvx', args: ['windows-mcp'] },
    needsOperatorConfig:
      'Windows-MCP runs on the Windows host you want the agent to control. If launching from a remote operator box, run `uvx windows-mcp --transport streamable-http --host 0.0.0.0 --port 8000` on the Windows side and change this pack entry to that http URL.',
  },
]

/** Look up a pack by id. */
export function findMcpPack(id: string): McpPack | undefined {
  return MCP_PACKS.find(pack => pack.id === id)
}
