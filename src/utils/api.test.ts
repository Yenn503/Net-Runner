import { expect, test } from 'bun:test'
import { z } from 'zod/v4'
import { getEmptyToolPermissionContext, type Tool, type Tools } from '../Tool.js'
import { toolToAPISchema } from './api.js'

test('toolToAPISchema strips incompatible schema keywords from input_schema', async () => {
  const schema = await toolToAPISchema(
    {
      name: 'WebFetch',
      inputSchema: z.strictObject({}),
      inputJSONSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            format: 'uri',
            description: 'Public HTTP or HTTPS URL',
          },
          metadata: {
            type: 'object',
            properties: {
              callback: {
                type: 'string',
                format: 'uri-reference',
              },
            },
          },
        },
      },
      prompt: async () => 'Fetch a URL',
    } as unknown as Tool,
    {
      getToolPermissionContext: async () => getEmptyToolPermissionContext(),
      tools: [] as unknown as Tools,
      agents: [],
    },
  )

  expect(schema).toMatchObject({
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Public HTTP or HTTPS URL',
        },
        metadata: {
          type: 'object',
          properties: {
            callback: {
              type: 'string',
            },
          },
        },
      },
    },
  })

  const inputSchema = (schema as { input_schema: Record<string, unknown> }).input_schema
  const properties = inputSchema.properties as Record<string, Record<string, unknown>>
  expect(properties.url?.format).toBeUndefined()
  expect(
    (
      properties.metadata?.properties as Record<string, Record<string, unknown>>
    )?.callback?.format,
  ).toBeUndefined()
})
