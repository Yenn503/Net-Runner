<div align="center">

# Net-Runner 🥷

### रेड टीम असेसमेंट फ्रेमवर्क

<img src="../.github/assets/Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/लाइसेंस-शैक्षिक%20उपयोग-red?style=for-the-badge)](#लाइसेंस)

**12 विशेषज्ञ एजेंट · 153 रेड टीम टूल · 18 क्षमता पैक · 11 पेनटेस्ट स्किल्स · 7 वर्कफ़्लो · 10 APT सिमुलेशन**

[English](../README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **हिन्दी** · [Deutsch](README.de.md)

---

</div>

> ⚠️ **चेतावनी**
> इसे केवल उन्हीं टारगेट्स पर इस्तेमाल करें जिनके लिए आपके पास साफ अनुमति हो। Net-Runner कानूनी सुरक्षा परीक्षण, लैब काम और शैक्षिक उपयोग के लिए है।

> **अनुवाद नोट**
> अंग्रेज़ी संस्करण [README.md](README.md) मुख्य दस्तावेज़ है। यह अनुवाद जानबूझकर छोटा रखा गया है ताकि यह मुख्य README से अलग न हो जाए।

## सार

Net-Runner एक final-year university project है जो LLM को सुरक्षा मूल्यांकन स्वतंत्र रूप से चलाने देता है। इसे एक target दो और यह बाकी सब संभाल लेता है — workflow चुनना, specialist agents चलाना, tools चलाना, scope का पालन करना, और evidence रिकॉर्ड करना। सार्वजनिक [OpenClaude](https://github.com/Gitlawb/openclaude) runtime पर बना है।

- सभी evidence, findings, artifacts और reports `.netrunner/` project folder में सेव होते हैं
- LLM और हर specialist agent पिछले sessions में जो पाया उसे याद रखते हैं, ताकि लंबे assessments सही तरह चलते रहें
- जब किसी खास domain expertise की जरूरत हो तो specialist agents को काम सौंपता है
- scope से बाहर या अनुमति impact level से अधिक किसी भी action को रोकता या चेतावनी देता है
- web, API, mobile, lab, Active Directory, WiFi, CTF assessments और APT threat simulations को support करता है
- असली threat actors (APT29, Lazarus, Volt Typhoon आदि) को MITRE ATT&CK से map करके industry-wise attack chains से simulate करता है

## जल्दी शुरू करें

```bash
bun install
bun run build
```

फिर अपना model provider सेट करें और यह चलाएँ:

```bash
node dist/cli.mjs
```

उदाहरण:

```text
https://target.example का असेसमेंट करो। recon से शुरू करो, attack surface map करो, असली findings validate करो और evidence सेव करो।
```

## मुख्य डॉक्युमेंटेशन

- पूरा अंग्रेज़ी README: [README.md](README.md)
- यह कैसे काम करता है और workflows: [docs/workflows/overview.md](docs/workflows/overview.md)
- पूरा tool catalog: [docs/capabilities/tool-catalog.md](docs/capabilities/tool-catalog.md)
- research alignment: [docs/project/research-alignment.md](docs/project/research-alignment.md)
- project provenance: [docs/project/upstream-provenance.md](docs/project/upstream-provenance.md)
- APT simulation: [docs/apt-simulation/README.md](docs/apt-simulation/README.md)
- industry threat map: [docs/apt-simulation/industry-threat-map.md](docs/apt-simulation/industry-threat-map.md)

## लाइसेंस

यह रिपॉज़िटरी केवल शैक्षिक उपयोग और अधिकृत सुरक्षा परीक्षण के लिए है।
