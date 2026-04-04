<div align="center">

# Net-Runner 🥷

### Red-Team-Bewertungsframework

<img src="../Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/Lizenz-Bildungszwecke-red?style=for-the-badge)](#lizenz)

**12 Spezialagenten · 153 Red-Team-Tools · 18 Fähigkeitspakete · 11 Pentest-Skills · 7 Workflows · 10 APT-Simulationen**

[English](../README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · **Deutsch**

---

</div>

> ⚠️ **Warnung**
> Nur gegen Ziele verwenden, für die du eine ausdrückliche Freigabe hast. Net-Runner ist für legale Sicherheitstests, Labore und Lehrzwecke gedacht.

> **Übersetzungshinweis**
> Die englische Version [README.md](README.md) ist das Hauptdokument. Diese Übersetzung bleibt bewusst kurz, damit sie nicht vom eigentlichen Stand abweicht.

## Überblick

Net-Runner ist ein Uni-Abschlussprojekt, das einem LLM ermöglicht, Sicherheitsbewertungen autonom durchzuführen. Gib ein Ziel an und es erledigt den Rest — Workflow auswählen, Spezialagenten starten, Tools ausführen, Scope einhalten und Beweise sichern. Gebaut auf der öffentlichen [OpenClaude](https://github.com/Gitlawb/openclaude)-Runtime.

- Speichert alle Beweise, Findings, Artefakte und Berichte im `.netrunner/`-Projektordner
- Das LLM und jeder Spezialagent merken sich, was sie in vorherigen Sitzungen gefunden haben, damit längere Bewertungen konsistent bleiben
- Delegiert Aufgaben an Spezialagenten, wenn spezifisches Fachwissen gebraucht wird
- Blockiert oder warnt bei jeder Aktion außerhalb des Scopes oder über dem erlaubten Impact-Level
- Unterstützt Web-, API-, Mobile-, Labor-, Active-Directory-, WiFi-, CTF-Bewertungen und APT-Bedrohungssimulationen
- Simuliert reale Bedrohungsakteure (APT29, Lazarus, Volt Typhoon usw.) mit MITRE ATT&CK-Zuordnung und branchenspezifischen Angriffsketten

## Schnellstart

```bash
bun install
bun run build
```

Danach den Modellanbieter konfigurieren und starten:

```bash
node dist/cli.mjs
```

Beispiel:

```text
Bewerte https://target.example. Starte mit Recon, mappe die Angriffsfläche, validiere echte Findings und halte Beweise fest.
```

## Wichtige Dokumente

- Vollständiges englisches README: [README.md](README.md)
- Arbeitsweise und Workflows: [docs/workflows/overview.md](docs/workflows/overview.md)
- Vollständiger Tool-Katalog: [docs/capabilities/tool-catalog.md](docs/capabilities/tool-catalog.md)
- Forschungsbezug: [docs/project/research-alignment.md](docs/project/research-alignment.md)
- Herkunft des Projekts: [docs/project/upstream-provenance.md](docs/project/upstream-provenance.md)
- APT-Simulation: [docs/apt-simulation/README.md](docs/apt-simulation/README.md)
- Branchen-Bedrohungskarte: [docs/apt-simulation/industry-threat-map.md](docs/apt-simulation/industry-threat-map.md)

## Lizenz

Dieses Repository ist nur für Bildungszwecke und autorisierte Sicherheitstests gedacht.
