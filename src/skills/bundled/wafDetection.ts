import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerWafDetectionSkill(): void {
  const definition = getNetRunnerSkillDefinition('waf-detection')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: waf-detection')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'WebFetch', 'TodoWrite'],
    argumentHint: '[target URL or HTTP response data]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# WAF Detection & Bypass

Fingerprint any Web Application Firewall protecting the target and recommend bypass strategies.

Target:
${args || 'No explicit target supplied. Use the current engagement target and recent HTTP response data.'}

Instructions:
1. Analyze HTTP response headers, body content, cookies, and status codes for WAF signatures.
2. Check for known WAF fingerprints: Cloudflare (CF-Ray, __cfduid), Akamai (AkamaiGHost), Imperva/Incapsula (visid_incap), ModSecurity (Mod_Security), AWS WAF (x-amzn-waf), F5 BIG-IP (BIGipServer), Sucuri, Fortinet, Barracuda, Citrix NetScaler.
3. Score detection confidence based on number and specificity of matching signatures.
4. Map detected WAF to specific bypass techniques sorted by effectiveness:
   - Encoding bypasses (double-URL, unicode, hex, mixed case)
   - Protocol-level bypasses (chunked transfer, HTTP/2, content-type switching)
   - Payload mutation (SQL comment nesting, string concatenation, alternative syntax)
   - Timing-based evasion (request spacing, slow-rate delivery)
5. Produce structured guidance for the engagement-lead to route to appropriate specialists.

Output:
- Detected WAF (name, confidence score)
- Evidence (matching headers, body patterns, cookies)
- Ranked bypass strategies with implementation details
- Recommended next actions`,
        },
      ]
    },
  })
}
