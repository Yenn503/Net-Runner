/**
 * Anthropic-compatible tool schemas reject several JSON Schema keywords that
 * Zod commonly emits, especially string `format` validators like `uri`.
 * Strip those fields recursively before sending tool schemas to providers.
 */
export function stripIncompatibleSchemaKeywords<T>(
  schema: T,
): T {
  if (Array.isArray(schema)) {
    return schema.map(item => stripIncompatibleSchemaKeywords(item)) as T
  }

  if (!schema || typeof schema !== 'object') {
    return schema
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    if (key === '$schema' || key === 'format' || key === 'propertyNames') {
      continue
    }

    result[key] =
      value && typeof value === 'object'
        ? stripIncompatibleSchemaKeywords(value)
        : value
  }

  return result as T
}
