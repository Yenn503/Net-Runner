<div align="center">

# Net-Runner 🥷

### Framework de Avaliação Red Team

<img src="Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/Licença-Uso%20Educacional-red?style=for-the-badge)](#licença)

**12 agentes especialistas · 153 ferramentas Red Team · 18 pacotes de capacidade · 10 skills de pentest · 7 workflows**

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · **Português** · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **Aviso**
> Use apenas contra alvos para os quais você tem autorização explícita. Net-Runner é para testes legais, laboratório e uso educacional.

> **Nota de tradução**
> A versão em inglês [README.md](README.md) é a referência principal. Esta tradução foi mantida curta de propósito para não ficar desalinhada com o documento principal.

## Resumo

Net-Runner é um projeto final de universidade e um framework de avaliação red team com suporte a modelos de linguagem. Ele parte do fork público [OpenClaude](https://github.com/Gitlawb/openclaude) e transforma essa base em um sistema com workflow, evidência, memória, guardrails e agentes especialistas.

- Cria um runtime `.netrunner/` por projeto para estado, artefatos, achados e relatórios
- Usa workflows para web, API, mobile, AD, WiFi, labs e CTF
- Recupera contexto útil com memória do projeto, memória dos agentes e resumos de sessão
- Delega trabalho bem delimitado para especialistas quando isso ajuda
- Mantém MCP como camada seletiva de integração, não como arquitetura padrão

## Início rápido

```bash
bun install
bun run build
```

Depois configure o provedor de modelo e execute:

```bash
node dist/cli.mjs
```

Exemplo:

```text
Avalie https://target.example. Comece com recon, mapeie a superfície de ataque, valide os achados reais e guarde evidências.
```

## Documentação principal

- README completo em inglês: [README.md](README.md)
- Como funciona e workflows: [docs/workflows/overview.md](docs/workflows/overview.md)
- Catálogo completo de ferramentas: [docs/capabilities/tool-catalog.md](docs/capabilities/tool-catalog.md)
- Alinhamento com a pesquisa: [docs/project/research-alignment.md](docs/project/research-alignment.md)
- Proveniência do projeto: [docs/project/upstream-provenance.md](docs/project/upstream-provenance.md)

## Licença

Este repositório é apenas para uso educacional e testes de segurança autorizados.
