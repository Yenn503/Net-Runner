import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerMemorySearchSkill(): void {
  const definition = getNetRunnerSkillDefinition('memory-search')
  if (!definition) throw new Error('Missing Net-Runner skill definition: memory-search')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Grep', 'Glob'],
    argumentHint: '[semantic search query]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Memory Search

Search the local agentmemory server using semantic (BM25 + vector + graph hybrid) search.

Query: ${args || '(ask the user what to search for)'}

## Steps

1. Check agentmemory is running:
   \`\`\`
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3111/agentmemory/livez
   \`\`\`
   If not 200, reply "agentmemory server not running — use file-based memory search instead."

2. POST the search query:
   \`\`\`
   curl -s -X POST http://localhost:3111/agentmemory/smart-search \
     -H "Content-Type: application/json" \
     -d '{"query": "<search terms>", "limit": 5}'
   \`\`\`

3. Parse the JSON response and present the top results with their relevance scores.

4. If the server returns an error, fall back to grepping .md memory files.`,
        },
      ]
    },
  })
}
