import { renderNetRunnerSecurityAlignment, validateNetRunnerSecurityAlignment } from '../src/security/alignment.ts'

const report = validateNetRunnerSecurityAlignment()
console.log(renderNetRunnerSecurityAlignment(report))

if (!report.ok) {
  process.exit(1)
}

