export function getDefaultUdsSocketPath(): string {
  return '/tmp/netrunner-messaging.sock'
}

export async function startUdsMessaging(
  _socketPath: string,
  _options?: { isExplicit?: boolean },
): Promise<void> {}
