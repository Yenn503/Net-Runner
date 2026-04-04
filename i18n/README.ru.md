<div align="center">

# Net-Runner 🥷

### Фреймворк Red Team Оценки

<img src="../.github/assets/Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/Лицензия-Учебное%20использование-red?style=for-the-badge)](#лицензия)

**12 специализированных агентов · 153 red-team инструментов · 18 пакетов возможностей · 11 pentest-навыков · 7 workflow · 10 APT-симуляций**

[English](../README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · **Русский** · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **Предупреждение**
> Используйте только против целей, на тестирование которых у вас есть явное разрешение. Net-Runner предназначен для легальных проверок безопасности, лабораторной работы и учебных задач.

> **Примечание по переводу**
> Английская версия [README.md](README.md) остаётся основным документом. Этот перевод намеренно короткий, чтобы не расходиться с основной версией.

## Кратко

Net-Runner — это дипломный проект, который позволяет LLM автономно проводить оценки безопасности. Укажите цель, и он сделает остальное — выберет workflow, запустит специализированных агентов, выполнит инструменты, проверит границы и сохранит доказательства. Построен на публичном рантайме [OpenClaude](https://github.com/Gitlawb/openclaude).

- Все доказательства, находки, артефакты и отчёты сохраняются в папке проекта `.netrunner/`
- LLM и каждый специализированный агент запоминают, что нашли в предыдущих сессиях, чтобы длительные оценки оставались последовательными
- Делегирует задачи специализированным агентам, когда нужна конкретная экспертиза
- Блокирует или отмечает любое действие за пределами скоупа или превышающее допустимый уровень воздействия
- Поддерживает оценки web, API, mobile, lab, Active Directory, WiFi, CTF и симуляции угроз APT
- Симулирует реальных акторов угроз (APT29, Lazarus, Volt Typhoon и др.) с привязкой к MITRE ATT&CK и цепочками атак по отраслям

## Быстрый старт

```bash
bun install
bun run build
```

Дальше настройте провайдера модели и запустите:

```bash
node dist/cli.mjs
```

Пример:

```text
Проведи оценку https://target.example. Начни с recon, определи поверхность атаки, подтверди реальные находки и сохрани доказательства.
```

## Основные документы

- Полный README на английском: [README.md](README.md)
- Как это работает и workflows: [docs/workflows/overview.md](docs/workflows/overview.md)
- Полный каталог инструментов: [docs/capabilities/tool-catalog.md](docs/capabilities/tool-catalog.md)
- Связь с исследованием: [docs/project/research-alignment.md](docs/project/research-alignment.md)
- Происхождение проекта: [docs/project/upstream-provenance.md](docs/project/upstream-provenance.md)
- Симуляция APT: [docs/apt-simulation/README.md](docs/apt-simulation/README.md)
- Карта угроз по отраслям: [docs/apt-simulation/industry-threat-map.md](docs/apt-simulation/industry-threat-map.md)

## Лицензия

Этот репозиторий предназначен только для учебного использования и авторизованных проверок безопасности.
