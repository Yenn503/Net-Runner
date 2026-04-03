export const NET_RUNNER_BRAND = {
  productName: 'Net-Runner',
  packageName: 'net-runner',
  primaryCliName: 'net-runner',
  cliAliases: ['net-runner'],
  description:
    'Skill-first, security-first testing framework for agentic operator workflows',
  docsUrl: 'https://net-runner.dev/docs/security-testing',
  startupDescription:
    'starts an interactive session by default. Use -p/--print for non-interactive output.',
} as const

export function getPrimaryCliName(): string {
  return NET_RUNNER_BRAND.primaryCliName
}

export function getSupportedCliAliases(): string[] {
  return [...NET_RUNNER_BRAND.cliAliases]
}

export function getProductDisplayName(): string {
  return NET_RUNNER_BRAND.productName
}

export function getStartupDescription(): string {
  return NET_RUNNER_BRAND.startupDescription
}
