<div align="center">

# Net-Runner 🥷

### Framework de Red Team com Agentes

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/Licença-Uso%20Educacional-red?style=for-the-badge)](#licença)

**12 agentes especialistas · 141 ferramentas Red Team · 17 pacotes de capacidade · 10 skills de pentest · 6 workflows**

*Fale naturalmente. O Net-Runner cuida do resto.*

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · **Português** · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **Aviso**
> Use apenas em alvos para os quais você tenha autorização explícita. O Net-Runner foi feito para testes de segurança legais, autorizados e educacionais.

> **Nota de tradução**
> A versão em inglês (`README.md`) é a referência principal para a descrição do projeto e a direção atual da pesquisa. Esta tradução é apenas de apoio e pode ficar atrás da documentação principal.

## 🔍 O que é o Net-Runner?

O Net-Runner é um framework multiagente de testes de segurança feito para operar em linguagem natural.

Você conecta um LLM, descreve o alvo e o objetivo em linguagem comum, e o Net-Runner coloca todo o motor em ação:

- detecta a intenção da avaliação
- cria um envelope `.netrunner/` dentro do projeto
- injeta escopo e contexto de workflow na sessão
- encaminha o trabalho para agentes especialistas quando necessário
- registra evidências, memória e relatórios conforme a avaliação avança

```text
Você descreve o trabalho.
O Net-Runner planeja, delega, executa, lembra e reporta.
```

---

## ✨ Por que as pessoas usam

- **Linguagem natural em primeiro lugar** — não é preciso decorar comandos para começar
- **Um sistema inline só** — agentes, ferramentas, evidências, memória e relatórios vivem no mesmo fluxo
- **Agentes especialistas** — papéis de recon, web, API, rede, exploit, AD, retest, evidência e reporting já estão integrados
- **Memória persistente** — contexto útil pode ser recuperado entre sessões com busca baseada em RAG
- **Evidência primeiro** — descobertas, passos de execução, aprovações e relatórios ficam ligados ao mesmo engagement

---

## 🚀 Comece aqui

### 1. Instale e faça o build

```bash
bun install
bun run build
```

### 2. Conecte um modelo

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

#### Qualquer API compatível com OpenAI

```bash
export OPENAI_API_KEY="sua-chave"
export OPENAI_BASE_URL="https://seu-provedor.com/v1"
export OPENAI_MODEL="seu-modelo"
node dist/cli.mjs
```

### 3. Fale naturalmente

```text
Avalie https://alvo.exemplo. Comece pelo reconhecimento, encontre a superfície principal de ataque, valide os problemas mais prováveis e mantenha a evidência durante o processo.
```

O Net-Runner detecta o alvo, inicia o engagement, injeta o contexto correto e começa a usar o runtime agentic.

---

## ⚙️ Como funciona

```text
Você
  ↓
Sessão principal do LLM
  ↓
Contexto de runtime do Net-Runner
  ↓
Agentes especialistas + ferramentas + memória + evidência
  ↓
Saída estruturada da avaliação
```

| Etapa | O que o Net-Runner faz |
|------|-------------------------|
| **1. Detectar** | Reconhece a intenção da avaliação, o tipo de alvo e o workflow mais provável |
| **2. Inicializar** | Cria o estado `.netrunner/` do engagement se ele ainda não existir |
| **3. Injetar** | Adiciona escopo, limite de impacto, workflow e skills padrão na sessão ativa |
| **4. Rotear** | Usa o runtime principal e os agentes especialistas juntos, sem obrigar você a microgerenciar comandos |
| **5. Proteger** | Aplica guardrails internos a ações destrutivas, persistentes ou fora de escopo |
| **6. Registrar** | Salva evidência, passos de execução, findings, reviews, memória e relatórios dentro do mesmo envelope |

No caminho normal, você pode:

- fornecer um alvo
- dizer que tipo de avaliação quer rodar
- pedir para continuar, aprofundar, retestar, resumir ou reportar
- deixar o sistema usar o ambiente, as ferramentas, a memória e os agentes que já estão disponíveis

---

## 🕵️ Agentes

O Net-Runner mantém o fluxo agentic geral original e adiciona papéis especialistas de segurança por cima.

| Agente | O que faz |
|:-------|:----------|
| **Engagement Lead** | Orquestra a avaliação, escolhe fases do workflow e roteia trabalho |
| **Recon Specialist** | Encontra hosts, serviços, subdomínios, tecnologias e superfície de ataque |
| **Web Testing Specialist** | Testa rotas, parâmetros, fluxos de autenticação e vulnerabilidades web |
| **API Testing Specialist** | Testa APIs, schemas, JWTs, caminhos IDOR e transições de estado |
| **Network Testing Specialist** | Cuida da enumeração de serviços, validação de rede e testes em nível de host |
| **Exploit Specialist** | Valida o impacto real de forma controlada |
| **Privilege Escalation Specialist** | Cuida de caminhos de escalada após o acesso inicial |
| **Lateral Movement Specialist** | Cuida de pivôs, relações de confiança e movimento entre múltiplos hosts |
| **AD Specialist** | Focado em Active Directory e Kerberos |
| **Retest Specialist** | Reproduz findings e valida correções |
| **Evidence Specialist** | Organiza artefatos e evidência rastreável |
| **Reporting Specialist** | Transforma a evidência em um relatório limpo |

Agentes centrais do runtime, como `general-purpose`, `Explore`, `Plan` e `verification`, continuam fazendo parte do sistema.

---

## 🧱 Estrutura do projeto

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

- `engagement.json` — workflow atual, alvos, limite de impacto e restrições
- `run-state.json` — passos de execução e reviews pendentes
- `evidence/` — ledger append-only de evidência
- `findings/` — saídas estruturadas de findings
- `reports/` — relatórios gerados
- `artifacts/` — saídas coletadas e arquivos de apoio
- `memory/` — memória persistente de operador, equipe e agentes
- `instructions/` — instruções de runtime no nível do projeto

---

## 💬 Prompts de exemplo

```text
Avalie https://alvo.exemplo e mapeie a superfície de ataque externa.
```

```text
Continue o engagement atual, foque em fraquezas de autenticação e capture evidência para tudo que for real.
```

```text
Escale para validação intrusiva e verifique se o problema identificado é realmente explorável.
```

```text
Gere um relatório a partir da evidência atual e resuma primeiro os findings de maior risco.
```

---

## 📚 Documentação

Use este README para o caminho do operador. Use `docs/` para o detalhe técnico.

- [Visão geral dos workflows](docs/workflows/overview.md)
- [Superfícies de serviço](docs/capabilities/service-surfaces.md)
- `docs/` para detalhes de implementação, mapeamento de capacidades e notas mais profundas do runtime

---

## 📜 Licença

Este repositório é apenas para **uso educacional** e **testes de segurança autorizados**.

---

<div align="center">

*Feito para operadores que pensam em alvos e resultados, não em flags nem em rituais de configuração.*

</div>
