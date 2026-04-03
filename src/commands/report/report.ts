import type { LocalCommandCall } from '../../types/command.js'
import { readEngagementManifest } from '../../security/engagement.js'
import { readEvidenceEntries } from '../../security/evidence.js'
import { writeMarkdownReport } from '../../security/reporting.js'
import { getCwd } from '../../utils/cwd.js'

const call: LocalCommandCall = async args => {
  const cwd = getCwd()
  const manifest = await readEngagementManifest(cwd)
  if (!manifest) {
    return {
      type: 'text',
      value:
        'No Net-Runner engagement found in this workspace. Run `/engagement init` first.',
    }
  }

  const entries = await readEvidenceEntries(cwd)
  const fileName = args.trim() || 'latest.md'
  const normalizedFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`
  const reportPath = await writeMarkdownReport(
    cwd,
    manifest,
    entries,
    normalizedFileName,
  )

  return {
    type: 'text',
    value: `Generated Net-Runner report at ${reportPath}`,
  }
}

export { call }
