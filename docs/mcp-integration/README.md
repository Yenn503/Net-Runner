# MCP Integration

Net-Runner exposes a **FastMCP server** with 8 tools following the [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) pattern — minimal surface, no bloat. It also acts as an MCP **client**, connecting to external MCP servers for additional capabilities.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    External LLM                         │
│  (Copilot · Claude Code · Cursor · Windsurf · …)       │
│                                                         │
│  Speaks MCP ──► calls 8 nr_* tools                     │
│  Uses own file tools for reading code / state / docs   │
└────────────────────────┬────────────────────────────────┘
                         │ stdio or httpStream
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Net-Runner FastMCP Server                   │
│                                                         │
│  8 tools (nr_* prefix):                                │
│  • nr_exec          — shell execution (153 tools)      │
│  • nr_engagement_*  — init, status                     │
│  • nr_scope_check   — guardrail enforcement            │
│  • nr_save_*        — finding + note evidence capture  │
│  • nr_list_evidence — query evidence ledger            │
│  • nr_discover      — agents/skills/workflows/caps     │
│                                                         │
│  src/mcp/server.ts                                     │
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

- **Inbound** — an external LLM connects TO Net-Runner and uses its 8 tools
- **Outbound** — Net-Runner connects TO external MCP servers for additional capabilities

---

## Direction 1: External LLM → Net-Runner (Inbound)

The external LLM treats Net-Runner as an MCP tool server with 8 `nr_*` tools. `nr_exec` is the workhorse — all 153 pentest tools run through it. The LLM uses its own built-in file tools for reading code, docs, and state files.

### Prerequisites

```bash
bun install
```

No build step needed — the FastMCP server runs directly from TypeScript source via `bun`.

### Tool surface (8 tools)

| Tool | Purpose |
|---|---|
| `nr_exec` | **Shell execution — the workhorse.** All 153 pentest tools run here. |
| `nr_engagement_init` | Initialize `.netrunner/` engagement with workflow, targets, scope |
| `nr_engagement_status` | Get engagement manifest, evidence counts, run state |
| `nr_scope_check` | Guardrail check — allow/review/block before risky actions |
| `nr_save_finding` | Record security finding with severity, evidence, CWE |
| `nr_save_note` | Append note to evidence ledger |
| `nr_list_evidence` | Query evidence entries with optional type filter |
| `nr_discover` | Progressive disclosure — list agents, skills, workflows, or capabilities on demand |

### Client configurations

Replace `/path/to/net-runner-release` with your actual clone path.

#### Cursor

Create `.cursor/mcp.json` in the project root, or `~/.cursor/mcp.json` for global:

```json
{
  "mcpServers": {
    "net-runner": {
      "command": "bun",
      "args": ["run", "src/mcp/server.ts", "--stdio"],
      "env": { "NR_CWD": "/path/to/net-runner-release" }
    }
  }
}
```

#### Claude Code

Via CLI (easiest):

```bash
claude mcp add --transport stdio net-runner -- bun run /path/to/net-runner-release/src/mcp/server.ts --stdio
```

Or add to `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "net-runner": {
      "command": "bun",
      "args": ["run", "src/mcp/server.ts", "--stdio"],
      "env": { "NR_CWD": "/path/to/net-runner-release" }
    }
  }
}
```

Scopes: `--scope local` (default, `~/.claude.json`), `--scope project` (`.mcp.json`), or `--scope user` (`~/.claude.json`).

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "net-runner": {
      "command": "bun",
      "args": ["run", "/path/to/net-runner-release/src/mcp/server.ts", "--stdio"],
      "env": { "NR_CWD": "/path/to/net-runner-release" }
    }
  }
}
```

#### VS Code / GitHub Copilot

Create `.vscode/mcp.json` in the project root:

```json
{
  "servers": {
    "net-runner": {
      "type": "stdio",
      "command": "bun",
      "args": ["run", "src/mcp/server.ts", "--stdio"],
      "env": { "NR_CWD": "${workspaceFolder}" }
    }
  }
}
```

Note: VS Code uses `"servers"` (not `"mcpServers"`) and supports `${workspaceFolder}`.

#### Windsurf

Create `.windsurf/mcp.json` in the project root, or add to `~/.codeium/windsurf/mcp_config.json` for global:

```json
{
  "mcpServers": {
    "net-runner": {
      "command": "bun",
      "args": ["run", "src/mcp/server.ts", "--stdio"],
      "cwd": "/path/to/net-runner-release"
    }
  }
}
```

#### Any other MCP client

```
command:   bun
args:      run src/mcp/server.ts --stdio
cwd:       /path/to/net-runner-release
transport: stdio
```

### Terminal view (httpStream mode)

Run the server standalone to see the live banner, tool list, and session/call logs:

```bash
bun run mcp:server              # http://localhost:8745/mcp
NR_PORT=9000 bun run mcp:server # custom port
```

The terminal shows a sunset gradient banner, all 8 registered tools, and live activity logs with session IDs, durations, and result sizes.

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

Through 8 MCP tools + its own built-in file/edit tools:

- **Shell execution** (`nr_exec`) — run any of 153 pentest tools (nmap, sqlmap, nuclei, burp, etc.)
- **Engagement lifecycle** (`nr_engagement_init`, `nr_engagement_status`) — initialize and track assessments
- **Guardrails** (`nr_scope_check`) — verify actions are in scope before execution
- **Evidence** (`nr_save_finding`, `nr_save_note`, `nr_list_evidence`) — capture findings and notes
- **Discovery** (`nr_discover`) — explore 12 agents, 11 skills, 7+ workflows, and 153 capabilities on demand
- **File access** — the LLM reads agent prompts, skill definitions, intelligence state, and evidence files using its own file tools (no MCP duplication needed)

The external LLM becomes the "brain" and Net-Runner becomes the "hands."

---

## Security Notes

- The MCP server runs with `isNonInteractiveSession: true` — it does not prompt for confirmation before running tools
- Permission checks still apply via the tool permission system
- Guardrails and scope enforcement remain active
- Evidence is still captured to the `.netrunner/` project folder
- Set environment variables for your model provider before starting the MCP server

---

## Typical Workflow

1. Open your pentest project in your IDE
2. Configure MCP to point at Net-Runner (see client configs above)
3. Open your AI chat panel (Copilot Chat, Cursor, Cascade, Claude Code, etc.)
4. Type: "Initialize an engagement for 10.10.10.1 with web-app-testing workflow"
5. LLM calls `nr_engagement_init` → `.netrunner/` project created
6. Type: "Run an nmap scan on the target"
7. LLM calls `nr_exec` → nmap runs → results come back
8. Type: "Save the open ports as a finding"
9. LLM calls `nr_save_finding` → evidence captured
10. Type: "Now run nuclei against the open web ports"
11. LLM calls `nr_exec` → nuclei runs → findings captured

You stay in your IDE the whole time. Net-Runner handles tool execution, evidence capture, and guardrail enforcement.
