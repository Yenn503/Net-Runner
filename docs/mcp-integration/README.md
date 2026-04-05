# MCP Integration

Net-Runner exposes its entire tool harness over the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) so any MCP-compatible LLM can drive it. It also acts as an MCP **client**, connecting to external MCP servers for additional capabilities.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    External LLM                         │
│  (Copilot · Claude Desktop · Cursor · custom agent)     │
│                                                         │
│  Speaks MCP ──► calls Net-Runner tools                  │
└────────────────────────┬────────────────────────────────┘
                         │ stdio / SSE / HTTP
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Net-Runner MCP Server                  │
│                                                         │
│  Exposes:                                               │
│  • Bash / shell execution                               │
│  • File read / write / edit                             │
│  • 12 specialist agents (engagement-lead, recon, …)     │
│  • 153 red-team tools via shell                         │
│  • Skills, workflows, guardrails, evidence capture      │
│  • Intelligence engine (WAF, feedback, MCTS, KG, OOB)  │
│                                                         │
│  src/entrypoints/mcp.ts                                 │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Net-Runner MCP Client Layer                 │
│                                                         │
│  Connects TO external MCP servers for extra tools       │
│  Configured via .mcp.json / CLI / settings              │
│                                                         │
│  src/services/mcp/client.ts                             │
└─────────────────────────────────────────────────────────┘
```

Two directions:

- **Inbound** — an external LLM connects TO Net-Runner and uses it as a tool server
- **Outbound** — Net-Runner connects TO external MCP servers for additional capabilities

---

## Direction 1: External LLM → Net-Runner (Inbound)

The external LLM treats Net-Runner as an MCP tool server. It sees all tools, can run shell commands, delegate to specialist agents, and use the full harness.

### Prerequisites

```bash
bun install
bun run build
```

### GitHub Copilot (VS Code)

1. Open your project in VS Code with Copilot installed.

2. Create or edit `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "net-runner": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/absolute/path/to/net-runner-release/dist/cli.mjs",
        "mcp",
        "serve"
      ]
    }
  }
}
```

3. Copilot will discover the server and list Net-Runner's tools in the MCP panel.

4. You talk to Copilot through the normal Copilot Chat interface. When Copilot needs to run a pentest tool, read a file, or delegate to a specialist agent, it calls Net-Runner tools behind the scenes.

### GitHub Copilot (CLI)

```bash
gh copilot config set mcp-servers '{
  "net-runner": {
    "type": "stdio",
    "command": "node",
    "args": ["/absolute/path/to/net-runner-release/dist/cli.mjs", "mcp", "serve"]
  }
}'
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "net-runner": {
      "command": "node",
      "args": [
        "/absolute/path/to/net-runner-release/dist/cli.mjs",
        "mcp",
        "serve"
      ]
    }
  }
}
```

### Cursor

Add to Cursor's MCP settings (`Settings → MCP Servers → Add`):

```json
{
  "net-runner": {
    "command": "node",
    "args": [
      "/absolute/path/to/net-runner-release/dist/cli.mjs",
      "mcp",
      "serve"
    ]
  }
}
```

### Windsurf (Cascade)

Add to `.windsurf/mcp.json` in the project root:

```json
{
  "mcpServers": {
    "net-runner": {
      "command": "node",
      "args": [
        "/absolute/path/to/net-runner-release/dist/cli.mjs",
        "mcp",
        "serve"
      ]
    }
  }
}
```

### Any MCP-compatible client

The pattern is always the same:

```
command: node
args:    ["/path/to/net-runner-release/dist/cli.mjs", "mcp", "serve"]
transport: stdio
```

If you're running from source without building:

```
command: bun
args:    ["run", "mcp"]
cwd:     /path/to/net-runner-release
```

---

## Direction 2: Net-Runner → External MCP Servers (Outbound)

Net-Runner can connect to external MCP servers for additional tools. These tools become available to the LLM and all specialist agents during engagements.

### Project-level config (`.mcp.json`)

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "my-custom-tools": {
      "type": "stdio",
      "command": "node",
      "args": ["path/to/my-mcp-server.js"]
    },
    "remote-scanner": {
      "type": "http",
      "url": "https://scanner.example.com/mcp"
    }
  }
}
```

### CLI commands

```bash
# Add a stdio server
net-runner mcp add my-tools -- node path/to/server.js

# Add a remote server
net-runner mcp add-json remote-scanner '{"type":"http","url":"https://example.com/mcp"}'

# List configured servers
net-runner mcp list

# Check a specific server
net-runner mcp get my-tools

# Remove a server
net-runner mcp remove my-tools
```

### Configuration scopes

| Scope | Location | Use case |
|-------|----------|----------|
| `project` | `.mcp.json` | Shared with the team via version control |
| `local` | `.net-runner/settings.local.json` | Personal overrides, not committed |
| `user` | `~/.config/net-runner/settings.json` | Global defaults across all projects |

---

## Communication: Where Do You Talk to the LLM?

This depends on which direction you're using.

### Inbound (External LLM → Net-Runner)

You talk to the LLM through **its own interface**:

| Client | Where you type |
|--------|---------------|
| **GitHub Copilot (VS Code)** | Copilot Chat panel in VS Code |
| **GitHub Copilot (CLI)** | `gh copilot` in your terminal |
| **Claude Desktop** | Claude Desktop chat window |
| **Cursor** | Cursor's AI chat panel |
| **Windsurf** | Cascade chat panel |

The LLM calls Net-Runner tools transparently. You don't need to open a separate Net-Runner terminal — the MCP server runs as a background process managed by the client.

### Outbound (Net-Runner → External MCP servers)

You talk to Net-Runner through **its own CLI**:

```bash
node dist/cli.mjs
# or
bun run dev
```

Net-Runner's LLM can then use tools from any connected MCP servers alongside its built-in 153 tools.

### Both directions simultaneously

You can run Net-Runner in CLI mode (with its own LLM) **and** expose it as an MCP server for another LLM at the same time. These are separate processes — the MCP server is stateless per-request and doesn't conflict with an active CLI session.

---

## What the External LLM Gets

When an LLM connects to Net-Runner via MCP, it sees:

- **Shell execution** — run any command (nmap, sqlmap, nuclei, etc.)
- **File operations** — read, write, edit files in the project
- **12 specialist agents** — delegate to engagement-lead, recon-specialist, web-testing-specialist, etc.
- **Agent memory** — agents remember findings across sessions via `.netrunner/memory/`
- **Guardrails** — all actions checked against scope and impact rules
- **Evidence capture** — findings logged to `.netrunner/evidence/`
- **Intelligence engine** — WAF detection, feedback loop, MCTS planning, knowledge graph

The external LLM becomes the "brain" and Net-Runner becomes the "hands."

---

## Security Notes

- The MCP server runs with `isNonInteractiveSession: true` — it does not prompt for confirmation before running tools
- Permission checks still apply via the tool permission system
- Guardrails and scope enforcement remain active
- Evidence is still captured to the `.netrunner/` project folder
- Set environment variables for your model provider before starting the MCP server

---

## Typical Copilot Workflow

1. Open your pentest project in VS Code
2. Configure `.vscode/mcp.json` to point at Net-Runner
3. Open Copilot Chat
4. Type: "Run an nmap scan on 10.10.10.1 and save the results"
5. Copilot calls Net-Runner's Bash tool → nmap runs → results come back to Copilot
6. Copilot summarizes the findings in chat
7. Type: "Now run nuclei against the open web ports"
8. Copilot calls Net-Runner again → nuclei runs → findings captured

You stay in VS Code the whole time. Net-Runner handles the tool execution, evidence capture, and guardrail enforcement.
