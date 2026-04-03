<div align="center">

# Net-Runner 🥷

### Framework Red Team avec Agents

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/Licence-Usage%20%C3%89ducatif-red?style=for-the-badge)](#licence)

**12 agents spécialistes · 141 outils Red Team · 17 packs de capacités · 10 compétences de pentest · 6 workflows**

*Parlez naturellement. Net-Runner s’occupe du reste.*

[English](README.md) · [Español](README.es.md) · **Français** · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **Avertissement**
> Utilisez-le uniquement sur des cibles pour lesquelles vous avez une autorisation explicite. Net-Runner est conçu pour des tests de sécurité légaux, autorisés et éducatifs.

> **Note de traduction**
> La version anglaise (`README.md`) reste la référence principale pour la description du projet et sa direction de recherche actuelle. Cette traduction est fournie pour le confort de lecture et peut être en retard sur la version principale.

## 🔍 Qu’est-ce que Net-Runner ?

Net-Runner est un framework multi-agents de test de sécurité conçu pour fonctionner en langage naturel.

Vous connectez un LLM, vous décrivez la cible et l’objectif en langage simple, et Net-Runner met tout le moteur en marche :

- il détecte l’intention d’évaluation
- il crée une enveloppe d’exécution `.netrunner/` au niveau du projet
- il injecte le périmètre et le contexte de workflow dans la session
- il route le travail vers des agents spécialistes quand nécessaire
- il enregistre preuves, mémoire et rapports pendant toute l’évaluation

```text
Vous décrivez la mission.
Net-Runner planifie, délègue, exécute, mémorise et rapporte.
```

---

## ✨ Pourquoi on l’utilise

- **Langage naturel d’abord** — pas besoin de mémoriser des commandes pour démarrer
- **Un seul système en ligne** — agents, outils, preuves, mémoire et rapports restent dans le même flux
- **Agents spécialistes** — rôles recon, web, API, réseau, exploitation, AD, retest, preuve et reporting déjà câblés
- **Mémoire persistante** — le contexte utile peut être rappelé entre les sessions via une récupération RAG
- **Preuve d’abord** — découvertes, étapes d’exécution, validations et rapports restent liés au même engagement

---

## 🚀 Commencer ici

### 1. Installer et compiler

```bash
bun install
bun run build
```

### 2. Connecter un modèle

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

#### Toute API compatible OpenAI

```bash
export OPENAI_API_KEY="votre-clé"
export OPENAI_BASE_URL="https://votre-fournisseur.com/v1"
export OPENAI_MODEL="votre-modèle"
node dist/cli.mjs
```

### 3. Parlez naturellement

```text
Évalue https://cible.exemple. Commence par la reconnaissance, trouve la surface d’attaque principale, valide les problèmes les plus probables et conserve les preuves au fur et à mesure.
```

Net-Runner détecte la cible, démarre l’engagement, injecte le bon contexte et commence à utiliser son runtime agentique.

---

## ⚙️ Comment ça fonctionne

```text
Vous
  ↓
Session LLM principale
  ↓
Contexte runtime Net-Runner
  ↓
Agents spécialistes + outils + mémoire + preuves
  ↓
Sortie d’évaluation structurée
```

| Étape | Ce que fait Net-Runner |
|------|-------------------------|
| **1. Détecter** | Reconnaît l’intention d’évaluation, le type de cible et le workflow probable |
| **2. Initialiser** | Crée l’état `.netrunner/` de l’engagement s’il n’existe pas encore |
| **3. Injecter** | Ajoute périmètre, niveau d’impact, workflow et compétences par défaut dans la session active |
| **4. Router** | Utilise le runtime principal et les agents spécialistes ensemble, sans vous faire microgérer des commandes |
| **5. Protéger** | Applique des garde-fous internes aux actions destructrices, persistantes ou hors périmètre |
| **6. Enregistrer** | Sauvegarde preuves, étapes d’exécution, découvertes, revues, mémoire et rapports dans la même enveloppe |

Dans le flux normal, vous pouvez :

- donner une cible
- dire quel type d’évaluation exécuter
- demander de continuer, approfondir, retester, résumer ou rapporter
- le laisser utiliser l’environnement, les outils, la mémoire et les agents déjà disponibles

---

## 🕵️ Agents

Net-Runner garde le flux agentique général d’origine et y ajoute des rôles de sécurité spécialisés.

| Agent | Ce qu’il fait |
|:------|:--------------|
| **Engagement Lead** | Orchestre l’évaluation, choisit les phases du workflow et route le travail |
| **Recon Specialist** | Trouve hôtes, services, sous-domaines, technologies et surface d’attaque |
| **Web Testing Specialist** | Teste routes, paramètres, flux d’authentification et vulnérabilités web |
| **API Testing Specialist** | Teste API, schémas, JWT, chemins IDOR et transitions d’état |
| **Network Testing Specialist** | Gère l’énumération des services, la validation réseau et les tests au niveau hôte |
| **Exploit Specialist** | Valide la preuve d’impact de façon contrôlée |
| **Privilege Escalation Specialist** | Gère les chemins d’escalade après accès |
| **Lateral Movement Specialist** | Gère pivots, relations de confiance et mouvement multi-hôtes |
| **AD Specialist** | Se concentre sur Active Directory et Kerberos |
| **Retest Specialist** | Reproduit les découvertes et valide les correctifs |
| **Evidence Specialist** | Organise les artefacts et les preuves traçables |
| **Reporting Specialist** | Transforme les preuves en rapport clair |

Les agents cœur du runtime comme `general-purpose`, `Explore`, `Plan` et `verification` restent aussi dans le système.

---

## 🧱 Structure du projet

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

- `engagement.json` — workflow courant, cibles, limite d’impact et restrictions
- `run-state.json` — étapes d’exécution et revues en attente
- `evidence/` — journal append-only des preuves
- `findings/` — sorties structurées des découvertes
- `reports/` — rapports générés
- `artifacts/` — sorties collectées et fichiers de support
- `memory/` — mémoire persistante de l’opérateur, de l’équipe et des agents
- `instructions/` — instructions runtime propres au projet

---

## 💬 Exemples de prompts

```text
Évalue https://cible.exemple et cartographie la surface d’attaque externe.
```

```text
Continue l’engagement courant, concentre-toi sur les faiblesses d’authentification et capture des preuves pour tout ce qui est réel.
```

```text
Passe à une validation intrusive et vérifie si le problème identifié est réellement exploitable.
```

```text
Génère un rapport à partir des preuves actuelles et résume d’abord les découvertes les plus critiques.
```

---

## 📚 Documentation

Gardez ce README pour le parcours opérateur. Utilisez `docs/` pour le détail technique.

- [Vue d’ensemble des workflows](docs/workflows/overview.md)
- [Surfaces de service](docs/capabilities/service-surfaces.md)
- `docs/` pour l’implémentation, la cartographie des capacités et les notes runtime plus profondes

---

## 📜 Licence

Ce dépôt est destiné uniquement à **un usage éducatif** et à des **tests de sécurité autorisés**.

---

<div align="center">

*Pensé pour les opérateurs qui raisonnent en cibles et en résultats, pas en flags ni en rituels de configuration.*

</div>
