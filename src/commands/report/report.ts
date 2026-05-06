import type { LocalCommandCall } from '../../types/command.js'
import { readEngagementManifest } from '../../security/engagement.js'
import { readEvidenceEntries } from '../../security/evidence.js'
import { writeHtmlReport, writeMarkdownReport } from '../../security/reporting.js'
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
  const rawArgs = args.trim().split(/\s+/).filter(Boolean)
  const writeAll = rawArgs.includes('--all')
  const writeHtml = writeAll || rawArgs.includes('--html')
  const nameArg = rawArgs.find(arg => !arg.startsWith('--')) ?? 'latest'
  const markdownFileName = nameArg.endsWith('.md') ? nameArg : `${nameArg.replace(/\.(html?)$/i, '')}.md`
  const htmlFileName = nameArg.endsWith('.html') ? nameArg : `${nameArg.replace(/\.md$/i, '')}.html`

  if (writeHtml && !writeAll) {
    const htmlPath = await writeHtmlReport(cwd, manifest, entries, htmlFileName)
    return {
      type: 'text',
      value: `Generated Net-Runner HTML report at ${htmlPath}`,
    }
  }

  const reportPath = await writeMarkdownReport(
    cwd,
    manifest,
    entries,
    markdownFileName,
  )

  if (writeAll) {
    const htmlPath = await writeHtmlReport(cwd, manifest, entries, htmlFileName)
    return {
      type: 'text',
      value: `Generated Net-Runner reports at ${reportPath} and ${htmlPath}`,
    }
  }

  return {
    type: 'text',
    value: `Generated Net-Runner report at ${reportPath}`,
  }
}

export { call }
