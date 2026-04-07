# MCP Integration

Net-Runner exposes a **FastMCP server** with 8 tools following the [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) pattern — minimal surface, no bloat. It also acts as an MCP **client**, connecting to external MCP servers for additional capabilities.

For the open-source repository, the default supported path is local-first:

- run the FastMCP server directly from `src/mcp/server.ts`
- connect it to an external MCP client over stdio or httpStream
- or run the Net-Runner CLI and configure outbound MCP servers yourself

Some Claude-Code-derived hosted integrations still exist in the codebase, including OAuth-backed connector discovery and `claudeai-proxy` flows. Those are optional hosted dependencies, not required for the local OSS MCP workflow described in this guide.

This guide covers the paths that are actually usable in the current OSS repository:

- **Inbound MCP** — external client to `src/mcp/server.ts`
- **Outbound MCP** — Net-Runner to external MCP servers via `.mcp.json` or `net-runner mcp ...`

It does **not** document hosted assistant-session flows or the unsupported `net-runner server` direct-connect session server path.

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

`nr_exec` now also supports **composite execution inside the existing tool boundary**. Instead of adding more MCP tools, the client can pass a batch of commands through `nr_exec` and receive a summary-first per-command result. Oversized output is offloaded to `.netrunner/artifacts/`, logged into the evidence ledger, and referenced back in the tool result.

This means the MCP server is not a thin demo wrapper around the CLI. It is a real local harness surface with the same engagement state, evidence ledger, artifacts folder, workflow discovery, and intelligence hooks that the CLI runtime uses.

### Prerequisites

```bash
bun install
```

No build step needed — the FastMCP server runs directly from TypeScript source via `bun`.

If you are only exposing Net-Runner as an inbound MCP server, you do not need a separate Net-Runner-hosted login flow just to make the 8-tool harness available. Provider credentials matter when Net-Runner itself is acting as the LLM runtime; the inbound MCP server can be launched directly from source for local red-team usage.

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

### `nr_exec` execution modes

`nr_exec` remains the one workhorse execution tool, but it now has two modes:

- **Single command** — pass `command` for the normal one-shot shell execution path
- **Composite execution** — pass `commands` to run a sequential batch inside the same MCP call

Useful parameters:

| Parameter | Purpose |
|---|---|
| `command` | Execute one shell command |
| `commands` | Execute a batch of shell commands sequentially |
| `timeout_ms` | Per-command timeout |
| `max_lines` | Cap the returned preview lines |
| `summary_only` | Return condensed per-command summaries for batch runs |
| `stop_on_error` | Halt a batch after the first failed command |

Runtime behavior:

- **Artifact offload** — oversized output is written to `.netrunner/artifacts/` and linked in evidence
- **Automatic intelligence hooks** — HTTP-looking output triggers WAF detection; failures trigger retry guidance
- **Context budget tracking** — cumulative returned output is tracked per MCP session and warns when the transcript becomes expensive
- **No tool-surface bloat** — composite execution is implemented inside `nr_exec`, not as extra MCP tools
- **Operator-grade runtime logs** — the MCP server terminal shows command execution, artifact persistence, evidence saves, intelligence triggers, and session-budget snapshots in real time

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

You should now expect to see:

- command start / completion logs for `nr_exec`
- explicit artifact-save and evidence-write logs when output is offloaded
- intelligence logs when WAF/failure/blind-finding middleware triggers
- per-session context-budget snapshots as tool output accumulates

---

## Direction 2: Net-Runner → External MCP Servers (Outbound)

Net-Runner can connect to external MCP servers for additional tools. These tools become available to the LLM and all specialist agents during engagements.

This outbound path is fully usable without first-party hosted Net-Runner services. The hosted-only connector surfaces in the runtime are separate from the `.mcp.json` and CLI-managed server configuration shown below.

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

Net-Runner's LLM can then use tools from any connected MCP servers alongside its built-in pentest tool catalog.

### Both directions simultaneously

You can run Net-Runner in CLI mode (with its own LLM) **and** expose it as an MCP server for another LLM at the same time. These are separate processes — the MCP server is stateless per-request and doesn't conflict with an active CLI session.

---

## What the External LLM Gets

Through 8 MCP tools + its own built-in file/edit tools:

- **Shell execution** (`nr_exec`) — run any of 153 pentest tools (nmap, sqlmap, nuclei, burp, etc.)
- **Engagement lifecycle** (`nr_engagement_init`, `nr_engagement_status`) — initialize and track assessments
- **Guardrails** (`nr_scope_check`) — verify actions are in scope before execution
- **Evidence** (`nr_save_finding`, `nr_save_note`, `nr_list_evidence`) — capture findings and notes
- **Discovery** (`nr_discover`) — explore agents, skills, workflows, and capability readiness data on demand
- **File access** — the LLM reads agent prompts, skill definitions, intelligence state, and evidence files using its own file tools (no MCP duplication needed)

The important part is that the external LLM gets a coherent harness loop, not disconnected point tools:

- initialize scope
- run commands through one workhorse execution surface
- save artifacts and findings into the same project ledger
- query engagement/evidence state when planning the next move
- keep working inside one `.netrunner/` project runtime

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

You stay in your IDE the whole time. Net-Runner handles tool execution, evidence capture, guardrail enforcement, artifact persistence, runtime intelligence, and live MCP-side operator logging.
