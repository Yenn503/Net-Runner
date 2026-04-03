# Net-Runner

Net-Runner is an agentic red-team assessment framework.

It gives you one inline system:
- natural-language operator control
- specialist agents for each assessment phase
- tool execution (skills, shell, files, web, MCP)
- built-in guardrails
- evidence + reporting
- persistent memory

Use only on targets you are explicitly authorized to test.

## How It Works

When you give Net-Runner a normal prompt like:

`Assess https://target.example and start with recon.`

it runs a single runtime loop:

1. Detect assessment intent and target.
2. Auto-create engagement state in `.netrunner/` (safe defaults first).
3. Inject engagement context into model turns (scope, authorization, impact, restrictions).
4. Let the main runtime use direct tools and, when useful, delegate scoped work to specialist agents.
5. Enforce guardrails before higher-impact actions.
6. Record evidence and execution state continuously.
7. Keep project and auto memory available across sessions.
8. Produce report-ready output.

You can run it in plain language. Slash commands are optional operator controls, not required startup steps, but automatic engagement bootstrap only fires on non-slash prompts that include assessment intent plus a detectable URL, IP, or domain target.

## Safe Defaults

Auto-initialized engagements start with:
- `authorization: unconfirmed`
- `max impact: read-only`

Then confirm in plain language, for example:

`I confirm authorization for this engagement. Keep impact limited.`

Net-Runner updates engagement state from that instruction and continues with the same runtime flow.

If Net-Runner does not auto-initialize or auto-confirm from chat, use `/engagement init [workflow] [target]` and verify with `/engagement status`.

## Quick Start

Install:

```bash
bun install
bun run build
node dist/cli.mjs
```

Then connect your preferred provider/model (OpenAI-compatible or local endpoint supported by runtime config) and start with a normal assessment instruction.

## Specialist Agents

Net-Runner includes dedicated agents for:
- engagement coordination
- recon
- web testing
- API testing
- network testing
- exploitation
- privilege escalation
- lateral movement
- retesting
- evidence quality
- reporting

Agents are wired for orchestration and follow-up task routing. Security agents use persistent project memory.

## Evidence And Memory

Net-Runner keeps assessment continuity through one runtime path:
- engagement state and evidence live under `.netrunner/`
- run-state lives under `.netrunner/run-state.json` (execution steps + pending reviews)
- auto memory is also used by default and lives outside the repo under `~/.netrunner/projects/<repo>/memory/` unless overridden
- specialist agent memory lives under `.netrunner/memory/agents/` and is reused across sessions
- sub-agent outputs are logged back into the evidence chain
- relevant-memory retrieval is on by default and pulls context from auto memory plus engagement agent memory
- session-memory summarization is on by default for long-running conversations
- when you `@agent-...` mention a specialist, retrieval narrows to that agent's memory scope for isolation

Main outputs:
- `.netrunner/engagement.json`
- `.netrunner/run-state.json`
- `.netrunner/evidence/ledger.jsonl`
- `.netrunner/memory/`
- `.netrunner/reports/*.md`

Optional memory toggles:
- disable relevant-memory prefetch and fall back to `MEMORY.md` index injection: `NETRUNNER_DISABLE_RELEVANT_MEMORY_PREFETCH=1`
- force relevant-memory retrieval on: `NETRUNNER_ENABLE_RELEVANT_MEMORY_PREFETCH=1`
- disable session memory: `NETRUNNER_DISABLE_SESSION_MEMORY=1`
- force session memory on: `NETRUNNER_ENABLE_SESSION_MEMORY=1`

Agent runtime toggles:
- force auto-background for delegated agents: `NETRUNNER_AUTO_BACKGROUND_TASKS=1`
- disable built-in agents in SDK/noninteractive usage: `NETRUNNER_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1`

## Optional Control Commands

Use these only when you want manual control:
- `/engagement init [workflow] [target]`
- `/engagement status`
- `/engagement capabilities [workflow]`
- `/engagement alignment`
- `/engagement guard <planned action>`
- `/engagement review`
- `/engagement approve <review-id>`
- `/engagement reject <review-id>`
- `/evidence status|note|finding|artifact|close`
- `/report [file-name]`

## Kali Tooling Coverage

Net-Runner specialists are wired to execute and coordinate common Kali/Linux red-team tooling through `Bash` plus skill/MCP paths.

Capability readiness checks include commands such as:
- `nmap`, `nuclei`, `ffuf`, `nikto`, `sqlmap`, `gobuster`
- `amass`, `subfinder`, `dnsrecon`, `whatweb`
- `hydra`, `john`, `hashcat`, `msfconsole`
- `smbclient`, `impacket-secretsdump`, `tcpdump`, `tshark`

Use `/engagement capabilities [workflow]` to see exactly what is missing on the current host before deep execution.

## Validation

```bash
bun run pipeline:redteam
npm run test:security-slice
bun run validate:redteam-alignment
bun run validate:redteam-agent-tools
bun run smoke:redteam-commands
bun run build
```

## Workflows

- `web-app-testing`
- `api-testing`
- `lab-target-testing`
- `ctf-mode`

## More Docs

- `docs/workflows/overview.md`
- `docs/capabilities/skills-first-architecture.md`
- `docs/capabilities/service-surfaces.md`

## License

This repository is for educational use and authorized security testing.
