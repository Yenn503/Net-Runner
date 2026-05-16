import { feature } from 'bun:bundle'
import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBatchSkill } from './batch.js'
import { registerAttackPathAnalysisSkill } from './attackPathAnalysis.js'
import { registerDebugSkill } from './debug.js'
import { registerEngagementSetupSkill } from './engagementSetup.js'
import { registerEvidenceCaptureSkill } from './evidenceCapture.js'
import { registerExploitValidationSkill } from './exploitValidation.js'
import { registerKeybindingsSkill } from './keybindings.js'
import { registerLoremIpsumSkill } from './loremIpsum.js'
import { registerPostExploitationPlanSkill } from './postExploitationPlan.js'
import { registerReconPlanSkill } from './reconPlan.js'
import { registerRememberSkill } from './remember.js'
import { registerReportGenerationSkill } from './reportGeneration.js'
import { registerSimplifySkill } from './simplify.js'
import { registerScopeGuardSkill } from './scopeGuard.js'
import { registerSkillifySkill } from './skillify.js'
import { registerStuckSkill } from './stuck.js'
import { registerTargetFingerprintingSkill } from './targetFingerprinting.js'
import { registerUpdateConfigSkill } from './updateConfig.js'
import { registerVerifySkill } from './verify.js'
import { registerVulnAssessmentSkill } from './vulnAssessment.js'
import { registerAptSimulationSkill } from './aptSimulation.js'
import { registerFeedbackLoopSkill } from './feedbackLoop.js'
import { registerStatisticalVerificationSkill } from './statisticalVerification.js'
import { registerWafDetectionSkill } from './wafDetection.js'
import { registerMctsPlanningSkill } from './mctsPlanning.js'
import { registerOobVerificationSkill } from './oobVerification.js'
import { registerBundledSkill } from '../bundledSkills.js'
import { registerDfirTriageSkill } from './dfirTriage.js'
import { registerCodeAuditReviewSkill } from './codeAuditReview.js'
import { registerThreatIntelEnrichmentSkill } from './threatIntelEnrichment.js'
import { registerWifiAssessmentSkill } from './wifiAssessment.js'
import { registerMobileAppTestingSkill } from './mobileAppTesting.js'
import { registerBinaryExploitationSkill } from './binaryExploitation.js'
import { registerMemorySearchSkill } from './memorySearch.js'
import { registerMemorySaveSkill } from './memorySave.js'

function registerDigitalFootprintAssessmentSkill(): void {
  const definition = getNetRunnerSkillDefinition('digital-footprint-assessment')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: digital-footprint-assessment')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Grep', 'Glob', 'TodoWrite'],
    argumentHint: '[authorized username/profile/email-derived handle]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Digital Footprint Assessment

Run a scoped Maigret-backed username and profile OSINT assessment. Do not simulate results.

Target identity input:
${args || 'No explicit identity input supplied. Ask for the authorized username, profile URL, or handle set before running.'}

Execution:
1. Engagement manifest pre-validates scope; halt only if \`nr_scope_check\` returns review/block.
2. Check tool readiness with \`command -v maigret && maigret --version\`.
3. If missing, stop and report exact install path: \`python3 -m pip install --user maigret\`. Do not invent findings.
4. Create an evidence directory under \`.netrunner/artifacts/digital-footprint/<target-slug>\`.
5. Run Maigret with machine-readable and human-readable outputs:
   - \`maigret <username> --json <dir>/maigret.json --html <dir>/maigret.html --txt <dir>/maigret.txt\`
   - For wider authorized assessment, use \`--permute\`, \`--parse <profile-url>\`, \`--tags <tag-list>\`, or \`-a\` only when scope and time budget allow.
6. Parse Maigret JSON/TXT results. Correlate accounts by confidence, platform category, profile metadata, reused links, avatars, aliases, and discovered IDs.
7. Route concrete web/API/network hypotheses to specialists; route raw artifacts to evidence specialist.

Output discipline: artifacts live in the evidence directory above. Save confirmed accounts via nr_save_finding, correlated identifiers via nr_save_note. Reply one line: scope decision, accounts confirmed/possible counts, next specialist.`,
        },
      ]
    },
  })
}

function registerIdentityCorrelationSkill(): void {
  const definition = getNetRunnerSkillDefinition('identity-correlation')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: identity-correlation')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Grep', 'Glob', 'TodoWrite', 'WebSearch', 'WebFetch'],
    argumentHint: '[authorized company LinkedIn URL, target domain, or employee identity set]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Identity Correlation

Run a real identity-correlation workflow. Do not simulate staff, usernames, emails, or accounts.

Target input:
${args || 'No explicit company URL, target domain, or staff identity set supplied. Ask for the authorized target first.'}

Execution:
1. Engagement manifest pre-validates scope; halt only if \`nr_scope_check\` returns review/block.
2. Create an evidence directory under \`.netrunner/artifacts/identity-correlation/<target-slug>\`.
3. Check tool readiness:
   - \`command -v python3\`
   - \`command -v maigret && maigret --version\`
   - \`command -v holehe && holehe --version\`
   - \`command -v ghunt && ghunt --help\`
4. For LinkedInDumper, require a valid LinkedIn company URL and either \`$LINKEDIN_COOKIE_LI_AT\` or an operator-supplied cookie. Do not proceed with LinkedIn scraping without explicit authorization and credentials.
5. If LinkedInDumper repo/script is available, run it with jitter and evidence outputs, for example:
   - \`python3 <LinkedInDumper-repo>/linkedindumper.py --url <linkedin-company-url> --cookie \"$LINKEDIN_COOKIE_LI_AT\" --jitter --output-json <dir>/linkedin.json --output-csv <dir>/linkedin.csv\`
6. Build identity pivots from confirmed names, titles, profile URLs, and known username/email patterns.
7. Cross-reference with existing recon tools:
   - Maigret for username/profile reuse
   - Holehe for email-to-service mappings
   - GHunt for authorized Google account exposure checks
   - Haklistgen only when a target-derived wordlist would materially improve downstream testing
8. Save correlated entities as \`identity-correlation.json\` with confidence, source artifacts, and false-positive notes.
9. Route concrete auth, phishing, web, API, or AD hypotheses to relevant specialists; route raw artifacts to evidence specialist.

Output discipline: artifacts live in the evidence directory above. Save correlated identities via nr_save_finding (people / handles / emails) and nr_save_note (candidate patterns). Reply one line: people confirmed, handoff target.`,
        },
      ]
    },
  })
}

function registerC2InfrastructureSkill(): void {
  const definition = getNetRunnerSkillDefinition('c2-infrastructure')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: c2-infrastructure')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'TodoWrite', 'WebFetch', 'ListMcpResourcesTool', 'ReadMcpResourceTool'],
    argumentHint: '[authorized adversary-emulation operation name, domain, and C2 stack]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# C2 Infrastructure

Run a real adversary-emulation C2 infrastructure planning and validation flow. Do not simulate operators, listeners, implants, or callbacks.

Input:
${args || 'No explicit operation, domain, or C2 stack supplied. Ask for the authorized adversary-emulation target, approved domains, and selected stack first.'}

Execution:
1. Engagement manifest pre-validates scope; halt only if \`nr_scope_check\` returns review/block.
2. Create an evidence directory under \`.netrunner/artifacts/c2-infrastructure/<operation-slug>\`.
3. Check readiness for supported stacks:
   - \`command -v sliver-client\`
   - \`command -v mythic-cli\`
4. For Sliver, prefer documented secure transports and operator-managed listeners: mTLS, WireGuard, HTTP(S), or DNS. Record chosen transport and why.
5. For Mythic, record operation name, operator role model, selected payload type, selected C2 profile, callback host, callback port, and whether SSL is enabled.
6. Plan redirectors and exposure controls before generating payloads:
   - approved domain list
   - TLS certificate source
   - redirector host and upstream team server mapping
   - decoy content / failure behavior
7. Log operator roles and visibility: operator, lead, spectator when using Mythic-style operations.
8. Write explicit teardown steps: listener stop, payload cleanup, redirector removal, log export, artifact hashing.

Output discipline: persist the C2 plan via nr_save_note (category=c2-infra) covering stack, transports, redirectors, operator roles, teardown checkpoints. No markdown plan documents. Reply one line: stack, callback host, teardown ready y/n.`,
        },
      ]
    },
  })
}

function registerC2OperationsSkill(): void {
  const definition = getNetRunnerSkillDefinition('c2-operations')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: c2-operations')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'TodoWrite', 'WebFetch', 'Agent', 'SendMessage', 'ListMcpResourcesTool', 'ReadMcpResourceTool'],
    argumentHint: '[authorized operation, payload type, and callback transport]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# C2 Operations

Run a real guarded C2 operations workflow. Do not simulate payload generation, callback handling, or operator tasking.

Input:
${args || 'No explicit operation, payload, or callback transport supplied. Ask for the authorized operation and selected stack first.'}

Execution:
1. Verify the engagement is authorized for active adversary-emulation execution before touching listeners or payloads.
2. Record operation name, operator identity, team server, redirector, callback host, callback port, and protocol.
3. Sliver-specific path:
   - record whether transport is mTLS, WireGuard, HTTP(S), or DNS
   - record whether payload is staged or stageless
   - capture payload generation command and listener configuration to artifacts
4. Mythic-specific path:
   - record operation name and operators
   - record selected payload type and C2 profile
   - record callback host, callback port, and SSL setting
5. Capture lifecycle evidence for every critical step:
   - payload generation metadata
   - listener start/stop commands
   - callback registrations
   - pivot or socks enablement
   - teardown actions
6. Route post-callback host actions to exploit, privilege-escalation, lateral-movement, evidence, and reporting specialists rather than keeping them in one monolithic C2 thread.
7. If operator privileges, domains, transports, or teardown are not explicit, stop and ask rather than drifting.

Output discipline: every lifecycle event (payload, listener, callback, pivot, teardown) saved via nr_save_note with timestamp + command + result. Findings (confirmed access, lateral hop, exfil path) saved via nr_save_finding. Reply one line: callbacks, pivots, teardown status.`,
        },
      ]
    },
  })
}

function registerHeadlessBrowserValidationSkill(): void {
  const definition = getNetRunnerSkillDefinition('headless-browser-validation')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: headless-browser-validation')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'WebFetch', 'TodoWrite', 'Grep'],
    argumentHint: '[authorized URL or finding to validate in a real browser]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Headless Browser Validation

Validate findings inside a real rendering engine. Do not fabricate DOM behaviour.

Input:
${args || 'No explicit URL or finding supplied. Ask for the authorized target URL and the candidate finding to validate.'}

Execution:
1. Engagement manifest pre-validates scope; halt only if \`nr_scope_check\` returns review/block.
2. Create an evidence directory under \`.netrunner/artifacts/headless-browser/<target-slug>\`.
3. Detect a usable browser engine, in this order:
   - Camofox stealth-browser REST API at \`\${CAMOFOX_URL:-http://localhost:9377}\` (Firefox patched at C++ level for anti-bot bypass). Upstream: https://github.com/jo-inc/camofox-browser
     - Health: \`curl -s "$CAMOFOX_URL/health"\`
     - Open tab: \`curl -s -X POST "$CAMOFOX_URL/tabs" -H 'content-type: application/json' -d '{"userId":"netrunner","sessionKey":"<engagement>","url":"<target-url>"}'\`
     - Snapshot: \`curl -s "$CAMOFOX_URL/tabs/<tabId>/snapshot?userId=netrunner"\`
     - Click: \`curl -s -X POST "$CAMOFOX_URL/tabs/<tabId>/click" -H 'content-type: application/json' -d '{"userId":"netrunner","ref":"e1"}'\`
     - Type: \`curl -s -X POST "$CAMOFOX_URL/tabs/<tabId>/type" -H 'content-type: application/json' -d '{"userId":"netrunner","ref":"e2","text":"<payload>","pressEnter":true}'\`
     - Close: \`curl -s -X DELETE "$CAMOFOX_URL/tabs/<tabId>?userId=netrunner"\`
   - Local Playwright via Node: \`npx playwright install --with-deps chromium\`, then a small Node script that opens the URL, waits for network idle, captures DOM and screenshots into the evidence directory.
   - Headless Chromium fallback: \`google-chrome --headless --disable-gpu --dump-dom --screenshot=<dir>/screenshot.png <url>\`.
4. For DOM XSS validation:
   - Inject the candidate payload into the parameter under test through query, fragment, or form field.
   - In the rendering engine, capture: rendered HTML, console logs/errors, dialogs (alerts), network requests, and any cookie/storage writes.
   - Save raw evidence (HTML, screenshot, har/log) to the evidence directory.
   - Mark a confirmed positive only when the payload's effect is observable in the DOM/runtime, not just in source.
5. For SPA route discovery:
   - Use snapshot + Get Links to walk authorized routes and capture client-only endpoints.
6. Respect rate limits and engagement scope. Close all tabs/sessions on completion.

Output discipline: rendered evidence (HTML, screenshots, har/log) saved under the evidence directory. DOM-confirmed positives go through nr_save_finding with status=Validated and mode=headless-browser-replay. Reply one line: engine, dom-confirmed count, candidates count.`,
        },
      ]
    },
  })
}

function registerBugBountyValidationSkill(): void {
  const definition = getNetRunnerSkillDefinition('bug-bounty-validation')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: bug-bounty-validation')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Grep', 'TodoWrite', 'WebFetch', 'WebSearch'],
    argumentHint: '[authorized program scope or root domain]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Bug Bounty Validation Pipeline

Run a real bug-bounty validation pipeline. Do not invent findings, hosts, or payloads.

Input:
${args || 'No explicit program scope supplied. Ask for the authorized program scope, root domain(s), and any out-of-scope rules first.'}

Execution:
1. Engagement manifest pre-validates scope; halt only if \`nr_scope_check\` returns review/block.
2. Create an evidence directory under \`.netrunner/artifacts/bug-bounty/<program-slug>\`.
3. Recon expansion (fast, low-noise):
   - \`subfinder -d <root> -all -silent | tee <dir>/subdomains.txt\`
   - \`echo <root> | gau --subs | tee <dir>/historical-urls.txt\`
   - \`cat <dir>/subdomains.txt | httpx -silent -title -status-code -tech-detect -json -o <dir>/httpx.json\`
   - \`katana -list <dir>/subdomains.txt -d 3 -jc -kf all -silent -o <dir>/katana.txt\`  # -jc parses JavaScript, -kf all crawls known files (sitemap, robots, etc.)
4. Parameter and reflection mining:
   - \`cat <dir>/historical-urls.txt | uro | grep '=' > <dir>/with-params.txt\`
   - \`arjun -i <dir>/with-params.txt -oJ <dir>/arjun.json\` (only on in-scope hosts)
   - \`cat <dir>/with-params.txt | qsreplace '"><svg/onload=alert(1)>' > <dir>/xss-candidates.txt\`
5. XSS candidate triage:
   - \`dalfox file <dir>/xss-candidates.txt --skip-bav --skip-mining-all -o <dir>/dalfox.json\`
6. Real validation in a rendering engine using the headless-browser-validation skill, not just HTTP scrapes. Confirm DOM execution before reporting.
7. OOB validation for blind classes (SSRF, blind XSS, blind RCE, log4shell, JNDI):
   - \`interactsh-client -json -o <dir>/interactsh.json\` and reference its issued domain in payloads.
   - Cross-check with the oob-verification skill before declaring positives.
8. Triage with evidence:
   - Save raw HTTP exchanges, screenshots, DOM dumps, and OOB hits.
   - Tag confidence per finding: dom-confirmed, oob-confirmed, candidate-only, suspected-fp.
9. Route confirmed findings to web/api/exploit/evidence/reporting specialists. Drop candidate-only findings into a follow-up queue, do not promote them.

Output discipline: recon artifacts saved under the evidence directory. Confirmed findings (dom-confirmed, oob-confirmed) go through nr_save_finding tagged with confidence. Candidate-only and suspected-fp stay as nr_save_note. Reply one line: subs, live hosts, confirmed findings, follow-up queue size.`,
        },
      ]
    },
  })
}

function registerHttpSmugglingCachePoisoningSkill(): void {
  const definition = getNetRunnerSkillDefinition('http-smuggling-cache-poisoning')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: http-smuggling-cache-poisoning')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Grep', 'TodoWrite', 'WebFetch'],
    argumentHint: '[authorized target URL or host list]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# HTTP Smuggling & Cache Poisoning

Probe authorized targets for HTTP request smuggling and cache poisoning. Do not run on out-of-scope hosts. Do not invent vulnerable behaviour.

Input:
${args || 'No explicit target URL or host list supplied. Ask for the authorized target(s) before probing.'}

Execution:
1. Engagement manifest pre-validates scope; halt only if \`nr_scope_check\` returns review/block. Smuggling probes can affect downstream caches and load balancers; halt if impact level is read-only.
2. Create an evidence directory under \`.netrunner/artifacts/smuggling/<target-slug>\`.
3. Verify tool readiness:
   - \`command -v smuggler\`
   - \`command -v interactsh-client\`
   - \`command -v curl\`
4. Smuggling probes (CL.TE / TE.CL / TE.TE):
   - \`smuggler -u <url> -m all -o <dir>/smuggler.log\`
   - On positive timing differential, capture the exact request pair and response timing as raw evidence; do not extrapolate.
5. Cache poisoning probes:
   - Identify cache keys via \`X-Cache\`, \`Age\`, \`CF-Cache-Status\`, \`X-Served-By\`, \`Via\` headers with \`curl -sI\` baselines.
   - Try unkeyed-input vectors (e.g. \`X-Forwarded-Host\`, \`X-Host\`, \`X-Forwarded-Scheme\`, \`X-Original-URL\`) one at a time; revert between probes; never poison shared production caches.
   - For OOB validation of poisoned redirects or SSRF, register an interactsh domain: \`interactsh-client -json -o <dir>/interactsh.json\` and reference the issued domain in payloads.
6. If WAF or upstream caching disrupts probes, document it instead of bypassing aggressively.
7. Capture per-finding evidence:
   - Exact request pair / poisoned header
   - Cache key and TTL
   - Reflection or redirection observed
   - OOB callbacks correlated by ID
8. Mark a finding confirmed only when timing evidence, cache reflection, or OOB callback is reproduced. Otherwise tag as candidate.

Output discipline: probe evidence (request pair, headers, timing, OOB IDs) saved under the evidence directory. Confirmed smuggling or cache-poisoning vectors go through nr_save_finding with timing + OOB correlation attached. Reply one line: probes run, confirmed count, candidates count, cleanup state.`,
        },
      ]
    },
  })
}

function registerServerlessEdgeReconSkill(): void {
  const definition = getNetRunnerSkillDefinition('serverless-edge-recon')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: serverless-edge-recon')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Grep', 'TodoWrite', 'WebFetch', 'WebSearch'],
    argumentHint: '[authorized root domain or known serverless deployment URL]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Serverless & Edge Recon

Map serverless and edge surface for the authorized target. Do not test out-of-scope tenants. Do not invent endpoints.

Input:
${args || 'No explicit target supplied. Ask for the authorized root domain or known serverless deployment URL first.'}

Execution:
1. Engagement manifest pre-validates scope; halt only if \`nr_scope_check\` returns review/block.
2. Create an evidence directory under \`.netrunner/artifacts/serverless-edge/<target-slug>\`.
3. Identify edge / serverless providers via passive signals first:
   - DNS CNAME / A record patterns: \`*.vercel.app\`, \`*.netlify.app\`, \`*.workers.dev\`, \`*.amazonaws.com\`, \`*.azurewebsites.net\`
   - HTTP response headers: \`server: Vercel\`, \`x-vercel-id\`, \`x-now-id\`, \`server: Netlify\`, \`x-nf-request-id\`, \`cf-ray\`, \`x-amz-cf-id\`, \`x-amz-apigw-id\`
   - TLS SNI and certificate issuer
4. Asset and route enumeration (low impact):
   - \`subfinder -d <root> -all -silent | tee <dir>/subdomains.txt\`
   - \`echo <root> | gau --subs | tee <dir>/historical-urls.txt\`
   - \`cat <dir>/subdomains.txt | httpx -silent -title -tech-detect -location -status-code -json -o <dir>/httpx.json\`
   - For Vercel/Netlify previews, look for \`*-git-*-<team>.vercel.app\` and \`*--<site>.netlify.app\` style preview URLs.
5. Function endpoint discovery:
   - Vercel: surface \`/api/*\` and \`/_next/data/*\` routes via \`katana -u <url> -d 3 -jc -kf all -silent -o <dir>/katana.txt\`, then \`ffuf\` with project-derived wordlists; check for \`x-vercel-cache\` and \`/_next/data/*.json\` exposure.
   - Netlify: probe \`/.netlify/functions/<name>\` enumerated from build artifacts and JS chunks.
   - Cloudflare Workers: probe service routes and check for header echo / SSRF.
   - AWS Lambda URLs: probe \`*.lambda-url.<region>.on.aws\` and API Gateway \`/<stage>/<route>\` patterns.
   - Azure Functions: probe \`/api/<name>\` on \`*.azurewebsites.net\`.
6. Validate exposure with templated checks:
   - \`nuclei -u <url> -tags vercel,netlify,workers,aws,azure -severity info,low,medium,high -o <dir>/nuclei.json\`
7. Look for environment leakage and config exposure:
   - \`/_next/data/<build>/<route>.json\`, \`/_next/static/chunks/*.js\` for inlined env, public-token leakage.
   - \`/.netlify/functions/.env\`, \`.well-known\`, source maps.
   - Mine JS with \`subjs\`, \`getJS\`, \`linkfinder\`, \`secretfinder\`, \`mantra\`, \`trufflehog filesystem <dir>\`.
8. Test SSRF/AC for serverless metadata:
   - On authorized lab targets only, probe \`169.254.169.254\` style metadata via OOB through \`interactsh-client\`. Do not target shared cloud providers without explicit authorization.
9. Tag findings: provider-confirmed, function-exposed, secret-leaked, ssrf-candidate, ssrf-confirmed.

Output discipline: provider mappings and route inventories saved via nr_save_note (category=serverless-edge). Secret leakage and OOB-confirmed SSRF saved via nr_save_finding. Candidate-only SSRF stays as nr_save_note until OOB confirms. Reply one line: providers detected, functions discovered, secret-leak findings, ssrf confirmed.`,
        },
      ]
    },
  })
}

function registerWordpressAttackTreeSkill(): void {
  const definition = getNetRunnerSkillDefinition('wordpress-attack-tree')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: wordpress-attack-tree')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'WebFetch', 'Grep', 'TodoWrite'],
    argumentHint: '[authorized WordPress target URL]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# WordPress Attack Tree

Run a real WordPress assessment path. Do not simulate findings.

Target input:
${args || 'No explicit target supplied. Ask for the authorized WordPress URL before running.'}

Execution:
1. Engagement manifest pre-validates scope; halt only if \`nr_scope_check\` returns review/block.
2. Create an evidence directory under \`.netrunner/artifacts/wordpress/<target-slug>\`.
3. Verify tool readiness with \`command -v wpscan && wpscan --version\`, \`command -v curl\`, and \`command -v nuclei\`.
4. Fingerprint first with low-impact HTTP checks:
   - \`curl -I <url>\`
   - \`curl <url>/wp-json/\`
   - \`curl <url>/xmlrpc.php\`
   - \`whatweb <url>\` when available
5. Run WPScan enumeration with current documented modes and evidence output. Prefer passive or mixed first:
   - \`wpscan --url <url> -e vp,vt,tt,cb,dbe,u,m --plugins-detection mixed --random-user-agent\`
   - Add \`--api-token <token>\` only if the environment provides an authorized token.
   - If WordPress detection fails but evidence says it is WordPress, justify \`--force\` explicitly.
6. Cross-check WordPress attack paths:
   - REST user exposure: \`curl <url>/wp-json/wp/v2/users\`
   - XML-RPC method exposure: POST \`system.listMethods\` to \`xmlrpc.php\`
   - Plugin/theme exposures with WPScan + \`nuclei -t http/vulnerabilities/wordpress/\`
   - Backup/db export leakage from WPScan findings
7. Only propose credential attacks or XML-RPC multicall brute-force when the engagement scope allows auth attacks. Treat this as guarded escalation, not default recon.
8. If WAF or rate limiting appears, document it. WPScan supports \`--random-user-agent\`; use proxy inspection only when troubleshooting false positives or negatives.

Output discipline: WPScan output and probe artifacts saved under the evidence directory. Enumerated users/plugins/themes and confirmed attack paths each saved via nr_save_finding with CVE/CWE/MITRE tags where known. Reply one line: users, plugins, themes, confirmed attack paths.`,
        },
      ]
    },
  })
}

function registerCavemanHarnessSkill(): void {
  const definition = getNetRunnerSkillDefinition('caveman-harness')
  if (!definition) {
    throw new Error('Missing Net-Runner skill definition: caveman-harness')
  }

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Read', 'TodoWrite'],
    argumentHint: '[handoff/report/agent output to compress]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Caveman Harness

Compress agent output and handoffs. Preserve technical truth.

Input:
${args || 'Compress current agent handoff, plan, or report section.'}

Rules:
- Drop filler, pleasantries, generic explanations, repeated context.
- Keep exact commands, paths, URLs, identifiers, payloads, code, evidence refs, CVEs, CWEs, CVSS, MITRE IDs, timestamps.
- Use short lines, fragments, arrows.
- Do not compress code blocks or raw evidence.
- Do not remove scope warnings, destructive-action warnings, or authorization requirements.
- If compression would hide risk, keep explicit warning.

Output:
- Compressed version
- Removed-noise summary
- Any risk detail preserved verbatim`,
        },
      ]
    },
  })
}

/**
 * Initialize all bundled skills.
 * Called at startup to register skills that ship with the CLI.
 *
 * To add a new bundled skill:
 * 1. Create a new file in src/skills/bundled/ (e.g., myskill.ts)
 * 2. Export a register function that calls registerBundledSkill()
 * 3. Import and call that function here
 */
export function initBundledSkills(): void {
  registerEngagementSetupSkill()
  registerScopeGuardSkill()
  registerReconPlanSkill()
  registerDigitalFootprintAssessmentSkill()
  registerIdentityCorrelationSkill()
  registerC2InfrastructureSkill()
  registerC2OperationsSkill()
  registerWordpressAttackTreeSkill()
  registerHeadlessBrowserValidationSkill()
  registerBugBountyValidationSkill()
  registerHttpSmugglingCachePoisoningSkill()
  registerServerlessEdgeReconSkill()
  registerTargetFingerprintingSkill()
  registerEvidenceCaptureSkill()
  registerVulnAssessmentSkill()
  registerExploitValidationSkill()
  registerPostExploitationPlanSkill()
  registerReportGenerationSkill()
  registerAttackPathAnalysisSkill()
  registerAptSimulationSkill()
  registerFeedbackLoopSkill()
  registerStatisticalVerificationSkill()
  registerWafDetectionSkill()
  registerMctsPlanningSkill()
  registerOobVerificationSkill()
  registerCavemanHarnessSkill()
  registerDfirTriageSkill()
  registerCodeAuditReviewSkill()
  registerThreatIntelEnrichmentSkill()
  registerWifiAssessmentSkill()
  registerMobileAppTestingSkill()
  registerBinaryExploitationSkill()
  registerMemorySearchSkill()
  registerMemorySaveSkill()
  registerUpdateConfigSkill()
  registerKeybindingsSkill()
  registerVerifySkill()
  registerDebugSkill()
  registerLoremIpsumSkill()
  registerSkillifySkill()
  registerRememberSkill()
  registerSimplifySkill()
  registerBatchSkill()
  registerStuckSkill()
  if (feature('KAIROS') || feature('KAIROS_DREAM')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerDreamSkill } = require('./dream.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerDreamSkill()
  }
  if (feature('REVIEW_ARTIFACT')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerHunterSkill } = require('./hunter.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerHunterSkill()
  }
  if (feature('AGENT_TRIGGERS')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerLoopSkill } = require('./loop.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // /loop's isEnabled delegates to isKairosCronEnabled() — same lazy
    // per-invocation pattern as the cron tools. Registered unconditionally;
    // the skill's own isEnabled callback decides visibility.
    registerLoopSkill()
  }
  if (feature('AGENT_TRIGGERS_REMOTE')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const {
      registerScheduleRemoteAgentsSkill,
    } = require('./scheduleRemoteAgents.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerScheduleRemoteAgentsSkill()
  }
  if (feature('BUILDING_CLAUDE_APPS')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerClaudeApiSkill } = require('./claudeApi.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerClaudeApiSkill()
  }
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const {
      shouldAutoEnableClaudeInChrome,
    } = require('src/utils/claudeInChrome/setup.js') as typeof import('src/utils/claudeInChrome/setup.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    if (shouldAutoEnableClaudeInChrome()) {
      /* eslint-disable @typescript-eslint/no-require-imports */
      const { registerClaudeInChromeSkill } = require('./claudeInChrome.js')
      /* eslint-enable @typescript-eslint/no-require-imports */
      registerClaudeInChromeSkill()
    }
  } catch {
    // Browser bridge skill is optional. If its package is absent, keep the
    // rest of the bundled security skill surface available.
  }
  if (feature('RUN_SKILL_GENERATOR')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerRunSkillGeneratorSkill } = require('./runSkillGenerator.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerRunSkillGeneratorSkill()
  }
}
