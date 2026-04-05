import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerFeedbackLoopSkill(): void {
  const definition = getNetRunnerSkillDefinition('feedback-loop')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: feedback-loop')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'WebFetch', 'TodoWrite'],
    argumentHint: '[failure context or HTTP response data]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Feedback Loop Engine

Analyze the failure or blocked response and produce structured retry guidance.

Context:
${args || 'No explicit failure context supplied. Check recent tool output and HTTP responses for blocked requests, WAF responses, rate limits, or auth failures.'}

Instructions:
1. Classify the failure reason: WAF block, rate-limit, CAPTCHA, auth required, timeout, IP block, payload filtered, encoding error, server error, or connection failure.
2. Select appropriate adjustment strategies based on the failure type (encoding mutations, delay insertion, header modification, proxy rotation, method switching).
3. Apply payload mutations if the failure suggests content filtering: case-toggle, inline-comment injection, space substitution, concat-break, or encoding changes (double-URL, unicode, hex, base64).
4. Produce a structured retry plan with the mutated payload, recommended headers, delay, and max retry count.
5. Track strategy effectiveness across attempts — prefer strategies with higher historical success rates.

Output:
- Failure classification with confidence
- Selected strategies (ranked by priority)
- Mutated payload (if applicable)
- Retry guidance (delay, headers, encoding)
- Strategy effectiveness stats (if multiple attempts)`,
        },
      ]
    },
  })
}
