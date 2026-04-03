<div align="center">

# Net-Runner 🥷

### 红队评估框架

<img src="Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/许可-教育用途-red?style=for-the-badge)](#许可证)

**12 个专业代理 · 153 个红队工具 · 18 个能力包 · 10 个渗透测试技能 · 7 个工作流**

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · **中文** · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **警告**
> 只能在你已获得明确授权的目标上使用。Net-Runner 仅用于合法安全测试、实验环境和教学研究。

> **翻译说明**
> 英文版 [README.md](README.md) 是主参考文档。这个翻译刻意保持精简，避免和主文档慢慢脱节。

## 项目简介

Net-Runner 是一个毕业设计项目，也是一个结合语言模型的红队评估框架。它基于公开的 [OpenClaude](https://github.com/Gitlawb/openclaude) fork，进一步改成以工作流、证据、记忆、护栏和专业代理为核心的评估运行环境。

- 为每个项目创建 `.netrunner/` 运行目录，用来保存状态、工件、发现和报告
- 内置 Web、API、移动端、AD、WiFi、实验室和 CTF 工作流
- 通过项目记忆、代理记忆和会话摘要把有用上下文带回后续评估
- 在任务边界清楚时交给专业代理处理
- 把 MCP 保留为选择性集成层，而不是整套架构的默认中心

## 快速开始

```bash
bun install
bun run build
```

然后配置你的模型提供方并运行：

```bash
node dist/cli.mjs
```

示例：

```text
评估 https://target.example。先做侦察，梳理攻击面，验证真实问题，并持续保存证据。
```

## 主要文档

- 英文完整 README：[README.md](README.md)
- 工作方式与工作流：[docs/workflows/overview.md](docs/workflows/overview.md)
- 完整工具目录：[docs/capabilities/tool-catalog.md](docs/capabilities/tool-catalog.md)
- 与研究方向的对应关系：[docs/project/research-alignment.md](docs/project/research-alignment.md)
- 项目来源说明：[docs/project/upstream-provenance.md](docs/project/upstream-provenance.md)

## 许可证

此仓库仅用于教学用途和已授权的安全测试。
