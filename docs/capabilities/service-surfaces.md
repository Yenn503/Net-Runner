# Service Surfaces

Net-Runner is primarily a local agentic runtime, but some optional features depend on hosted services.

This document defines the retained service contracts so future updates can replace, self-host, or remove them cleanly.

## Rule

Target state:
- Keep a service-backed feature only if it can run behind Net-Runner-owned configuration.
- If a feature depends on Anthropic-owned infrastructure with no Net-Runner replacement path, remove it instead of leaving a hidden dependency.

Current state:
- The runtime still includes some non-Net-Runner-owned API dependencies. Those exceptions are listed explicitly below and should be treated as migration debt, not completion.

## Hosted Web Workspace

Primary config:

- `NETRUNNER_HOSTED_WEB_ORIGIN`

Current default:

- `https://net-runner.dev`

Used by:

- hosted workspace deep links
- OAuth browser entry
- browser bridge install and reconnect pages
- desktop handoff pages
- billing and usage pages
- privacy controls pages
- legal and update notices

Expected routes:

- `/oauth/authorize`
- `/code`
- `/chrome`
- `/chrome/permissions`
- `/chrome/reconnect`
- `/desktop`
- `/upgrade/max`
- `/settings/privacy-controls`
- `/settings/usage`
- `/settings/billing`
- `/news/terms-updates`
- `/legal/terms`
- `/legal/privacy`

## Hosted Platform

Primary config:

- `NETRUNNER_HOSTED_PLATFORM_ORIGIN`

Current default:

- `https://platform.netrunner.com`

Expected routes:

- `/oauth/authorize`
- `/v1/oauth/token`
- `/api/oauth/netrunner/create_api_key`
- `/api/oauth/netrunner/roles`
- `/oauth/code/callback`
- `/oauth/code/success`
- `/buy_credits`

Used by:

- OAuth token exchange
- API-key creation for hosted login flows
- hosted role lookup
- browser redirect completion after OAuth

## Hosted MCP Proxy

Primary config:

- `NETRUNNER_HOSTED_MCP_PROXY_ORIGIN`

Current default:

- `https://mcp-proxy.netrunner.com`

Expected route:

- `/v1/mcp/{server_id}`

Used by:

- hosted MCP connector proxying for remote or hosted-managed servers

## Browser Bridge

Primary config:

- `NETRUNNER_CHROME_EXTENSION_URL`
- `NETRUNNER_CHROME_RECONNECT_URL`

Current defaults:

- `https://net-runner.dev/chrome`
- `https://net-runner.dev/chrome/reconnect`

Bridge websocket endpoints:

- `wss://bridge.net-runner.dev`
- `wss://bridge.staging.net-runner.dev`
- local dev: `ws://localhost:8765`

Used by:

- Browser Bridge extension install flow
- reconnect flow
- live browser automation bridge

## Hosted API Base

Primary source:

- `getOauthConfig().BASE_API_URL`

Current production default:

- `https://api.anthropic.com`

Override behavior:

- `NETRUNNER_CUSTOM_OAUTH_URL` can repoint OAuth/API, but only to allowlisted bases currently accepted by runtime validation.

Ownership note:

- This is the main remaining non-Net-Runner-owned hosted dependency in the red-team runtime path.

Current consumers include:

- remote session websocket subscribe
- hosted MCP server discovery
- OAuth profile lookup
- remote environment provisioning
- GitHub token import for hosted remote workflows
- remote managed settings
- policy limits

Representative routes still in use:

- `/v1/sessions/ws/{sessionId}/subscribe`
- `/v1/mcp_servers`
- `/api/oauth/profile`
- `/api/claude_cli_profile`
- `/v1/environment_providers/cloud/create`
- `/v1/code/github/import-token`
- `/api/claude_code/settings`
- `/api/claude_code/policy_limits`

## Local-Only Core

These do not require hosted services:

- engagement state under `.netrunner/`
- evidence ledger and reports
- specialist-agent orchestration
- plan/explore/verification built-ins
- skills-first execution
- shell, file, and local web tooling
- local provider connections and OpenAI-compatible providers
- project memory and agent memory
- relevant-memory retrieval (auto memory + `.netrunner/memory/agents/`)
- session-memory summarization for long conversations

## Memory Runtime Toggles

These toggles are local-runtime only and do not depend on hosted APIs:

- `NETRUNNER_DISABLE_RELEVANT_MEMORY_PREFETCH=1` (falls back to `MEMORY.md` index injection)
- `NETRUNNER_ENABLE_RELEVANT_MEMORY_PREFETCH=1`
- `NETRUNNER_DISABLE_SESSION_MEMORY=1`
- `NETRUNNER_ENABLE_SESSION_MEMORY=1`

## Replacement Queue

These areas still need explicit Net-Runner-native replacements or removal:

- GitHub Action installer defaults that still assume Anthropic-owned action repositories
- official marketplace defaults tied to Anthropic-owned plugin repos
- API routes that still carry `claude_code` naming in path segments
- hosted MCP connector naming that still uses `claude.ai` labels internally

Do not add new hosted features without first putting their service contract in this file.
