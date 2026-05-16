import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerMemorySaveSkill(): void {
  const definition = getNetRunnerSkillDefinition('memory-save')
  if (!definition) throw new Error('Missing Net-Runner skill definition: memory-save')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Write'],
    argumentHint: '[observation or fact to remember]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Memory Save

Save an observation, fact, or finding to the local agentmemory server.
The server automatically extracts key concepts and indexes for future retrieval.

Content to save: ${args || '(ask the user what to remember)'}

## Steps

1. Check agentmemory is running:
   \`\`\`
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3111/agentmemory/livez
   \`\`\`
   If not 200, reply "agentmemory server not running — save to file-based memory instead."

2. POST the content:
   \`\`\`
   curl -s -X POST http://localhost:3111/agentmemory/remember \
     -H "Content-Type: application/json" \
     -d '{"content": "<observation text>", "category": "observation"}'
   \`\`\`

3. Confirm the response includes an id field.

4. If the server returns an error, fall back to file-based memory:
    a. Write a .md file with YAML frontmatter (name, description, type) to the auto-memory directory.
    b. Add a one-line pointer to MEMORY.md index.
    c. Valid types: user, feedback, project, reference.`,
        },
      ]
    },
  })
}
