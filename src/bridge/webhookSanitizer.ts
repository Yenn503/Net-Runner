import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'

/**
 * OSS-safe webhook sanitizer shim.
 *
 * Internal builds can replace this with richer normalization for provider-
 * specific webhook payloads. The open-source bridge still needs a stable
 * module boundary so inbound message handling can compile and keep the
 * content path explicit.
 */
export function sanitizeInboundWebhookContent(
  content: string | Array<ContentBlockParam>,
): string | Array<ContentBlockParam> {
  return content
}
