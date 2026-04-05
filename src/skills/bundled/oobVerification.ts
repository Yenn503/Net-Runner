import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerOobVerificationSkill(): void {
  const definition = getNetRunnerSkillDefinition('oob-verification')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: oob-verification')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'WebFetch', 'TodoWrite'],
    argumentHint: '[blind vulnerability type and target parameter]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Out-of-Band Verification

Generate OOB callback payloads and track verification status for blind vulnerabilities.

Context:
${args || 'No explicit vulnerability context supplied. Check engagement evidence for suspected blind injection points (XXE, SSRF, RCE, SQLi, Log4Shell).'}

Instructions:
1. Identify the blind vulnerability type: blind-xxe, blind-ssrf, blind-rce, blind-sqli, blind-xss, blind-ssti, log4shell, or blind-deserialization.
2. Generate unique callback payloads for the appropriate OOB channel (DNS or HTTP):
   - Blind XXE: XML entity payloads with HTTP/DNS callbacks
   - Blind SSRF: Direct URL, DNS, URL-encoded, and redirect payloads
   - Blind RCE: curl, wget, nslookup, ping, and PowerShell callbacks
   - Blind SQLi: Database-specific DNS exfiltration (MySQL LOAD_FILE, MSSQL xp_dirtree, Oracle UTL_HTTP, PostgreSQL COPY)
   - Log4Shell: JNDI lookup variants with obfuscation
3. Inject each payload into the target parameter and monitor the OOB callback server.
4. Track verification status: pending, confirmed (callback received), or timeout.
5. For confirmed callbacks, capture evidence including source IP, timestamp, and request details.

Output:
- Generated payloads with descriptions
- Callback endpoint to monitor
- Injection instructions per payload
- Verification status tracking
- Evidence capture for confirmed callbacks`,
        },
      ]
    },
  })
}
