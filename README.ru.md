<div align="center">

# Net-Runner 🥷

### Фреймворк Red Team Оценки

<img src="Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/Лицензия-Учебное%20использование-red?style=for-the-badge)](#лицензия)

**12 специализированных агентов · 153 red-team инструментов · 18 пакетов возможностей · 10 pentest-навыков · 7 workflow**

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · **Русский** · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **Предупреждение**
> Используйте только против целей, на тестирование которых у вас есть явное разрешение. Net-Runner предназначен для легальных проверок безопасности, лабораторной работы и учебных задач.

> **Примечание по переводу**
> Английская версия [README.md](README.md) остаётся основным документом. Этот перевод намеренно короткий, чтобы не расходиться с основной версией.

## Кратко

Net-Runner — это дипломный проект и фреймворк red team оценки с поддержкой языковых моделей. Он построен на публичном форке [OpenClaude](https://github.com/Gitlawb/openclaude) и перерабатывает эту базу в систему с workflow, доказательствами, памятью, guardrails и специализированными агентами.

- Создаёт `.netrunner/` runtime на уровне проекта для состояния, артефактов, находок и отчётов
- Использует workflows для web, API, mobile, AD, WiFi, lab и CTF
- Возвращает полезный контекст через память проекта, память агентов и сводки сессий
- Делегирует чётко ограниченные задачи специалистам, когда это действительно помогает
- Оставляет MCP как выборочный интеграционный слой, а не как архитектуру по умолчанию

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

## Лицензия

Этот репозиторий предназначен только для учебного использования и авторизованных проверок безопасности.
