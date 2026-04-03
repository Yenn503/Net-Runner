<div align="center">

# Net-Runner 🥷

### Framework de Evaluación Red Team

<img src="Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/Licencia-Uso%20Educativo-red?style=for-the-badge)](#licencia)

**12 agentes especialistas · 153 herramientas Red Team · 18 paquetes de capacidad · 10 habilidades de pentest · 7 flujos de trabajo**

[English](README.md) · **Español** · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **Advertencia**
> Úsalo solo contra objetivos para los que tengas autorización explícita. Net-Runner es para pruebas legales, trabajo de laboratorio y uso educativo.

> **Nota de traducción**
> La versión en inglés ([README.md](README.md)) es la referencia principal. Esta traducción se mantiene corta a propósito para no quedarse desalineada.

## Resumen

Net-Runner es un proyecto final de universidad y un framework de evaluación red team con soporte de modelos de lenguaje. Parte del fork público [OpenClaude](https://github.com/Gitlawb/openclaude) y lo adapta a un flujo de trabajo centrado en evidencia, memoria, guardrails y agentes especialistas.

- Crea un runtime `.netrunner/` por proyecto para estado, artefactos, hallazgos y reportes
- Usa workflows para web, API, móvil, AD, WiFi, laboratorio y CTF
- Recupera contexto útil con memoria del proyecto, memoria de agentes y resúmenes de sesión
- Delega tareas acotadas a especialistas cuando eso mejora la evaluación
- Mantiene MCP como integración puntual, no como la base del sistema

## Inicio rápido

```bash
bun install
bun run build
```

Después configura tu proveedor de modelo y ejecuta:

```bash
node dist/cli.mjs
```

Ejemplo:

```text
Evalúa https://objetivo.ejemplo. Empieza con reconocimiento, mapea la superficie de ataque, valida los hallazgos reales y guarda evidencia.
```

## Documentación principal

- README completo en inglés: [README.md](README.md)
- Cómo funciona y workflows: [docs/workflows/overview.md](docs/workflows/overview.md)
- Catálogo completo de herramientas: [docs/capabilities/tool-catalog.md](docs/capabilities/tool-catalog.md)
- Alineación con la investigación: [docs/project/research-alignment.md](docs/project/research-alignment.md)
- Procedencia del proyecto: [docs/project/upstream-provenance.md](docs/project/upstream-provenance.md)

## Licencia

Este repositorio es solo para uso educativo y pruebas de seguridad autorizadas.
