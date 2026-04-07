export type ParsedConnectUrl = {
  serverUrl: string
  authToken?: string
}

function getAuthToken(url: URL): string | undefined {
  const token =
    url.searchParams.get('token') ??
    url.searchParams.get('authToken') ??
    url.searchParams.get('auth_token')

  return token?.trim() || undefined
}

export function parseConnectUrl(ccUrl: string): ParsedConnectUrl {
  if (ccUrl.startsWith('cc+unix://')) {
    throw new Error('cc+unix URLs are not supported in this OSS build.')
  }

  if (!ccUrl.startsWith('cc://')) {
    throw new Error('Expected a cc:// URL.')
  }

  const url = new URL(ccUrl)

  if (!url.hostname) {
    throw new Error('cc:// URL is missing a host.')
  }

  const serverUrl = `http://${url.hostname}${url.port ? `:${url.port}` : ''}`

  return {
    serverUrl,
    authToken: getAuthToken(url),
  }
}
