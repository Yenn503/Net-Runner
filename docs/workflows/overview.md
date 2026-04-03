# Net-Runner Workflow Overview

`Net-Runner` is organized around explicit security testing workflows instead of a generic assistant shell.

## Current workflow registry

- `web-app-testing`
  - For route mapping, parameter testing, auth/session validation, and evidence-backed web findings.
- `api-testing`
  - For endpoint discovery, schema-aware validation, state transition testing, and API-specific findings.
- `lab-target-testing`
  - For HTB-style targets, internal labs, and scoped training or research environments.
- `ctf-mode`
  - For challenge-oriented workflows where speed, evidence, and iteration matter more than polished reporting.

## Common execution shape

1. Run `engagement-setup` to lock scope, objective, and impact boundary.
2. Use `/engagement init` to create the workspace-local `.netrunner/` envelope and baseline engagement manifest.
3. Run `scope-guard` before any higher-impact step.
4. Use `recon-plan` to build the phased recon and validation sequence.
5. Delegate to specialist agents only when a self-contained task is clear.
6. Use `evidence-capture` to preserve artifacts and report-ready findings.
7. Use `/report` to export the current evidence ledger into markdown.

## Specialist agents

- `engagement-lead`
  - Coordinates the workflow and keeps execution inside scope.
- `recon-specialist`
  - Focuses on discovery, attack-surface mapping, and validation opportunities.
- `web-testing-specialist`
  - Focuses on HTTP and application behavior with evidence-backed validation.
- `api-testing-specialist`
  - Focuses on endpoint, auth, and state-transition testing for APIs.
- `network-testing-specialist`
  - Focuses on host/service/path validation in scoped infrastructure.
- `exploit-specialist`
  - Focuses on controlled proof-of-impact for confirmed weaknesses.
- `privilege-escalation-specialist`
  - Focuses on privilege-boundary testing in post-access phases.
- `lateral-movement-specialist`
  - Focuses on pivot-path and trust-boundary validation in multi-host targets.
- `retest-specialist`
  - Focuses on remediation verification and false-positive reduction.
- `evidence-specialist`
  - Focuses on artifact quality, traceability, and report-ready evidence.
- `reporting-specialist`
  - Focuses on final finding narratives and export-ready reporting.

## Capability packs

- `recon`
- `web`
- `api`
- `exploitation`
- `privilege-escalation`
- `lateral-movement`
- `exfiltration`
- `network`
- `evidence`
- `reporting`
- `coordination`
- `lab-control`

Before deep execution, run `/engagement capabilities` to verify workflow readiness and missing dependencies.
Run `/engagement alignment` to confirm specialist-agent capability coverage remains coherent across workflows.

Most workflows should rely first on skills plus direct tool execution. `lab-control` and similar integrations are available when the environment benefits from extra infrastructure, but they are not the default expression of framework logic.
