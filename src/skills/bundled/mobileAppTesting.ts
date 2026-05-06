import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerMobileAppTestingSkill(): void {
  const definition = getNetRunnerSkillDefinition('mobile-app-testing')
  if (!definition) throw new Error('Missing Net-Runner skill definition: mobile-app-testing')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'TodoWrite', 'Grep', 'Glob', 'WebFetch', 'WebSearch', 'ListMcpResourcesTool', 'ReadMcpResourceTool'],
    argumentHint: '[APK/IPA path, package name, or engagement identifier]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# Mobile App Testing

Structured Android/iOS mobile application security assessment. Static-before-dynamic ordering. Require proxy/cert setup before traffic capture. Instrument with Frida before runtime hooks.

Input:
${args || 'No APK, IPA, package name, or engagement identifier supplied. Ask for the authorized mobile target and scope before proceeding.'}

Execution:

## 1. Scope and manifest
1. Run \`nr_engagement_status\` and halt if \`nr_scope_check\` returns block.
2. Create evidence directory: \`.netrunner/artifacts/mobile/<engagement-slug>/\`.

## 2. Static analysis — Android (APK)
\`\`\`
# Decode APK resources and manifest
apktool d <app.apk> -o .netrunner/artifacts/mobile/<slug>/apktool/

# Decompile to Java source
jadx -d .netrunner/artifacts/mobile/<slug>/jadx/ <app.apk>

# Extract secrets and endpoints from decompiled source
grep -rE "(api_key|secret|password|token|BEGIN CERT|http[s]?://)" \
  .netrunner/artifacts/mobile/<slug>/jadx/ \
  > .netrunner/artifacts/mobile/<slug>/static-strings.txt

# APK-focused secret and endpoint extraction
apkleaks -f <app.apk> -o .netrunner/artifacts/mobile/<slug>/apkleaks.json

# Review AndroidManifest.xml for exported components, permissions, deep-links
cat .netrunner/artifacts/mobile/<slug>/apktool/AndroidManifest.xml
\`\`\`
Write findings to \`.netrunner/artifacts/mobile/<slug>/static-findings.json\`.

## 3. Static analysis — iOS (IPA)
\`\`\`
# Unzip IPA
unzip <app.ipa> -d .netrunner/artifacts/mobile/<slug>/ipa-extracted/

# List Mach-O binary
ls .netrunner/artifacts/mobile/<slug>/ipa-extracted/Payload/*.app/

# Dump class names and methods
nm -arch arm64 .netrunner/artifacts/mobile/<slug>/ipa-extracted/Payload/*.app/<binary> \
  > .netrunner/artifacts/mobile/<slug>/nm-symbols.txt

# Check for PIE, stack canary, ARC
otool -hv .netrunner/artifacts/mobile/<slug>/ipa-extracted/Payload/*.app/<binary>
otool -Iv .netrunner/artifacts/mobile/<slug>/ipa-extracted/Payload/*.app/<binary> | grep -i "stack"

# Extract strings for secrets and endpoints
strings .netrunner/artifacts/mobile/<slug>/ipa-extracted/Payload/*.app/<binary> \
  | grep -E "(api_key|secret|password|token|http[s]?://)" \
  > .netrunner/artifacts/mobile/<slug>/ipa-static-strings.txt
\`\`\`

## 4. Proxy and certificate setup (before traffic capture)
\`\`\`
# Android: set proxy via adb
adb shell settings put global http_proxy <proxy-host>:<proxy-port>
# e.g. adb shell settings put global http_proxy 192.168.1.100:8080

# Verify proxy is set
adb shell settings get global http_proxy

# Push Burp/mitmproxy CA cert to device
adb push burp-cert.der /sdcard/
# Install via: Settings → Security → Install from storage

# For mitmproxy: push mitmproxy-ca-cert.pem
adb push ~/.mitmproxy/mitmproxy-ca-cert.pem /sdcard/

# iOS (manual): configure proxy in Settings → Wi-Fi → HTTP Proxy (Manual)
# Install CA via Safari → navigate to mitm.it or share cert via AirDrop
\`\`\`

## 5. Frida setup and Objection patchapk (non-rooted devices)
\`\`\`
# Install frida-tools on host
pip install frida-tools objection

# Check connected devices
frida-ls-devices

# For non-rooted Android: patch APK with objection to embed frida-gadget
objection patchapk --source <app.apk>
# Outputs <app.objection.apk> — reinstall on device
adb install -r <app.objection.apk>

# For rooted Android: run frida-server on device
adb push frida-server /data/local/tmp/
adb shell "chmod 755 /data/local/tmp/frida-server"
adb shell "/data/local/tmp/frida-server &"

# Attach objection runtime explorer
objection -g <package.name> explore
\`\`\`

## 6. SSL pinning bypass (Frida)
\`\`\`
# Universal SSL pinning bypass script
frida --codeshare pcipolloni/universal-android-ssl-pinning-bypass-with-frida \
  -f <package.name> --no-pause

# Alternative: frida-pinning-bypass.js
frida -U -f <package.name> -l frida-pinning-bypass.js --no-pause

# Save hook transcript
frida -U -f <package.name> -l frida-pinning-bypass.js --no-pause \
  > .netrunner/artifacts/mobile/<slug>/frida-hooks.txt 2>&1
\`\`\`

## 7. MobSF dynamic scan
\`\`\`
# Start MobSF via docker
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest

# Upload APK/IPA via API
curl -F "file=@<app.apk>" http://localhost:8000/api/v1/upload \
  -H "Authorization: <mobsf-api-key>"

# Trigger scan
curl -X POST http://localhost:8000/api/v1/scan \
  -d "scan_type=apk&file_name=<app.apk>&hash=<file-hash>" \
  -H "Authorization: <mobsf-api-key>"

# Download JSON report
curl http://localhost:8000/api/v1/report_json \
  -d "hash=<file-hash>" -H "Authorization: <mobsf-api-key>" \
  -o .netrunner/artifacts/mobile/<slug>/mobsf-report.json
\`\`\`

## 8. Traffic capture with mitmproxy
\`\`\`
# Start mitmproxy in HAR export mode
mitmproxy --save-stream-file .netrunner/artifacts/mobile/<slug>/traffic.mitm

# Or use mitmdump for headless capture
mitmdump -w .netrunner/artifacts/mobile/<slug>/traffic.mitm

# Export as HAR
mitmproxy --rfile .netrunner/artifacts/mobile/<slug>/traffic.mitm \
  --save-stream-file .netrunner/artifacts/mobile/<slug>/traffic.har

# Remove proxy after capture
adb shell settings put global http_proxy :0
\`\`\`

## 9. Insecure storage check
\`\`\`
# Pull SharedPreferences (requires root or backup-enabled app)
adb shell run-as <package.name> cat /data/data/<package.name>/shared_prefs/<prefs>.xml
# Or via backup (no root)
adb backup -noapk <package.name>
android-backup-extractor master.tar.ab master.tar
tar -xf master.tar

# Pull SQLite databases
adb shell run-as <package.name> ls /data/data/<package.name>/databases/
adb shell run-as <package.name> cp /data/data/<package.name>/databases/<db>.db /sdcard/
adb pull /sdcard/<db>.db .netrunner/artifacts/mobile/<slug>/app-database.db
sqlite3 .netrunner/artifacts/mobile/<slug>/app-database.db ".dump" \
  > .netrunner/artifacts/mobile/<slug>/sqlite-dump.txt

# iOS keychain (via objection on jailbroken device)
# objection → ios keychain dump
\`\`\`

## 10. Exported component analysis (Drozer)
\`\`\`
# Start drozer agent on device and forward port
adb forward tcp:31415 tcp:31415

# Connect drozer console
drozer console connect

# Enumerate attack surface
dz> run app.package.attacksurface <package.name>

# Test exported activities
dz> run app.activity.start --component <package.name> <activity.name>

# Test content providers
dz> run app.provider.finduri <package.name>
dz> run app.provider.query content://<provider.uri>/

# Test broadcast receivers
dz> run app.broadcast.send --component <package.name> <receiver.name> \
  --extra string key value
\`\`\`

## 11. Deep-link fuzzing and intent injection
\`\`\`
# Enumerate deep-link schemes from manifest
grep -i "scheme" .netrunner/artifacts/mobile/<slug>/apktool/AndroidManifest.xml

# Trigger deep-link via adb
adb shell am start -W -a android.intent.action.VIEW \
  -d "appscheme://target/path?param=value" <package.name>

# Intent injection via exported activity
adb shell am start -n <package.name>/<activity.name> \
  --es extra_key "injected_value"

# Broadcast intent injection
adb shell am broadcast -a <custom.action> \
  --es key "value" -p <package.name>
\`\`\`

## 12. Output and findings
- \`.netrunner/artifacts/mobile/<slug>/static-findings.json\` — static analysis results
- \`.netrunner/artifacts/mobile/<slug>/traffic.har\` — captured HTTP traffic
- \`.netrunner/artifacts/mobile/<slug>/frida-hooks.txt\` — Frida instrumentation output
- \`.netrunner/artifacts/mobile/<slug>/mobsf-report.json\` — MobSF scan report
- \`.netrunner/artifacts/mobile/<slug>/sqlite-dump.txt\` — insecure storage contents
- Call \`nr_save_finding\` for each confirmed finding with MITRE technique and OWASP Mobile category:
  - Hard-coded secrets/API keys → T1552.001 (Credentials in Files), OWASP M1 (Improper Credential Usage)
  - Insecure data storage → T1409 (Stored Application Data), OWASP M2 (Inadequate Supply Chain Security) / M9 (Insecure Data Storage)
  - Sensitive data in transit → T1040 (Network Sniffing), OWASP M5 (Insecure Communication)
  - Exported component abuse → T1636 (Protected User Data), OWASP M4 (Insufficient Input/Output Validation)
  - Deep-link abuse → T1636, OWASP M4
  - Auth bypass via Frida → T1430 (Location Tracking) / T1409, OWASP M3 (Insecure Authentication/Authorization)
- Call \`nr_save_note\` with static analysis summary, dynamic test log, and gaps.

## 13. Cleanup
\`\`\`
# Remove proxy setting
adb shell settings put global http_proxy :0

# Kill frida-server if running
adb shell "pkill frida-server"

# Uninstall patched APK if objection patchapk was used
adb uninstall <package.name>
# Reinstall original
adb install <app.apk>
\`\`\`

Output summary:
- Scope decision
- Static analysis findings (secrets, endpoints, exported components)
- Proxy and cert setup status
- SSL pinning bypass status
- Dynamic instrumentation findings
- Insecure storage findings
- Exported component and deep-link attack surface
- Evidence artifact paths
- OWASP Mobile Top 10 and MITRE ATT&CK mappings`,
        },
      ]
    },
  })
}
