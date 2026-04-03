<div align="center">

# Net-Runner 🥷

### Framework Red Team con Agentes

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/Licencia-Uso%20Educativo-red?style=for-the-badge)](#licencia)

**12 agentes especialistas · 141 herramientas Red Team · 17 paquetes de capacidad · 10 habilidades de pentest · 6 flujos de trabajo**

*Habla con naturalidad. Net-Runner se encarga del resto.*

[English](README.md) · **Español** · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **Advertencia**
> Úsalo solo contra objetivos para los que tengas autorización explícita. Net-Runner está diseñado para pruebas de seguridad legales, autorizadas y con fines educativos.

> **Nota de traducción**
> La versión en inglés (`README.md`) es la referencia principal del proyecto y de su dirección de investigación actual. Esta traducción es de apoyo y puede quedarse atrás respecto a la documentación principal.

## 🔍 Qué es Net-Runner

Net-Runner es un framework multiagente de pruebas de seguridad diseñado para trabajar en lenguaje natural.

Conectas un LLM, describes el objetivo y la meta con lenguaje normal, y Net-Runner pone en marcha todo el motor:

- detecta la intención de la evaluación
- crea un entorno `.netrunner/` dentro del proyecto
- inyecta alcance y contexto de workflow en la sesión
- enruta trabajo a agentes especialistas cuando hace falta
- guarda evidencia, memoria y reportes mientras avanza la evaluación

```text
Tú describes el trabajo.
Net-Runner planifica, delega, ejecuta, recuerda y reporta.
```

---

## ✨ Por qué se usa

- **Lenguaje natural primero** — no hace falta memorizar comandos para empezar
- **Un solo sistema en línea** — agentes, herramientas, evidencia, memoria y reportes viven en el mismo flujo
- **Agentes especialistas** — reconocimiento, web, API, red, explotación, AD, retest, evidencia y reporting ya vienen integrados
- **Memoria persistente** — el contexto útil puede recuperarse entre sesiones con recuperación basada en RAG
- **Evidencia primero** — hallazgos, pasos de ejecución, aprobaciones y reportes quedan ligados al mismo engagement

---

## 🚀 Empieza aquí

### 1. Instala y compila

```bash
bun install
bun run build
```

### 2. Conecta un modelo

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

#### Cualquier API compatible con OpenAI

```bash
export OPENAI_API_KEY="tu-clave"
export OPENAI_BASE_URL="https://tu-proveedor.com/v1"
export OPENAI_MODEL="tu-modelo"
node dist/cli.mjs
```

### 3. Habla con naturalidad

```text
Evalúa https://objetivo.ejemplo. Empieza con reconocimiento, encuentra la superficie principal de ataque, valida los problemas más probables y guarda evidencia mientras avanzas.
```

Net-Runner detecta el objetivo, inicia el engagement, inyecta el contexto correcto y empieza a usar su runtime agéntico.

---

## ⚙️ Cómo funciona

```text
Tú
  ↓
Sesión principal del LLM
  ↓
Contexto del runtime de Net-Runner
  ↓
Agentes especialistas + herramientas + memoria + evidencia
  ↓
Salida estructurada de la evaluación
```

| Paso | Qué hace Net-Runner |
|------|---------------------|
| **1. Detectar** | Reconoce la intención de la evaluación, el tipo de objetivo y el workflow más probable |
| **2. Preparar** | Crea el estado `.netrunner/` del engagement si todavía no existe |
| **3. Inyectar** | Añade alcance, límite de impacto, workflow y habilidades por defecto a la sesión viva |
| **4. Enrutar** | Usa el runtime principal y a los agentes especialistas juntos, sin obligarte a microgestionar comandos |
| **5. Proteger** | Aplica guardrails internos a acciones destructivas, persistentes o fuera de alcance |
| **6. Registrar** | Guarda evidencia, pasos de ejecución, hallazgos, revisiones, memoria y reportes en el mismo entorno |

En el camino normal puedes:

- darle un objetivo
- decirle qué tipo de evaluación ejecutar
- pedirle que continúe, profundice, revalide, resuma o reporte
- dejar que use el entorno, las herramientas, la memoria y los agentes ya disponibles

---

## 🕵️ Agentes

Net-Runner mantiene el flujo agentic general original y añade roles especialistas de seguridad por encima.

| Agente | Qué hace |
|:-------|:---------|
| **Engagement Lead** | Orquesta la evaluación, elige fases del workflow y enruta trabajo |
| **Recon Specialist** | Encuentra hosts, servicios, subdominios, tecnologías y superficie de ataque |
| **Web Testing Specialist** | Prueba rutas, parámetros, flujos de autenticación y vulnerabilidades web |
| **API Testing Specialist** | Prueba APIs, esquemas, JWT, IDOR y transiciones de estado |
| **Network Testing Specialist** | Maneja enumeración de servicios, validación de red y pruebas a nivel de host |
| **Exploit Specialist** | Valida el impacto real de forma controlada |
| **Privilege Escalation Specialist** | Maneja rutas de escalada después del acceso |
| **Lateral Movement Specialist** | Maneja pivotes, relaciones de confianza y movimiento entre hosts |
| **AD Specialist** | Se centra en Active Directory y Kerberos |
| **Retest Specialist** | Reproduce hallazgos y valida correcciones |
| **Evidence Specialist** | Organiza artefactos y evidencia trazable |
| **Reporting Specialist** | Convierte la evidencia en un informe claro |

Los agentes base del runtime como `general-purpose`, `Explore`, `Plan` y `verification` siguen formando parte del sistema.

---

## 🧱 Estructura del proyecto

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

- `engagement.json` — workflow actual, objetivos, límite de impacto y restricciones
- `run-state.json` — pasos de ejecución y revisiones pendientes
- `evidence/` — registro append-only de evidencia
- `findings/` — salidas estructuradas de hallazgos
- `reports/` — informes generados
- `artifacts/` — salidas recopiladas y archivos de soporte
- `memory/` — memoria persistente de operador, equipo y agentes
- `instructions/` — instrucciones del runtime a nivel de proyecto

---

## 💬 Prompts de ejemplo

```text
Evalúa https://objetivo.ejemplo y mapea la superficie de ataque externa.
```

```text
Continúa el engagement actual, céntrate en debilidades de autenticación y guarda evidencia de todo lo real.
```

```text
Escala a validación intrusiva y comprueba si el problema identificado es realmente explotable.
```

```text
Genera un informe a partir de la evidencia actual y resume primero los hallazgos de mayor riesgo.
```

---

## 📚 Documentación

Usa este README para el camino del operador. Usa `docs/` para el detalle técnico.

- [Resumen de workflows](docs/workflows/overview.md)
- [Superficies de servicio](docs/capabilities/service-surfaces.md)
- `docs/` para implementación, mapeo de capacidades y notas más profundas del runtime

---

## 📜 Licencia

Este repositorio es solo para **uso educativo** y **pruebas de seguridad autorizadas**.

---

<div align="center">

*Diseñado para operadores que piensan en objetivos y resultados, no en flags ni rituales de configuración.*

</div>
