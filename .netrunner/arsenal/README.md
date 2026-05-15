# Exploit Arsenal

Curated, provenance-tracked exploit intelligence for the Net-Runner exploit
specialists (`infra-specialist`, `app-testing-specialist`).

## Design principles

- **Arsenal metadata is separate from exploit execution.** This directory
  holds *intelligence* — what exists, how reliable it is, what it affects.
  Running an exploit goes through an **execution adapter** (`metasploit`,
  `nuclei`, `searchsploit`, `manual`, `custom-script`) named in the entry's
  `execution_adapter` field. The arsenal never ships exploit binaries.
- **Agents do not blindly trust public PoCs.** Every entry records its
  `source` and `references` (provenance) and a `reliability` score. A GitHub
  PoC starts at `unverified` until the harness validates it.
- **Validation is tracked, not assumed.** `validation_status` moves from
  `unvalidated` only when a typed validation entry backs it.

## Layout

- `index/*.yaml` — **committed, curated.** Known exploits grouped by surface
  (windows, linux, web-and-appliance, active-directory). Read before
  exploitation to match a fingerprinted target to a known exploit.
- `discovered.jsonl` — **runtime, gitignored.** One JSON object per line —
  exploits/CVEs the harness validates during engagements, so a working
  exploit is reusable across future engagements.

## Live intelligence sources

The arsenal `index/` is a curated *cache*. Fresh lookups query upstream:

- **CISA KEV** — `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` (actively-exploited catalog, JSON feed).
- **NVD** — `https://services.nvd.nist.gov/rest/json/cves/2.0` (CVE detail/CVSS API).
- **Exploit-DB** — `searchsploit` CLI (offline mirror, ships with Kali).
- **Nuclei templates** — `nuclei -update-templates` (CVE detection templates).
- **PoC-in-GitHub** — `https://github.com/nomi-sec/PoC-in-GitHub` (CVE → PoC repo index; treat every hit as `unverified`).

Pulling from these is the recon/exploit specialist's job via skills + `nr_exec`;
validated results get promoted into `index/` by the operator.

## index entry schema

```yaml
exploits:
  - id: short-slug                  # unique within the file
    cve: CVE-YYYY-NNNNN | none       # 'none' for un-assigned community PoCs
    name: Human-readable name
    exploit_type: rce | privilege-escalation | auth-bypass | defense-evasion |
                  credential-access | info-disclosure | dos | lateral-movement
    affected_versions: Precise product + version range to fingerprint against
    references:                      # provenance — advisories, write-ups
      - https://...
    source: https://...              # primary exploit repo / PoC origin
    reliability: high | medium | low | unverified
    validation_status: unvalidated | validated-lab | validated-target | failed
    prerequisites: Access level, auth, position required before this works
    execution_environment: kali-operator | windows-operator | linux-target |
                           windows-target | network | vm-isolated
    detection_notes: What defenders see — EDR/AV/log signal this generates
    execution_adapter: metasploit | nuclei | searchsploit | manual |
                       custom-script | mcp-tool
    operator_notes: Caveats, OPSEC, cleanup. Validate before use.
```

## discovered.jsonl entry schema

```json
{"ts":"2026-05-15T12:00:00Z","engagement":"name","target":"host/url","cve":"CVE-... | none","name":"...","exploit_type":"rce","reliability":"high","validation_status":"validated-target","execution_adapter":"metasploit","evidence":".netrunner/findings/<id>.json","operator_notes":"..."}
```

## Discipline

- Arsenal entries are **leads, not guarantees** — every exploit is validated
  against the live target under scope before it counts as a finding.
- Append to `discovered.jsonl` only after a typed validation entry exists.
- Authorized engagements only. The scope guardrail gates every action.
