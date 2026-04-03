import type { Command } from '../../commands.js'

const report = {
  type: 'local',
  name: 'report',
  supportsNonInteractive: true,
  description: 'Generate a markdown report from the current Net-Runner evidence ledger',
  argumentHint: '[file-name]',
  load: () => import('./report.js'),
} satisfies Command

export default report
