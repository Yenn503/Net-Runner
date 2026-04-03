import type { Command } from '../../commands.js'

export default {
  type: 'local-jsx',
  name: 'usage',
  description: 'Show plan usage limits',
  availability: ['hosted-auth'],
  load: () => import('./usage.js'),
} satisfies Command
