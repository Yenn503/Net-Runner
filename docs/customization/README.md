# Customization

Add your own skills and tools without touching the harness source.

## Skills

Skills are markdown files with YAML frontmatter that the harness auto-discovers from:

- `~/.netrunner/skills/<name>/SKILL.md` (user-global, all projects)
- `<repo>/.netrunner/skills/<name>/SKILL.md` (project-local)

The harness walks both at startup. Restart Net-Runner after dropping a new skill in.

### Curated skill packs

Net-Runner ships 87 curated red-team / forensics playbooks under `.netrunner/skills/<namespace>/`, one namespace per specialist:

| Namespace | Specialist | Covers |
|---|---|---|
| `lead:` | engagement-lead | red-team planning, MITRE mapping, purple-team |
| `recon:` | recon-specialist | OSINT, DNS/subdomain enum, cloud asset inventory, wireless |
| `appsec:` | app-testing-specialist | web (SQLi/XSS/SSRF/XXE/SSTI), API (BOLA/JWT/GraphQL), mobile |
| `infra:` | infra-specialist | AD attacks, lateral movement, privesc, cloud/K8s, malware RE |
| `forensics:` | code-forensics-specialist | memory/disk/network forensics, SAST, secrets, supply chain |
| `reporting:` | evidence-reporting-specialist | CVSS/SSVC/KEV triage, threat-intel reporting |

A nested path becomes a namespaced skill name: `.netrunner/skills/recon/performing-osint-with-spiderfoot/SKILL.md` loads as `recon:performing-osint-with-spiderfoot`. Drop your own folder under any namespace to extend that specialist's pack.

### Scaffold a new skill

```bash
bun run skill:new my-skill --description "Short purpose" --agent recon-specialist
bun run skill:new my-skill --project   # project-local instead of user-global
```

Edits `~/.netrunner/skills/my-skill/SKILL.md` with valid frontmatter and an execution template. Invoke in the harness with `/my-skill`.

Agents you can bind to:

- `engagement-lead`
- `recon-specialist`
- `app-testing-specialist`
- `infra-specialist`
- `code-forensics-specialist`
- `evidence-reporting-specialist`

### Install a skill from a Git repo

```bash
bun run skill:install https://github.com/your/netrunner-skill-something.git
bun run skill:install ./local/path/to/skill --project
bun run skill:install <src> --name override-name
```

Validates that the source has `SKILL.md` with valid `name` + `description` frontmatter. Refuses to overwrite an existing skill — remove it manually first.

### SKILL.md format

```markdown
---
name: my-skill
description: One-line description shown to the LLM at selection time
allowed-tools: ['Bash', 'Read', 'Grep']
---

# my-skill

Body. The LLM reads this as the skill prompt.
```

Frontmatter `allowed-tools` is advisory metadata. `nr_*` MCP tools auto-register; you don't list them here.

## Custom tools

Declare extra CLI tools the harness should install on this host. Format: `~/.netrunner/tools.yaml`.

```yaml
tools:
  - name: bbot
    check: command -v bbot
    install: pipx install bbot
    agents: [recon-specialist]

  - name: katana
    install: go install github.com/projectdiscovery/katana/cmd/katana@latest
    agents: [recon-specialist, app-testing-specialist]

  - name: my-internal-scanner
    check: test -x /opt/my-internal-scanner/bin/scan
    install: bash /opt/setup/install-my-internal-scanner.sh
```

Each entry needs `name` and `install`. `check` defaults to `command -v <name>` if omitted. `agents` is metadata only — surfaced by `nr_discover capabilities`.

Run:

```bash
bun run tools:user        # install user-declared tools only
bun run tools:install     # everything (apt + pipx + go + GitHub releases + user)
bun run tools:check       # report what's missing on this host
```

`install-tools.sh` is idempotent — re-running skips installed entries.

## Where the harness looks at startup

| Source | Path | Scope |
|---|---|---|
| Bundled skills | `dist/cli.mjs` | shipped, can't override |
| User skills | `~/.netrunner/skills/<name>/SKILL.md` | all projects |
| Project skills | `<repo>/.netrunner/skills/<name>/SKILL.md` | this project |
| Tool catalog | hardcoded baseline (~60 tools, `scripts/check-tools.sh`) | shipped |
| User tools | `~/.netrunner/tools.yaml` | this host |

User and project skills override bundled skills with the same name.

## Troubleshooting

**Skill not appearing**
- Check name is kebab-case, 2-64 chars, starts with a letter
- Run `/discover skills` inside the harness to see what was loaded
- Frontmatter must include `name:` and `description:`

**Install script fails on a single tool**
- Re-run with the specific group: `bash scripts/install-tools.sh --pipx-only`
- Or fix the one entry: `pipx install <pkg>` directly

**Tools.yaml not picked up**
- Confirm path: `ls ~/.netrunner/tools.yaml`
- `python3` must be on PATH (the parser uses it)
- Run `bash scripts/install-tools.sh --user-only` for verbose output
