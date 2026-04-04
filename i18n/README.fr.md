<div align="center">

# Net-Runner 🥷

### Framework d'Évaluation Red Team

<img src="../.github/assets/Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/Licence-Usage%20%C3%89ducatif-red?style=for-the-badge)](#licence)

**12 agents spécialistes · 153 outils Red Team · 18 packs de capacités · 11 compétences de pentest · 7 workflows · 10 simulations APT**

[English](../README.md) · [Español](README.es.md) · **Français** · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **Avertissement**
> Utilisez-le uniquement sur des cibles pour lesquelles vous avez une autorisation explicite. Net-Runner est destiné aux tests légaux, au travail en laboratoire et à l'usage éducatif.

> **Note de traduction**
> La version anglaise ([README.md](README.md)) reste la référence principale. Cette traduction est volontairement courte pour éviter de dériver par rapport au document principal.

## Résumé

Net-Runner est un projet de fin d'études qui permet à un LLM de mener des évaluations de sécurité de façon autonome. Donnez-lui une cible et il s'occupe du reste : choix du workflow, lancement des agents spécialistes, exécution des outils, respect du périmètre et collecte des preuves. Construit sur le runtime public [OpenClaude](https://github.com/Gitlawb/openclaude).

- Stocke toutes les preuves, découvertes, artefacts et rapports dans un dossier projet `.netrunner/`
- Le LLM et chaque agent spécialiste se souviennent de ce qu’ils ont trouvé lors des sessions précédentes, pour que les évaluations longues restent cohérentes
- Délègue les tâches aux agents spécialistes quand une expertise spécifique est nécessaire
- Bloque ou signale toute action hors périmètre ou dépassant le niveau d'impact autorisé
- Supporte les évaluations web, API, mobile, lab, Active Directory, WiFi, CTF et les simulations de menaces APT
- Simule des acteurs de menaces réels (APT29, Lazarus, Volt Typhoon, etc.) mappés sur MITRE ATT&CK avec des chaînes d’attaque par industrie

## Démarrage rapide

```bash
bun install
bun run build
```

Configurez ensuite votre fournisseur de modèle puis lancez :

```bash
node dist/cli.mjs
```

Exemple :

```text
Évalue https://cible.exemple. Commence par la reconnaissance, cartographie la surface d'attaque, valide les découvertes réelles et conserve les preuves.
```

## Documentation principale

- README complet en anglais : [README.md](README.md)
- Fonctionnement et workflows : [docs/workflows/overview.md](docs/workflows/overview.md)
- Catalogue complet des outils : [docs/capabilities/tool-catalog.md](docs/capabilities/tool-catalog.md)
- Alignement avec la recherche : [docs/project/research-alignment.md](docs/project/research-alignment.md)
- Provenance du projet : [docs/project/upstream-provenance.md](docs/project/upstream-provenance.md)
- Simulation APT : [docs/apt-simulation/README.md](docs/apt-simulation/README.md)
- Carte des menaces par industrie : [docs/apt-simulation/industry-threat-map.md](docs/apt-simulation/industry-threat-map.md)

## Licence

Ce dépôt est réservé à l'usage éducatif et aux tests de sécurité autorisés.
