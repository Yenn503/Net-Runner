<div align="center">

# Net-Runner 🥷

### Framework de Evaluación Red Team

<img src="../Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/Licencia-Uso%20Educativo-red?style=for-the-badge)](#licencia)

**12 agentes especialistas · 153 herramientas Red Team · 18 paquetes de capacidad · 11 habilidades de pentest · 7 flujos de trabajo · 10 simulaciones APT**

[English](../README.md) · **Español** · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **Advertencia**
> Úsalo solo contra objetivos para los que tengas autorización explícita. Net-Runner es para pruebas legales, trabajo de laboratorio y uso educativo.

> **Nota de traducción**
> La versión en inglés ([README.md](README.md)) es la referencia principal. Esta traducción se mantiene corta a propósito para no quedarse desalineada.

## Resumen

Net-Runner es un proyecto final de universidad que permite a un LLM ejecutar evaluaciones de seguridad de forma autónoma. Dale un objetivo y se encarga del resto: elige el workflow, lanza agentes especialistas, ejecuta herramientas, respeta el alcance y registra evidencia. Construido sobre el runtime público [OpenClaude](https://github.com/Gitlawb/openclaude).

- Guarda toda la evidencia, hallazgos, artefactos y reportes en una carpeta de proyecto `.netrunner/`
- El LLM y cada agente especialista recuerdan lo que encontraron en sesiones anteriores, para que las evaluaciones largas no pierdan el hilo
- Delega tareas a agentes especialistas cuando se necesita experiencia específica
- Bloquea o señala cualquier acción fuera de alcance o que supere el nivel de impacto permitido
- Soporta evaluaciones web, API, móvil, laboratorio, Active Directory, WiFi, CTF y simulaciones de amenazas APT
- Simula actores de amenazas reales (APT29, Lazarus, Volt Typhoon, etc.) mapeados a MITRE ATT&CK con cadenas de ataque por industria

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
- Simulación APT: [docs/apt-simulation/README.md](docs/apt-simulation/README.md)
- Mapa de amenazas por industria: [docs/apt-simulation/industry-threat-map.md](docs/apt-simulation/industry-threat-map.md)

## Licencia

Este repositorio es solo para uso educativo y pruebas de seguridad autorizadas.
