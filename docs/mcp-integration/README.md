# MCP Integration

Net-Runner runs a **FastMCP server** (`src/mcp/server.ts`) exposing 16 `nr_*` tools per [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp), and also acts as an MCP **client** for outbound servers.

Two paths:

- **Inbound** — external LLM → Net-Runner (uses the 16 tools)
- **Outbound** — Net-Runner → external MCP servers (via `.mcp.json` or `net-runner mcp …`)

Run inbound via `bun run src/mcp/server.ts --stdio` or `bun run mcp:server` (httpStream on `:8745`).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    External LLM                         │
│  (Copilot · Claude Code · Cursor · Windsurf · …)       │
│                                                         │
│  Speaks MCP ──► calls 16 nr_* tools                     │
│  Uses own file tools for reading code / state / docs   │
└────────────────────────┬────────────────────────────────┘
                         │ stdio or httpStream
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Net-Runner FastMCP Server                   │
│                                                         │
│  16 tools (nr_* prefix):                               │
│  • nr_exec          — shell execution (228 tools)       │
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

- **Inbound** — an external LLM connects TO Net-Runner and uses its 16 tools
- **Outbound** — Net-Runner connects TO external MCP servers for additional capabilities

---

## Direction 1: External LLM → Net-Runner (Inbound)

The external LLM treats Net-Runner as an MCP tool server with 16 `nr_*` tools. `nr_exec` is the workhorse — all 228 catalogued pentest tools run through it. The LLM uses its own built-in file tools for reading code, docs, and state files.

`nr_exec` supports composite execution: pass a batch of commands and get a summary-first per-command result. Oversized output spills to `.netrunner/artifacts/` and is logged to the evidence ledger.

The server shares engagement state, evidence ledger, artifacts folder, workflow discovery, and intelligence hooks with the CLI runtime — same scope envelope and impact-boundary enforcement.

### Prerequisites

```bash
bun install
```

Inbound MCP runs directly from TypeScript via `bun` — no build step, no provider credentials needed (those matter only when Net-Runner is the LLM runtime).

### Tool surface (16 tools)

| Tool | Purpose |
|---|---|
| `nr_exec` | **Shell execution — the workhorse.** All 228 catalogued pentest tools and harness commands such as Maigret run here. |
| `nr_engagement_init` | Initialize `.netrunner/` engagement with workflow, targets, scope |
| `nr_engagement_status` | Get engagement manifest, evidence counts, run state |
| `nr_scope_check` | Guardrail check — allow/review/block before risky actions |
| `nr_save_finding` | Record unvalidated finding with severity, source, replay data, CWE |
| `nr_save_note` | Append note to evidence ledger |
| `nr_list_evidence` | Query evidence entries with optional type filter |
| `nr_discover` | Progressive disclosure — list agents, skills, workflows, or capabilities on demand |
| `nr_tool_help` | Cached `--help` text per catalog tool to reduce flag hallucination |
| `nr_tool_install` | Check or install missing engagement tools through the controlled installer wrapper |
| `nr_kg_query` | Lookup prior evidence about a target in the engagement Knowledge Graph |
| `nr_verify_evidence` | Verify SHA-256 hash chain integrity of the evidence ledger |
| `nr_validate_finding` | Replay-based finding validation with diff and verdict |
| `nr_coverage_status` | MITRE ATT&CK coverage from replay-validated findings |
| `nr_export_report` | Export reports to Markdown, HTML, SARIF 2.1.0, STIX 2.1, or MISP |
| `nr_arsenal_lookup` | Query the curated exploit arsenal by product/version/CVE before fresh CVE research |

The CLI runtime exposes the same arsenal behavior through the native
`ArsenalLookup` tool. Both wrappers call the shared `src/security/arsenal.ts`
loader, matcher, sorter, and renderer so LLM output is consistent across CLI
and FastMCP.

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

Example Maigret digital-footprint run through the same harness surface:

```json
{
  "commands": [
    "command -v maigret && maigret --version",
    "mkdir -p .netrunner/artifacts/digital-footprint/exampleuser",
    "maigret exampleuser --json .netrunner/artifacts/digital-footprint/exampleuser/maigret.json --html .netrunner/artifacts/digital-footprint/exampleuser/maigret.html --txt .netrunner/artifacts/digital-footprint/exampleuser/maigret.txt"
  ],
  "summary_only": true,
  "stop_on_error": true
}
```

If `maigret` is missing, call `nr_tool_install` with `mode=check` first, then use `mode=user` with `confirm=true` when it is declared in `~/.netrunner/tools.yaml` (or install it manually with `python3 -m pip install --user maigret`). The `/digital-footprint-assessment` skill uses this same command path and writes artifacts under `.netrunner/artifacts/digital-footprint/`.

### Engagement-time tool installation

`nr_tool_install` wraps `scripts/install-tools.sh` so external MCP clients do not need to invent privileged shell commands.

Modes:

| Mode | Behaviour |
|---|---|
| `check` | Runs the missing-tool report only; no confirmation needed |
| `all` | Installs apt, pipx, Go, GitHub-release, and user-declared tools |
| `apt` / `pipx` / `go` / `gh` / `user` | Installs only that group |

Install modes require `confirm=true` because they can modify the operator machine. With `environment=auto`, Windows hosts use the `kali-linux` WSL distribution and Linux/macOS hosts use local bash. Use `environment=host` or `environment=wsl-kali` to force the target.

### Report exports

Use `nr_export_report` after findings and artifacts exist in the evidence ledger:

```json
{ "format": "html", "output_path": "executive-report.html" }
```

Supported formats:

- `markdown` — editable canonical report source
- `html` — designed human-readable red-team report
- `sarif` — scanner/security-platform ingestion
- `stix` — threat-intel exchange
- `misp` — MISP event JSON

Human and machine exports carry evidence status. New findings are `Unvalidated` until `nr_validate_finding` or another typed validation entry records replay, statistical, OOB, or artifact-review proof. Chat wording does not turn a suspected finding into a validated report claim.

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

The terminal shows a sunset gradient banner, all 16 registered tools, and live activity logs with session IDs, durations, and result sizes.

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

## Security Notes

- MCP server runs with `isNonInteractiveSession: true` — no in-chat confirmation prompts
- Permission system, scope guardrails, and evidence ledger remain active
- Set model-provider env vars before starting if Net-Runner itself is acting as runtime

## Typical Workflow

1. Configure MCP in your client (see configs above)
2. From the client's chat: `"Initialize engagement for 10.10.10.1 with web-app-testing"` → `nr_engagement_init`
3. `"Run nmap"` → `nr_exec` → results
4. `"Save open ports as a finding"` → `nr_save_finding`
5. `"Run nuclei against the web ports"` → `nr_exec` → findings captured

You stay in your IDE; Net-Runner handles execution, evidence capture, guardrails, artifacts.
