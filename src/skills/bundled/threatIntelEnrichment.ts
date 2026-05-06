import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerThreatIntelEnrichmentSkill(): void {
  const definition = getNetRunnerSkillDefinition('threat-intel-enrichment')
  if (!definition) throw new Error('Missing Net-Runner skill definition: threat-intel-enrichment')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'TodoWrite', 'WebFetch', 'ListMcpResourcesTool', 'ReadMcpResourceTool'],
    argumentHint: '[observable list: IPs, domains, hashes, URLs — or evidence ledger path]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Threat Intel Enrichment

Enrich observables against TI sources. Do not modify source artifacts. Do not spray paid APIs beyond free-tier limits.

Input:
${args || 'No observable list supplied. Ask the operator for IPs, domains, hashes, or URLs — or point to an evidence ledger path containing iocs.json.'}

Execution:

## 1. Scope and manifest
1. Run \`nr_engagement_status\` and halt if \`nr_scope_check\` returns block.
2. Load observables from operator input or from the evidence ledger: \`.netrunner/artifacts/<engagement>/iocs.json\`.
3. Create evidence directory: \`.netrunner/artifacts/threat-intel/<engagement-slug>/\`.

## 2. Reputation — IPs
\`\`\`
# GreyNoise (binary: greynoise; requires GREYNOISE_API_KEY or uses community API)
greynoise ip <ip>
# Fallback when CLI unavailable:
curl -s -H "key: $GREYNOISE_API_KEY" "https://api.greynoise.io/v3/community/<ip>"

# VirusTotal v3 (binary: vt; requires VT_API_KEY)
vt ip <ip>
# Fallback:
curl -s -H "x-apikey: $VT_API_KEY" "https://www.virustotal.com/api/v3/ip_addresses/<ip>"

# Shodan host lookup (binary: shodan; requires SHODAN_API_KEY)
shodan host <ip>
\`\`\`
Save each response to \`.netrunner/artifacts/threat-intel/<slug>/ip-<ip>.json\`.

## 3. Reputation — Domains
\`\`\`
vt domain <domain>
curl -s -H "x-apikey: $VT_API_KEY" "https://www.virustotal.com/api/v3/domains/<domain>"
shodan search "hostname:<domain>"
censys search "<domain>" --index-type hosts
\`\`\`

## 4. Reputation — File Hashes
\`\`\`
vt file <sha256>
# MalwareBazaar (no key required for hash lookup)
curl -s -X POST "https://mb-api.abuse.ch/api/v1/" -d "query=get_info&hash=<sha256>"
\`\`\`
Save responses to \`.netrunner/artifacts/threat-intel/<slug>/hash-<sha256>.json\`.

## 5. URL Analysis via urlscan.io
\`\`\`
# Submit scan (binary: urlscan, or curl)
urlscan submit <url>
# Fallback submission:
curl -s -X POST "https://urlscan.io/api/v1/scan/" \\
  -H "API-Key: $URLSCAN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"<url>","visibility":"private"}'
# Retrieve result after ~10s: GET https://urlscan.io/api/v1/result/<uuid>/
\`\`\`

## 6. Pivoting — Passive DNS and Infrastructure
\`\`\`
# SecurityTrails (binary: securitytrails or curl with SECURITYTRAILS_API_KEY)
securitytrails domain <domain> subdomains
curl -s -H "apikey: $SECURITYTRAILS_API_KEY" \\
  "https://api.securitytrails.com/v1/domain/<domain>/subdomains"

# CIRCL passive DNS (no key required)
curl -s "https://www.circl.lu/pdns/query/<domain>"

# Shodan search for correlated infrastructure
shodan search "ssl.cert.subject.cn:<domain>"
censys search "parsed.names: <domain>" --index-type certificates
\`\`\`

## 7. Emerging Threat Hunting — Mihari
\`\`\`
# Mihari rule-based hunting (binary: mihari; requires configured sources)
mihari search <query>
mihari artifacts <rule-id>
\`\`\`
Use Mihari to pivot from known-malicious indicators to undiscovered infrastructure sharing the same cert, ASN, or response fingerprint.

## 8. TI Platform Integration

### MISP (no pure single-binary CLI; use pymisp)
\`\`\`
python -c "
from pymisp import PyMISP
m = PyMISP('$MISP_URL', '$MISP_KEY', ssl=False)
results = m.search(value='<ioc>', type_attribute='ip-dst', to_ids=True)
import json; print(json.dumps(results, indent=2))
" > .netrunner/artifacts/threat-intel/<slug>/misp-<ioc>.json
\`\`\`
Search events, attributes, and galaxies. Save matching event IDs, tags, and galaxy clusters to evidence.

### OpenCTI (no standalone binary; use pycti)
\`\`\`
python -c "
from pycti import OpenCTIApiClient
client = OpenCTIApiClient('$OPENCTI_URL', '$OPENCTI_TOKEN')
obs = client.stix_cyber_observable.read(filters={'key':'value','values':['<ioc>']})
import json; print(json.dumps(obs, indent=2))
" > .netrunner/artifacts/threat-intel/<slug>/opencti-<ioc>.json
\`\`\`

## 9. Rate Limits and API Hygiene
- VirusTotal free tier: 4 requests/minute, 500/day. Add \`sleep 15\` between bulk VT calls.
- GreyNoise community: unauthenticated rate-limit is strict; use \`GREYNOISE_API_KEY\` when available.
- urlscan.io free tier: 100 private scans/month. Use \`visibility: private\` for sensitive targets.
- MalwareBazaar: no key required; no aggressive rate limit, but add jitter for bulk lookups.
- Do not send internal or classified IPs/domains to external APIs without operator approval.

## 10. Output
- Write \`.netrunner/artifacts/threat-intel/<slug>/iocs-enriched.json\` with structure:
  \`{ "ioc": "<value>", "type": "ip|domain|hash|url", "reputation": {...}, "attribution": {...}, "sources": [...], "links": [...], "confirmed_malicious": true|false }\`
- Call \`nr_save_finding\` for each confirmed-malicious indicator with ATT&CK technique, confidence, and source.
- Call \`nr_save_note\` with enrichment summary: observables processed, API sources queried, confirmed-malicious count, rate-limit pauses taken, and gaps.

Output summary:
- Scope decision
- Observables processed (count by type)
- API sources queried
- Confirmed-malicious indicators with attribution
- Clean/unknown indicators
- Pivots discovered (new IPs/domains/hashes from enrichment)
- Gaps requiring paid-tier or manual TI platform access`,
        },
      ]
    },
  })
}
