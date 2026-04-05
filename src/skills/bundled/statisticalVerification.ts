import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerStatisticalVerificationSkill(): void {
  const definition = getNetRunnerSkillDefinition('statistical-verification')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: statistical-verification')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'WebFetch', 'TodoWrite'],
    argumentHint: '[baseline and payload response data]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Statistical Verification

Confirm or reject a suspected blind injection using formal statistical analysis.

Context:
${args || 'No explicit data supplied. Collect baseline and payload response times or lengths from the current engagement evidence.'}

Instructions:
1. Collect baseline samples: at least 5 requests with benign/no-injection payloads. Record response times (ms) and response body lengths.
2. Collect payload samples: at least 5 requests with the suspected injection payload. Record the same metrics.
3. Run Welch's t-test comparing baseline vs payload distributions for the relevant metric (time for time-based blind, length for boolean-based blind).
4. Use significance level α = 0.05. Report t-statistic, degrees of freedom, p-value, and 95% confidence interval.
5. Classify result: confirmed (p < 0.05 and effect in expected direction), inconclusive (p near threshold), or rejected (p > 0.05).
6. For confirmed findings, estimate the effect size and practical significance.

Output:
- Sample statistics (mean, std dev, n for each group)
- Test results (t-statistic, df, p-value)
- 95% confidence interval for the difference
- Verdict: confirmed / inconclusive / rejected
- Recommended follow-up actions`,
        },
      ]
    },
  })
}
