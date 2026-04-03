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
4. Orchestrate specialist agents and tools for each phase.
5. Enforce guardrails before higher-impact actions.
6. Record evidence continuously.
7. Keep project memory available across sessions.
8. Produce report-ready output.

You can run it fully in plain language. Slash commands are optional control tools, not required startup steps.

## Safe Defaults

Auto-initialized engagements start with:
- `authorization: unconfirmed`
- `max impact: read-only`

Then confirm in plain language, for example:

`I confirm authorization for this engagement. Keep impact limited.`

Net-Runner updates engagement state from that instruction and continues with the same runtime flow.

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
- specialist agent memory lives under `.netrunner/memory/agents/` and is reused across sessions
- sub-agent outputs are logged back into the evidence chain

Main outputs:
- `.netrunner/engagement.json`
- `.netrunner/evidence/ledger.jsonl`
- `.netrunner/memory/`
- `.netrunner/reports/*.md`

## Optional Control Commands

Use these only when you want manual control:
- `/engagement status`
- `/engagement capabilities [workflow]`
- `/engagement guard <planned action>`
- `/evidence status|note|finding|artifact|close`
- `/report [file-name]`

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

## License

This repository is for educational use and authorized security testing.
