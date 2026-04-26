import type { Command } from '../../types/command.js'

const provider = {
  type: 'local-jsx',
  name: 'provider',
  description: 'Manage saved model provider setup',
  load: () => import('./provider.js'),
} satisfies Command

export default provider
