import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerCodeAuditReviewSkill(): void {
  const definition = getNetRunnerSkillDefinition('code-audit-review')
  if (!definition) throw new Error('Missing Net-Runner skill definition: code-audit-review')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'TodoWrite', 'Grep', 'Glob', 'WebFetch', 'ListMcpResourcesTool', 'ReadMcpResourceTool'],
    argumentHint: '[repository path or git URL]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Code Audit Review

Multi-tool static audit for source repositories. Do not modify source files. Anchor every finding to file:line.

Input:
${args || 'No repository path or URL supplied. Ask for the authorized repository location first.'}

Execution:

## 1. Scope and manifest
1. Run \`nr_engagement_status\` and halt if \`nr_scope_check\` returns block.
2. Create evidence directory: \`.netrunner/artifacts/code-audit/<repo-slug>/\`.

## 2. Commit pin
- Record the exact commit SHA before any scan: \`git rev-parse HEAD > .netrunner/artifacts/code-audit/<repo-slug>/commit-sha.txt\`
- Save to evidence ledger with timestamp.

## 3. SAST
\`\`\`
semgrep --config auto --sarif -o .netrunner/artifacts/code-audit/<repo-slug>/semgrep.sarif .
\`\`\`
Language-specific supplements (run only if language is present):
\`\`\`
bandit -r . -f sarif -o .netrunner/artifacts/code-audit/<repo-slug>/bandit.sarif          # Python
gosec -fmt sarif -out .netrunner/artifacts/code-audit/<repo-slug>/gosec.sarif ./...       # Go
eslint --format @microsoft/eslint-formatter-sarif -o .netrunner/artifacts/code-audit/<repo-slug>/eslint.sarif .  # JS/TS
\`\`\`

## 4. Secret scanning
\`\`\`
gitleaks detect --report-format sarif --report-path .netrunner/artifacts/code-audit/<repo-slug>/gitleaks.sarif
noseyparker scan --datastore .netrunner/artifacts/code-audit/<repo-slug>/np-ds .
noseyparker report --datastore .netrunner/artifacts/code-audit/<repo-slug>/np-ds > .netrunner/artifacts/code-audit/<repo-slug>/noseyparker.txt
\`\`\`
If a baseline exists: \`gitleaks detect --baseline-path gitleaks-baseline.json --report-format sarif --report-path .netrunner/artifacts/code-audit/<repo-slug>/gitleaks-new.sarif\`

## 5. SBOM and dependency CVE
\`\`\`
syft packages dir:. -o cyclonedx-json > .netrunner/artifacts/code-audit/<repo-slug>/sbom.json
grype sbom:.netrunner/artifacts/code-audit/<repo-slug>/sbom.json -o sarif > .netrunner/artifacts/code-audit/<repo-slug>/grype.sarif
trivy fs --scanners vuln,secret,misconfig --format sarif -o .netrunner/artifacts/code-audit/<repo-slug>/trivy.sarif .
\`\`\`
Container images (when Dockerfile or image reference is present):
\`\`\`
trivy image --format sarif -o .netrunner/artifacts/code-audit/<repo-slug>/trivy-image.sarif <image>
\`\`\`

## 6. Dependency-specific scanners
\`\`\`
npm audit --json > .netrunner/artifacts/code-audit/<repo-slug>/npm-audit.json             # Node
pip-audit -f json -o .netrunner/artifacts/code-audit/<repo-slug>/pip-audit.json           # Python
govulncheck -json ./... > .netrunner/artifacts/code-audit/<repo-slug>/govulncheck.json    # Go
retire --outputformat json --outputpath .netrunner/artifacts/code-audit/<repo-slug>/retire.json  # JS
dependency-check --scan . --format SARIF --out .netrunner/artifacts/code-audit/<repo-slug>/dependency-check.sarif  # Java/.NET
\`\`\`

## 7. IaC misconfiguration
\`\`\`
checkov -d . -o sarif > .netrunner/artifacts/code-audit/<repo-slug>/checkov.sarif
tfsec . --format sarif --out .netrunner/artifacts/code-audit/<repo-slug>/tfsec.sarif
kics scan -p . -o .netrunner/artifacts/code-audit/<repo-slug>/kics-report --report-formats sarif
\`\`\`

## 8. Triage and deduplication
- Deduplicate by rule ID + file path + line number across all SARIF outputs.
- Rank by severity: critical → high → medium → low → informational.
- Suppress findings in test fixtures, vendored dependencies, and generated code (document suppression rationale per finding).
- For injection candidates: trace dataflow from source to sink before promoting to confirmed finding.

## 9. Output
- \`.netrunner/artifacts/code-audit/<repo-slug>/code-audit.sarif\` — merged SARIF output.
- \`.netrunner/artifacts/code-audit/<repo-slug>/findings.json\` — deduplicated findings with file:line, severity, CWE, OWASP category.
- Call \`nr_save_finding\` for each confirmed finding with: file:line anchor, CWE ID, OWASP category, severity, and reproduction steps.
- Call \`nr_save_note\` with scan summary, suppressed findings count, and gaps requiring manual review.

Output summary:
- Commit SHA
- Scope decision
- Tools run and versions
- Finding counts by severity and category
- Confirmed findings with file:line anchors and CWE
- Suppressed findings with rationale
- Gaps requiring manual review`,
        },
      ]
    },
  })
}
