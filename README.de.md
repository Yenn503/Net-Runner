<div align="center">

# Net-Runner 🥷

### Red-Team-Bewertungsframework

<img src="Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/Lizenz-Bildungszwecke-red?style=for-the-badge)](#lizenz)

**12 Spezialagenten · 153 Red-Team-Tools · 18 Fähigkeitspakete · 10 Pentest-Skills · 7 Workflows**

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · **Deutsch**

---

</div>

> ⚠️ **Warnung**
> Nur gegen Ziele verwenden, für die du eine ausdrückliche Freigabe hast. Net-Runner ist für legale Sicherheitstests, Labore und Lehrzwecke gedacht.

> **Übersetzungshinweis**
> Die englische Version [README.md](README.md) ist das Hauptdokument. Diese Übersetzung bleibt bewusst kurz, damit sie nicht vom eigentlichen Stand abweicht.

## Überblick

Net-Runner ist ein Uni-Abschlussprojekt und ein Red-Team-Bewertungsframework mit Sprachmodell-Unterstützung. Es baut auf dem öffentlichen Fork [OpenClaude](https://github.com/Gitlawb/openclaude) auf und formt diese Basis zu einem System mit Workflows, Beweisen, Speicher, Guardrails und Spezialagenten um.

- Legt pro Projekt ein `.netrunner/`-Runtime-Verzeichnis für Status, Artefakte, Findings und Berichte an
- Nutzt Workflows für Web, API, Mobile, AD, WiFi, Labore und CTF
- Holt nützlichen Kontext über Projektspeicher, Agentenspeicher und Sitzungszusammenfassungen zurück
- Delegiert klar abgegrenzte Arbeit an Spezialisten, wenn das sinnvoll ist
- Nutzt MCP nur noch als gezielte Integrationsschicht statt als Standardarchitektur

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

## Lizenz

Dieses Repository ist nur für Bildungszwecke und autorisierte Sicherheitstests gedacht.
