<div align="center">

# Net-Runner 🥷

### एजेंट-आधारित रेड टीम आकलन फ्रेमवर्क

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/लाइसेंस-शैक्षिक%20उपयोग-red?style=for-the-badge)](#लाइसेंस)

**12 विशेषज्ञ एजेंट · 141 रेड टीम टूल · 17 क्षमता पैक · 10 पेनटेस्ट स्किल्स · 6 वर्कफ़्लो**

*स्वाभाविक रूप से बात करें। बाकी Net-Runner संभालता है।*

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **हिन्दी** · [Deutsch](README.de.md)

---

</div>

> ⚠️ **चेतावनी**
> इसे केवल उन्हीं लक्ष्यों पर उपयोग करें जिनके परीक्षण की आपको स्पष्ट अनुमति हो। Net-Runner कानूनी, अधिकृत सुरक्षा परीक्षण और शैक्षिक उपयोग के लिए बनाया गया है।

> **अनुवाद नोट**
> अंग्रेज़ी संस्करण (`README.md`) प्रोजेक्ट और उसकी वर्तमान शोध दिशा का मुख्य संदर्भ है। यह अनुवाद केवल सुविधा के लिए है और मुख्य दस्तावेज़ से पीछे रह सकता है।

## 🔍 Net-Runner क्या है?

Net-Runner एक मल्टी-एजेंट सुरक्षा परीक्षण फ्रेमवर्क है जिसे प्राकृतिक भाषा में चलाने के लिए बनाया गया है।

आप एक LLM जोड़ते हैं, लक्ष्य और उद्देश्य को सामान्य भाषा में बताते हैं, और Net-Runner पूरा इंजन सक्रिय कर देता है:

- यह आकलन की मंशा पहचानता है
- यह प्रोजेक्ट-स्तर का `.netrunner/` रनटाइम एनवेलप बनाता है
- यह स्कोप और वर्कफ़्लो कॉन्टेक्स्ट को सत्र में जोड़ता है
- जरूरत पड़ने पर यह काम को विशेषज्ञ एजेंटों तक रूट करता है
- आकलन चलते समय यह साक्ष्य, मेमोरी और रिपोर्ट सहेजता है

```text
आप काम बताते हैं।
Net-Runner योजना बनाता है, काम बाँटता है, चलाता है, याद रखता है और रिपोर्ट देता है।
```

---

## ✨ लोग इसे क्यों इस्तेमाल करते हैं

- **प्राकृतिक भाषा पहले** — शुरू करने के लिए कमांड याद रखने की ज़रूरत नहीं
- **एक ही इनलाइन सिस्टम** — एजेंट, टूल, साक्ष्य, मेमोरी और रिपोर्ट एक ही फ्लो में चलते हैं
- **विशेषज्ञ एजेंट** — recon, web, API, network, exploit, AD, retest, evidence और reporting भूमिकाएँ पहले से जुड़ी हैं
- **स्थायी मेमोरी** — उपयोगी संदर्भ RAG-आधारित retrieval से अलग-अलग सत्रों में वापस लाया जा सकता है
- **साक्ष्य-प्रथम संचालन** — findings, execution steps, approvals और reports एक ही engagement से जुड़े रहते हैं

---

## 🚀 यहाँ से शुरू करें

### 1. इंस्टॉल और बिल्ड

```bash
bun install
bun run build
```

### 2. मॉडल कनेक्ट करें

#### `ANTHROPIC_API_KEY`

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
node dist/cli.mjs
```

#### OpenAI

```bash
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o"
node dist/cli.mjs
```

#### Google Gemini

```bash
export GEMINI_API_KEY="AIza..."
export GEMINI_MODEL="gemini-2.5-pro"
node dist/cli.mjs
```

#### Ollama

```bash
ollama serve
ollama pull llama3.1:8b
export OPENAI_BASE_URL="http://localhost:11434/v1"
export OPENAI_MODEL="llama3.1:8b"
node dist/cli.mjs
```

#### कोई भी OpenAI-compatible API

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_BASE_URL="https://your-provider.com/v1"
export OPENAI_MODEL="your-model"
node dist/cli.mjs
```

### 3. स्वाभाविक रूप से बात करें

```text
https://target.example का आकलन करें। पहले recon करें, मुख्य attack surface खोजें, सबसे संभावित समस्याओं को validate करें और आगे बढ़ते हुए साक्ष्य रखते जाएँ।
```

Net-Runner लक्ष्य पहचानेगा, engagement शुरू करेगा, सही कॉन्टेक्स्ट inject करेगा और अपना agentic runtime उपयोग करना शुरू कर देगा।

---

## ⚙️ यह कैसे काम करता है

```text
आप
  ↓
मुख्य LLM सत्र
  ↓
Net-Runner runtime context
  ↓
विशेषज्ञ एजेंट + टूल + मेमोरी + साक्ष्य
  ↓
संरचित आकलन आउटपुट
```

| चरण | Net-Runner क्या करता है |
|------|--------------------------|
| **1. पहचान** | आकलन की मंशा, लक्ष्य का प्रकार और सबसे उपयुक्त workflow पहचानता है |
| **2. शुरूआत** | अगर अभी मौजूद नहीं है तो engagement के लिए `.netrunner/` स्टेट बनाता है |
| **3. इंजेक्ट** | स्कोप, impact boundary, workflow और default skills को live session में जोड़ता है |
| **4. रूट** | मुख्य runtime और विशेषज्ञ एजेंटों को साथ में उपयोग करता है ताकि आपको commands micro-manage न करनी पड़ें |
| **5. सुरक्षा** | destructive, persistent या out-of-scope actions पर internal guardrails लागू करता है |
| **6. रिकॉर्ड** | evidence, execution steps, findings, reviews, memory और reports को उसी envelope में सहेजता है |

सामान्य रास्ते में आप:

- लक्ष्य दे सकते हैं
- बता सकते हैं कि किस तरह का आकलन चलाना है
- continue, deepen, retest, summarize या report करने को कह सकते हैं
- सिस्टम को उपलब्ध environment, tools, memory और agents का उपयोग करने दे सकते हैं

---

## 🕵️ एजेंट

Net-Runner मूल general agentic flow को बरकरार रखता है और उसके ऊपर विशेषज्ञ सुरक्षा भूमिकाएँ जोड़ता है।

| एजेंट | क्या करता है |
|:------|:-------------|
| **Engagement Lead** | आकलन का orchestration करता है, workflow phases चुनता है और काम route करता है |
| **Recon Specialist** | hosts, services, subdomains, technologies और attack surface ढूँढता है |
| **Web Testing Specialist** | routes, parameters, auth flows और web vulnerabilities की जाँच करता है |
| **API Testing Specialist** | APIs, schemas, JWTs, IDOR paths और state transitions की जाँच करता है |
| **Network Testing Specialist** | service enumeration, network validation और host-level testing संभालता है |
| **Exploit Specialist** | नियंत्रित तरीके से वास्तविक impact validate करता है |
| **Privilege Escalation Specialist** | initial access के बाद escalation paths संभालता है |
| **Lateral Movement Specialist** | pivots, trust paths और multi-host movement संभालता है |
| **AD Specialist** | Active Directory और Kerberos पर केंद्रित रहता है |
| **Retest Specialist** | findings reproduce करता है और fixes validate करता है |
| **Evidence Specialist** | artifacts और traceable evidence व्यवस्थित करता है |
| **Reporting Specialist** | evidence को साफ़ assessment report में बदलता है |

`general-purpose`, `Explore`, `Plan` और `verification` जैसे core runtime agents अभी भी सिस्टम का हिस्सा हैं।

---

## 🧱 प्रोजेक्ट संरचना

```text
.netrunner/
├── engagement.json
├── run-state.json
├── evidence/
│   └── ledger.jsonl
├── findings/
├── reports/
├── artifacts/
├── memory/
│   ├── private.md
│   ├── team.md
│   └── agents/
└── instructions/
```

- `engagement.json` — मौजूदा workflow, targets, impact boundary और restrictions
- `run-state.json` — execution steps और pending reviews
- `evidence/` — append-only evidence ledger
- `findings/` — structured finding outputs
- `reports/` — generated assessment reports
- `artifacts/` — collected outputs और supporting files
- `memory/` — operator, team और agents की persistent memory
- `instructions/` — project-scoped runtime instructions

---

## 💬 उदाहरण prompts

```text
https://target.example का आकलन करें और external attack surface map करें।
```

```text
मौजूदा engagement जारी रखें, authentication weaknesses पर फोकस करें और जो भी वास्तविक हो उसके लिए evidence capture करें।
```

```text
intrusive validation तक बढ़ें और verify करें कि पहचानी गई समस्या वास्तव में exploitable है या नहीं।
```

```text
मौजूदा evidence से report बनाएँ और सबसे high-risk findings पहले summarize करें।
```

---

## 📚 प्रलेखन

यह README operator path के लिए है। तकनीकी विवरण के लिए `docs/` देखें।

- [Workflow overview](docs/workflows/overview.md)
- [Service surfaces](docs/capabilities/service-surfaces.md)
- `docs/` में implementation detail, capability mapping और गहरे runtime notes हैं

---

## 📜 लाइसेंस

यह repository केवल **शैक्षिक उपयोग** और **अधिकृत सुरक्षा परीक्षण** के लिए है।

---

<div align="center">

*उन operators के लिए बनाया गया है जो flags और setup rituals की जगह targets और outcomes में सोचते हैं।*

</div>
