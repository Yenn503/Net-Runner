import type { Command } from '../../commands.js'

const engagement = {
  type: 'local',
  name: 'engagement',
  supportsNonInteractive: true,
  description:
    'Manage the Net-Runner engagement envelope, scope boundary, and guardrails',
  argumentHint:
    'init [workflow] [target] | status | capabilities [workflow] | alignment | guard <planned action>',
  load: () => import('./engagement.js'),
} satisfies Command

export default engagement
