<div align="center">

# Net-Runner 🥷

### إطار تقييم ريد تيم

<img src="Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/الترخيص-استخدام%20تعليمي-red?style=for-the-badge)](#الترخيص)

**12 وكيلًا متخصصًا · 153 أداة ريد تيم · 18 حزمة قدرات · 10 مهارات اختبار اختراق · 7 مسارات عمل**

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · **العربية** · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **تحذير**
> استخدمه فقط على الأهداف التي لديك تصريح واضح لاختبارها. Net-Runner مخصص لاختبارات الأمان القانونية والعمل المخبري والاستخدام التعليمي.

> **ملاحظة الترجمة**
> النسخة الإنجليزية [README.md](README.md) هي المرجع الأساسي. هذه الترجمة مختصرة عمدًا حتى لا تنفصل عن المستند الرئيسي.

## ملخص

Net-Runner هو مشروع سنة نهائية جامعي وإطار تقييم ريد تيم مع دعم لنماذج اللغة. يعتمد على fork عام من [OpenClaude](https://github.com/Gitlawb/openclaude) ثم يعيد تشكيله إلى نظام يعتمد على workflow والأدلة والذاكرة والضوابط التشغيلية والوكلاء المتخصصين.

- ينشئ runtime باسم `.netrunner/` لكل مشروع لحفظ الحالة والملفات والنتائج والتقارير
- يستخدم workflows للويب وواجهات API والموبايل وActive Directory وWiFi واللاب وCTF
- يعيد السياق المفيد عبر ذاكرة المشروع وذاكرة الوكلاء وملخصات الجلسات
- يفوض المهام الواضحة الحدود إلى الوكلاء المتخصصين عند الحاجة
- يبقي MCP كطبقة تكامل انتقائية بدل أن تكون هي البنية الأساسية

## بدء سريع

```bash
bun install
bun run build
```

بعد ذلك اضبط مزود النموذج ثم شغّل:

```bash
node dist/cli.mjs
```

مثال:

```text
قيّم https://target.example. ابدأ بالاستطلاع، وحدد سطح الهجوم، وتحقق من النتائج الحقيقية، واحفظ الأدلة.
```

## الوثائق الأساسية

- README الكامل بالإنجليزية: [README.md](README.md)
- طريقة العمل وworkflows: [docs/workflows/overview.md](docs/workflows/overview.md)
- فهرس الأدوات الكامل: [docs/capabilities/tool-catalog.md](docs/capabilities/tool-catalog.md)
- مواءمة البحث: [docs/project/research-alignment.md](docs/project/research-alignment.md)
- أصل المشروع: [docs/project/upstream-provenance.md](docs/project/upstream-provenance.md)

## الترخيص

هذا المستودع مخصص للاستخدام التعليمي واختبارات الأمان المصرح بها فقط.
