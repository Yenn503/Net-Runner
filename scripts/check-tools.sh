#!/usr/bin/env bash
# Coverage check — which cataloged red-team tools are present on this host.
# Used during setup to flag custom installs needed.
TOOLS=(
  nmap masscan subfinder amass bbot httpx theHarvester maigret cloud_enum GHunt holehe haklistgen
  airodump-ng hcxdumptool aireplay-ng
  sqlmap dalfox ffuf nuclei nikto jwt_tool arjun jadx apktool frida objection drozer apkleaks
  netexec impacket-secretsdump bloodhound bloodhound-python certipy linpeas winpeas peirates pacu cloudfox prowler chisel ghidra pwntools
  semgrep gitleaks noseyparker grype trivy checkov volatility3 sleuthkit chainsaw hayabusa yara
  curl wget jq python3 go git docker
)
MISS=()
for t in "${TOOLS[@]}"; do
  if command -v "$t" >/dev/null 2>&1; then
    echo "OK  $t"
  else
    echo "MISS $t"
    MISS+=("$t")
  fi
done
echo "---"
echo "Missing: ${#MISS[@]}/${#TOOLS[@]}"
[ ${#MISS[@]} -gt 0 ] && printf '  %s\n' "${MISS[@]}"
