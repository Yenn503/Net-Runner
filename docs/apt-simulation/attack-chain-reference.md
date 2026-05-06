# Attack Chain Reference

> Per-APT attack chain details with phase-by-phase breakdown.
> File reference: `src/security/apt-simulation/attackChains.ts`

Agent abbreviations used in tables: **EL** = `engagement-lead` · **RS** = `recon-specialist` · **APP** = `app-testing-specialist` · **INF** = `infra-specialist` · **CF** = `code-forensics-specialist` · **ER** = `evidence-reporting-specialist`

---

## 1. APT29 — Government Cloud Espionage

**Attribution:** Russia (SVR)  
**Industries:** Government, Technology, Healthcare  
**Impact:** Intrusive  
**Sources:** [MITRE G0016](https://attack.mitre.org/groups/G0016/) | [CISA AA24-057A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-057a)

| Phase | Tactic | Description | Key Techniques | Agent |
|---|---|---|---|---|
| 1 | Reconnaissance | ID personnel, cloud tenants, public services | T1589.002, T1591, T1593 | RS |
| 2 | Resource Development | Prep credential-harvesting infra, phishing domains | T1583.001, T1585, T1588.002 | EL |
| 3 | Initial Access | Spearphishing links → cloud SSO, valid cloud creds | T1566.002, T1078.004, T1195.002 | APP |
| 4 | Execution | Cloud mgmt APIs, PowerShell, remote mgmt | T1059.001, T1059.003 | INF |
| 5 | Persistence | Cloud creds, OAuth apps, cloud accounts | T1098.001, T1136.003, T1078.004 | INF |
| 6 | Defense Evasion | Stolen tokens bypass MFA, disable logging | T1550.001, T1562.001, T1070.004 | INF |
| 7 | Credential Access | OAuth tokens, app tokens, password spray, MFA fatigue | T1528, T1539, T1110.003, T1621 | INF |
| 8 | Discovery | Cloud infra, tenant configs, privileged accounts | T1087.002, T1069.002, T1580 | RS + INF |
| 9 | Lateral Movement | Cross cloud tenants, on-prem→cloud, federated ID | T1550.002, T1021.001, T1021.006 | INF |
| 10 | Collection | Email via Graph API, SharePoint/OneDrive, cloud storage | T1114.002, T1530, T1005 | ER |
| 11 | Exfiltration | HTTPS or attacker cloud storage | T1041, T1567.002 | ER |

---

## 2. APT28 — Government Credential Harvesting & Espionage

**Attribution:** Russia (GRU Unit 26165)  
**Industries:** Government, Defense, Energy  
**Impact:** Intrusive  
**Sources:** [MITRE G0007](https://attack.mitre.org/groups/G0007/) | [CISA AA20-296A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-296a)

| Phase | Tactic | Description | Key Techniques | Agent |
|---|---|---|---|---|
| 1 | Reconnaissance | Org structure, key personnel, emails, public infra | T1589.002, T1590, T1593 | RS |
| 2 | Initial Access | Spearphishing attachments/links, exploit VPN/email | T1566.001, T1566.002, T1190, T1133 | APP + INF |
| 3 | Execution | Macro docs, PowerShell, client-side exploits | T1059.001, T1059.005, T1204.002, T1203 | INF |
| 4 | Persistence | Registry run keys, services, scheduled tasks | T1547.001, T1053.005, T1543.003 | INF |
| 5 | Privilege Escalation | Local exploits, process injection, DLL hijacking | T1068, T1055, T1574.001 | INF |
| 6 | Credential Access | LSASS dump, password spray, cred files, NTLM intercept | T1003.001, T1110.003, T1557 | INF |
| 7 | Discovery | AD, domain trusts, shares, connected systems | T1087.002, T1082, T1016, T1049 | RS + INF |
| 8 | Lateral Movement | RDP, SMB, pass-the-hash, tool transfer | T1021.001, T1021.002, T1550.002, T1570 | INF |
| 9 | Collection | Email archives, file shares, keylogging, screenshots | T1560.001, T1039, T1114.002, T1056.001 | ER |
| 10 | C2 | HTTPS with encrypted channels and proxy infra | T1071.001, T1573.001, T1090.002 | INF |
| 11 | Exfiltration | Over C2 or alternative protocols | T1041, T1048 | ER |

---

## 3. Volt Typhoon — Critical Infrastructure Pre-Positioning

**Attribution:** China  
**Industries:** Critical Infrastructure, Manufacturing, Energy, Government  
**Impact:** Limited (stealth-focused)  
**Sources:** [MITRE G1017](https://attack.mitre.org/groups/G1017/) | [CISA AA24-038A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a) | [Microsoft](https://www.microsoft.com/en-us/security/blog/2023/05/24/volt-typhoon-targets-us-critical-infrastructure-with-living-off-the-land-techniques/)

| Phase | Tactic | Description | Key Techniques | Agent |
|---|---|---|---|---|
| 1 | Reconnaissance | Internet-facing appliances, VPN concentrators, edge devices | T1595.001, T1595.002, T1590 | RS |
| 2 | Initial Access | Exploit appliances (Fortinet, Ivanti) or abuse VPN creds | T1190, T1133, T1078 | INF |
| 3 | Execution | ONLY built-in OS tools — PowerShell, cmd, WMI. No malware. | T1059.001, T1059.003, T1047 | INF |
| 4 | Persistence | Local accounts, valid cred reuse. Minimize artifacts. | T1078, T1136.001 | INF |
| 5 | Defense Evasion | LOTL only. Signed OS binaries, clear logs, disable tools. | T1218, T1036, T1070.004, T1202, T1562.001 | INF |
| 6 | Credential Access | LSASS, credential stores, config files | T1003.001, T1552.001, T1555 | INF |
| 7 | Discovery | Extensive native tool recon — systeminfo, ipconfig, net | T1082, T1087.002, T1046, T1135, T1016 | RS + INF |
| 8 | Lateral Movement | RDP, SSH, pass-the-hash | T1021.001, T1021.004, T1550.002 | INF |
| 9 | Collection | Network diagrams, OT docs, configs from file shares | T1560.001, T1005, T1039 | ER |
| 10 | C2 | Low-profile tunneling over standard ports | T1071.001, T1090.002, T1572 | INF |
| 11 | Exfiltration | Stage and exfil over C2 | T1041 | ER |

---

## 4. Sandworm — ICS/OT Destructive Operations

**Attribution:** Russia (GRU Unit 74455)  
**Industries:** Critical Infrastructure, Energy, Government  
**Impact:** Intrusive  
**Sources:** [MITRE G0034](https://attack.mitre.org/groups/G0034/) | [Mandiant APT44](https://www.mandiant.com/resources/blog/apt44-unearthing-sandworm)

| Phase | Tactic | Description | Key Techniques | Agent |
|---|---|---|---|---|
| 1 | Reconnaissance | IT/OT boundary, SCADA endpoints, eng workstations | T1595.001, T1590 | RS |
| 2 | Initial Access (IT) | Spearphishing, exploit apps, supply-chain | T1566.001, T1190, T1195.002, T1133 | APP + INF |
| 3 | Execution | Custom malware, PowerShell, service execution | T1059.001, T1053.005, T1569.002 | INF |
| 4 | Privilege Escalation | Domain admin via exploitation and cred abuse | T1068, T1055, T1547.001 | INF |
| 5 | Credential Access | LSASS, NTDS.dit, OT-adjacent account creds | T1003.001, T1003.003, T1552.001 | INF |
| 6 | Discovery | AD, OT jump hosts, eng workstations, SCADA | T1087.002, T1046, T1135, T1018 | RS + INF |
| 7 | Lateral Movement (IT→OT) | Cross boundary via creds, RDP, SMB | T1021.001, T1021.002, T1550.002, T1570 | INF |
| 8 | Collection | OT configs, PLC files, SCADA docs | T1005, T1039, T1560.001 | ER |
| 9 | **Impact** | **SIMULATION ONLY** — wiper, service disruption, data destruction | T1485, T1486, T1489, T1490, T1491 | ER |

---

## 5. APT38 — Financial Institution SWIFT Heist

**Attribution:** North Korea  
**Industries:** Financial Services  
**Impact:** Intrusive  
**Sources:** [MITRE G0082](https://attack.mitre.org/groups/G0082/) | [CISA BeagleBoyz](https://www.cisa.gov/news-events/alerts/2020/08/26/north-korean-state-sponsored-cyber-actors-use-beagleboyz-cryptocurrency)

| Phase | Tactic | Description | Key Techniques | Agent |
|---|---|---|---|---|
| 1 | Reconnaissance | Bank personnel, SWIFT operators, network structure | T1589.002, T1591, T1593 | RS |
| 2 | Initial Access | Spearphishing bank employees, exploit banking apps | T1566.001, T1566.002, T1190 | APP + INF |
| 3 | Execution | Backdoors via macros, PowerShell, service execution | T1059.001, T1059.005, T1569.002 | INF |
| 4 | Persistence | Registry run keys, scheduled tasks, services | T1547.001, T1053.005, T1543.003 | INF |
| 5 | Credential Access | LSASS, cred files, stores — especially SWIFT accounts | T1003.001, T1552.001, T1555 | INF |
| 6 | Discovery | SWIFT terminals, payment servers, core banking | T1082, T1046, T1016, T1049 | RS + INF |
| 7 | Lateral Movement | Move to SWIFT workstations and payment infra | T1021.001, T1021.002, T1570 | INF |
| 8 | Collection | SWIFT message formats, terminal creds, transactions | T1005, T1560.001, T1119 | ER |
| 9 | **Impact (Financial)** | **DOCUMENTATION ONLY** — fraudulent SWIFT paths | T1657 | ER |
| 10 | **Impact (Destruction)** | **DOCUMENTATION ONLY** — wiper deployment | T1485, T1489, T1490 | ER |

---

## 6. Scattered Spider — Identity-Centric Cloud Compromise

**Attribution:** Cybercrime  
**Industries:** Financial, Technology, Telecom, Retail  
**Impact:** Intrusive  
**Sources:** [MITRE G1015](https://attack.mitre.org/groups/G1015/) | [Microsoft Octo Tempest](https://www.microsoft.com/en-us/security/blog/2023/10/25/octo-tempest-crosses-boundaries-to-facilitate-extortion-encryption-and-destruction/)

| Phase | Tactic | Description | Key Techniques | Agent |
|---|---|---|---|---|
| 1 | Reconnaissance | Helpdesk procedures, social media, MFA config | T1589, T1591, T1593 | RS |
| 2 | Initial Access | Helpdesk social eng, SIM swap, SMS phishing, MSP abuse | T1566.002, T1566.003, T1078.004, T1199 | APP |
| 3 | Credential Access | OAuth/SAML theft, MFA fatigue, session cookies | T1528, T1539, T1621, T1557 | INF |
| 4 | Persistence | New cloud creds, MFA devices, cloud admin accounts | T1136.003, T1098.001, T1078.004 | INF |
| 5 | Defense Evasion | Stolen tokens, disable alerting, impersonate admins | T1550.001, T1562.001 | INF |
| 6 | Discovery | Cloud infra, data stores, federated ID configs | T1082, T1087.002, T1580, T1069.002 | RS |
| 7 | Collection | Cloud storage, SaaS, mailboxes, info repos | T1530, T1213, T1114.002 | ER |
| 8 | Exfiltration | To attacker cloud storage, between accounts | T1567.002, T1537 | ER |
| 9 | **Impact** | **SIMULATION ONLY** — ransomware, account removal | T1486, T1531 | ER |

---

## 7. Salt Typhoon — Telecom Infrastructure Espionage

**Attribution:** China  
**Industries:** Telecommunications, Government  
**Impact:** Intrusive  
**Sources:** [MITRE G1045](https://attack.mitre.org/groups/G1045/) | [CISA Telecom Hardening](https://www.cisa.gov/news-events/alerts/2024/12/04/cisa-and-partners-release-joint-guide-securing-communications-infrastructure)

| Phase | Tactic | Description | Key Techniques | Agent |
|---|---|---|---|---|
| 1 | Reconnaissance | Telecom infra, NMS, internet-facing appliances | T1595.001, T1595.002, T1590 | RS |
| 2 | Initial Access | Exploit network appliances and mgmt interfaces | T1190, T1133, T1078 | INF |
| 3 | Execution | Commands via compromised appliance CLIs | T1059.001, T1059.003 | INF |
| 4 | Persistence | Web shells on mgmt interfaces, modify device configs | T1505.003, T1543.003, T1547.001 | INF |
| 5 | Credential Access | Extract creds from device configs and mgmt DBs | T1003.001, T1552.001 | INF |
| 6 | Discovery | Core network — CDRs, lawful intercept, subscriber mgmt | T1082, T1046, T1016, T1087.002 | RS + INF |
| 7 | Lateral Movement | Mgmt plane → data plane, interconnection systems | T1021.001, T1021.004, T1570 | INF |
| 8 | Collection | CDRs, communications data, subscriber info at scale | T1005, T1560.001, T1119 | ER |
| 9 | Exfiltration | Over encrypted channels | T1041 | ER |

---

## 8. Silk Typhoon — IT Supply Chain & Cloud Exploitation

**Attribution:** China  
**Industries:** Technology, Healthcare, Education, Legal, Government  
**Impact:** Intrusive  
**Sources:** [MITRE G0125](https://attack.mitre.org/groups/G0125/) | [Microsoft](https://www.microsoft.com/en-us/security/blog/2025/03/05/silk-typhoon-targeting-it-supply-chain/)

| Phase | Tactic | Description | Key Techniques | Agent |
|---|---|---|---|---|
| 1 | Reconnaissance | Internet-facing Exchange, remote mgmt, cloud infra | T1595.002, T1590 | RS |
| 2 | Initial Access | Zero-day exploit chains, supply-chain compromise | T1190, T1195.002, T1199, T1078.004 | APP + INF |
| 3 | Execution | Commands through web shells | T1059.001, T1059.003 | INF |
| 4 | Persistence | Web shells, cloud accounts, cloud credentials | T1505.003, T1136.003, T1098.001 | INF |
| 5 | Credential Access | Server creds, app tokens, cloud vault secrets | T1003.001, T1528, T1552.001 | INF |
| 6 | Discovery | Cloud tenants, connected services, data repos | T1082, T1087.002, T1580 | RS |
| 7 | Lateral Movement | On-prem → cloud via stolen tokens | T1021.002, T1550.001 | INF |
| 8 | Collection | Mailboxes, cloud storage, info repos | T1005, T1114.002, T1530, T1213 | ER |
| 9 | Exfiltration | Over C2 or to attacker cloud storage | T1041, T1567.002 | ER |

---

## 9. Lazarus — Healthcare Ransomware & Espionage

**Attribution:** North Korea  
**Industries:** Healthcare, Financial  
**Impact:** Intrusive  
**Sources:** [MITRE G0032](https://attack.mitre.org/groups/G0032/) | [CISA AA22-187A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-187a)

| Phase | Tactic | Description | Key Techniques | Agent |
|---|---|---|---|---|
| 1 | Reconnaissance | Healthcare IT, research staff, VPN/web portals | T1589.002, T1590, T1595.002 | RS |
| 2 | Initial Access | Exploit healthcare apps, spearphish, supply-chain | T1190, T1566.001, T1195.002 | APP + INF |
| 3 | Execution | Custom malware via multiple interpreters | T1059.001, T1059.006, T1204.002, T1203 | INF |
| 4 | Persistence | Registry, tasks, services, DLL hijacking | T1547.001, T1053.005, T1543.003, T1574.001 | INF |
| 5 | Privilege Escalation | Exploitation, process injection, token manipulation | T1068, T1055, T1134 | INF |
| 6 | Credential Access | LSASS, credential files and stores | T1003.001, T1552.001, T1555 | INF |
| 7 | Discovery | EHR systems, research DBs, clinical trial shares | T1082, T1087.002, T1046 | RS + INF |
| 8 | Lateral Movement | Research servers, EHR, clinical data shares | T1021.001, T1021.002, T1550.002, T1570 | INF |
| 9 | Collection | Clinical trial data, drug research, patient records | T1560.001, T1005, T1119 | ER |
| 10 | Exfiltration | Research data over encrypted channels | T1041, T1048 | ER |
| 11 | **Impact** | **SIMULATION ONLY** — ransomware, evidence destruction | T1486, T1485, T1489, T1490 | ER |

---

## 10. APT41 — Manufacturing IP Theft & Espionage

**Attribution:** China  
**Industries:** Manufacturing, Technology, Healthcare  
**Impact:** Intrusive  
**Sources:** [MITRE G0096](https://attack.mitre.org/groups/G0096/) | [Mandiant](https://www.mandiant.com/resources/apt41-dual-espionage-and-cyber-crime-operation)

| Phase | Tactic | Description | Key Techniques | Agent |
|---|---|---|---|---|
| 1 | Reconnaissance | Manufacturing infra, supply chain, eng portals | T1589.002, T1590, T1593 | RS |
| 2 | Initial Access | Supply-chain, exploit apps, vendor trust, spearphish | T1195.002, T1190, T1199, T1566.001 | APP + INF |
| 3 | Execution | PowerShell, WMI, scheduled tasks, custom tooling | T1059.001, T1053.005, T1047 | INF |
| 4 | Persistence | Web shells, services, registry, account manipulation | T1505.003, T1543.003, T1547.001, T1098 | INF |
| 5 | Privilege Escalation | Local exploits, process injection, token manipulation | T1068, T1055, T1134 | INF |
| 6 | Credential Access | LSASS, NTDS.dit, Kerberoasting, credential files | T1003.001, T1003.003, T1558.003, T1552.001 | INF |
| 7 | Discovery | AD, eng file shares, CAD/CAM servers, mfg databases | T1087.002, T1083, T1046, T1135, T1482 | RS + INF |
| 8 | Lateral Movement | Eng workstations and file servers via pass-the-hash | T1021.001, T1021.002, T1550.002, T1570 | INF |
| 9 | Collection | Eng designs, mfg processes, trade secrets, strategy | T1560.001, T1005, T1039, T1213 | ER |
| 10 | Exfiltration | Encrypted channels or cloud storage | T1041, T1567.002 | ER |
