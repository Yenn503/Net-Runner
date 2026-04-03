<div align="center">

# Net-Runner 🥷

### 智能红队评估框架

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/许可-教育用途-red?style=for-the-badge)](#许可证)

**12 个专业代理 · 141 个红队工具 · 17 个能力包 · 10 个渗透测试技能 · 6 个工作流**

*自然交流，Net-Runner 处理剩下的事。*

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · **中文** · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **警告**
> 只能在你已获得明确授权的目标上使用。Net-Runner 仅面向合法、授权的安全测试和教育用途。

> **翻译说明**
> 英文版 (`README.md`) 是项目说明和当前研究方向的主参考文档。此翻译仅用于方便阅读，更新可能会落后于主文档。

## 🔍 什么是 Net-Runner？

Net-Runner 是一个面向自然语言操作的多代理安全测试框架。

你连接一个 LLM，用自然语言描述目标和任务，Net-Runner 就会启动整套运行引擎：

- 识别评估意图
- 创建项目级 `.netrunner/` 运行目录
- 将范围和工作流上下文注入当前会话
- 在需要时把工作路由给专业代理
- 在评估过程中持续记录证据、记忆和报告

```text
你描述任务。
Net-Runner 负责规划、委派、执行、记忆和报告。
```

---

## ✨ 为什么大家会用它

- **自然语言优先** — 不需要先记命令才能开始
- **单一内联系统** — 代理、工具、证据、记忆和报告都在同一条流程里运行
- **专业代理已就位** — 侦察、Web、API、网络、利用、AD、复测、证据和报告角色都已接好
- **持久记忆** — 可通过 RAG 检索在不同会话之间找回有价值的上下文
- **证据优先** — 发现、执行步骤、审批和报告都绑定在同一次 engagement 里

---

## 🚀 从这里开始

### 1. 安装并构建

```bash
bun install
bun run build
```

### 2. 连接模型

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

#### 任意兼容 OpenAI 的 API

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_BASE_URL="https://your-provider.com/v1"
export OPENAI_MODEL="your-model"
node dist/cli.mjs
```

### 3. 直接自然交流

```text
评估 https://target.example。先做侦察，找出主要攻击面，验证最可能的问题，并在过程中持续保留证据。
```

Net-Runner 会识别目标、启动 engagement、注入正确上下文，并开始使用它的 agentic runtime。

---

## ⚙️ 它是如何工作的

```text
你
  ↓
主 LLM 会话
  ↓
Net-Runner 运行时上下文
  ↓
专业代理 + 工具 + 记忆 + 证据
  ↓
结构化评估输出
```

| 步骤 | Net-Runner 会做什么 |
|------|----------------------|
| **1. 识别** | 判断评估意图、目标类型和最可能的工作流 |
| **2. 启动** | 如果还不存在，就为本次 engagement 创建 `.netrunner/` 状态 |
| **3. 注入** | 将范围、影响边界、工作流和默认技能加入当前会话 |
| **4. 路由** | 同时使用主运行时和专业代理，而不是让你手动管理命令 |
| **5. 保护** | 对破坏性、持久化或超范围操作应用内部护栏 |
| **6. 记录** | 将证据、执行步骤、发现、复核、记忆和报告保存到同一套状态中 |

正常使用时，你可以：

- 给出目标
- 说明要执行哪类评估
- 要求继续、深入、复测、总结或生成报告
- 让它自行使用已经可用的环境、工具、记忆和代理

---

## 🕵️ 代理

Net-Runner 保留原有通用 agentic 流程，并在其上增加专业安全角色。

| 代理 | 作用 |
|:-----|:-----|
| **Engagement Lead** | 统筹评估、选择工作流阶段并路由任务 |
| **Recon Specialist** | 发现主机、服务、子域、技术栈和攻击面 |
| **Web Testing Specialist** | 测试路由、参数、认证流程和 Web 漏洞 |
| **API Testing Specialist** | 测试 API、模式、JWT、IDOR 路径和状态转换 |
| **Network Testing Specialist** | 负责服务枚举、网络验证和主机级测试 |
| **Exploit Specialist** | 以受控方式验证真实影响 |
| **Privilege Escalation Specialist** | 处理初始访问后的提权路径 |
| **Lateral Movement Specialist** | 处理 pivot、信任路径和多主机移动 |
| **AD Specialist** | 聚焦 Active Directory 和 Kerberos |
| **Retest Specialist** | 复现发现并验证修复 |
| **Evidence Specialist** | 组织工件和可追溯证据 |
| **Reporting Specialist** | 将证据整理为清晰报告 |

`general-purpose`、`Explore`、`Plan` 和 `verification` 等核心运行时代理仍然保留在系统中。

---

## 🧱 项目结构

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

- `engagement.json` — 当前工作流、目标、影响边界和限制
- `run-state.json` — 执行步骤和待处理复核
- `evidence/` — 只追加的证据账本
- `findings/` — 结构化发现输出
- `reports/` — 生成的评估报告
- `artifacts/` — 收集的输出和支撑文件
- `memory/` — 操作员、团队和代理的持久记忆
- `instructions/` — 项目级运行时说明

---

## 💬 示例提示词

```text
评估 https://target.example，并绘制外部攻击面。
```

```text
继续当前 engagement，重点检查认证薄弱点，并为所有真实问题保留证据。
```

```text
升级到侵入式验证，并确认已识别的问题是否真的可以利用。
```

```text
根据当前证据生成报告，并优先总结风险最高的发现。
```

---

## 📚 文档

主 README 用于操作路径，技术细节请查看 `docs/`。

- [工作流总览](docs/workflows/overview.md)
- [服务表面](docs/capabilities/service-surfaces.md)
- `docs/` 用于实现细节、能力映射和更深入的运行时说明

---

## 📜 许可证

本仓库仅用于 **教育用途** 和 **授权安全测试**。

---

<div align="center">

*为关注目标和结果，而不是命令参数和设置仪式的操作员而构建。*

</div>
