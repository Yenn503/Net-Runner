import type { Command } from '../../commands.js'

const mode = {
  type: 'local',
  name: 'mode',
  supportsNonInteractive: true,
  description:
    'Browse Net-Runner workflows by category (CTF / Pentest / Red Team / Blue Team)',
  argumentHint: '[category | workflow-id]',
  load: () => import('./mode.js'),
} satisfies Command

export default mode
