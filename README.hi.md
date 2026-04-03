<div align="center">

# Net-Runner 🥷

### रेड टीम असेसमेंट फ्रेमवर्क

<img src="Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/लाइसेंस-शैक्षिक%20उपयोग-red?style=for-the-badge)](#लाइसेंस)

**12 विशेषज्ञ एजेंट · 153 रेड टीम टूल · 18 क्षमता पैक · 10 पेनटेस्ट स्किल्स · 7 वर्कफ़्लो**

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **हिन्दी** · [Deutsch](README.de.md)

---

</div>

> ⚠️ **चेतावनी**
> इसे केवल उन्हीं टारगेट्स पर इस्तेमाल करें जिनके लिए आपके पास साफ अनुमति हो। Net-Runner कानूनी सुरक्षा परीक्षण, लैब काम और शैक्षिक उपयोग के लिए है।

> **अनुवाद नोट**
> अंग्रेज़ी संस्करण [README.md](README.md) मुख्य दस्तावेज़ है। यह अनुवाद जानबूझकर छोटा रखा गया है ताकि यह मुख्य README से अलग न हो जाए।

## सार

Net-Runner एक final-year university project है और language model support वाला red-team assessment framework भी है। यह सार्वजनिक [OpenClaude](https://github.com/Gitlawb/openclaude) fork पर बना है, और उस base को workflow, evidence, memory, guardrails और specialist agents वाले सिस्टम में बदलता है।

- हर प्रोजेक्ट के लिए `.netrunner/` runtime बनाता है जहाँ state, artifacts, findings और reports रहते हैं
- web, API, mobile, AD, WiFi, lab और CTF workflows देता है
- project memory, agent memory और session summaries से उपयोगी context वापस लाता है
- साफ सीमा वाले काम specialist agents को देता है
- MCP को selective integration layer की तरह रखता है, default architecture की तरह नहीं

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

## लाइसेंस

यह रिपॉज़िटरी केवल शैक्षिक उपयोग और अधिकृत सुरक्षा परीक्षण के लिए है।
