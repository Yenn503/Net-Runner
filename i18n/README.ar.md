<div align="center">

# Net-Runner 🥷

### إطار تقييم ريد تيم

<img src="../Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/الترخيص-استخدام%20تعليمي-red?style=for-the-badge)](#الترخيص)

**12 وكيلًا متخصصًا · 153 أداة ريد تيم · 18 حزمة قدرات · 11 مهارة اختبار اختراق · 7 مسارات عمل · 10 محاكاة APT**

[English](../README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · **العربية** · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **تحذير**
> استخدمه فقط على الأهداف التي لديك تصريح واضح لاختبارها. Net-Runner مخصص لاختبارات الأمان القانونية والعمل المخبري والاستخدام التعليمي.

> **ملاحظة الترجمة**
> النسخة الإنجليزية [README.md](README.md) هي المرجع الأساسي. هذه الترجمة مختصرة عمدًا حتى لا تنفصل عن المستند الرئيسي.

## ملخص

Net-Runner هو مشروع سنة نهائية جامعي يتيح لنموذج لغوي (LLM) تنفيذ تقييمات أمنية بشكل مستقل. أعطه هدفًا وسيتولى الباقي — اختيار مسار العمل، إطلاق الوكلاء المتخصصين، تشغيل الأدوات، التزام النطاق، وتسجيل الأدلة. مبني على بيئة [OpenClaude](https://github.com/Gitlawb/openclaude) العامة.

- يحفظ كل الأدلة والنتائج والملفات والتقارير في مجلد مشروع `.netrunner/`
- الـ LLM وكل وكيل متخصص يتذكر ما وجده في الجلسات السابقة، لتبقى التقييمات الطويلة متسقة
- يفوض المهام للوكلاء المتخصصين عند الحاجة لخبرة محددة
- يمنع أو ينبه عند أي إجراء خارج النطاق أو يتجاوز مستوى التأثير المسموح
- يدعم تقييمات الويب وAPI والموبايل والمختبر وActive Directory وWiFi وCTF ومحاكاة تهديدات APT
- يحاكي جهات تهديد حقيقية (APT29، Lazarus، Volt Typhoon وغيرها) مع خرائط MITRE ATT&CK وسلاسل هجوم حسب الصناعة

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
- محاكاة APT: [docs/apt-simulation/README.md](docs/apt-simulation/README.md)
- خريطة التهديدات حسب الصناعة: [docs/apt-simulation/industry-threat-map.md](docs/apt-simulation/industry-threat-map.md)

## الترخيص

هذا المستودع مخصص للاستخدام التعليمي واختبارات الأمان المصرح بها فقط.
