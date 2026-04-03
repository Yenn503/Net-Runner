<div align="center">

# Net-Runner 🥷

### 红队评估框架

<img src="Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/许可-教育用途-red?style=for-the-badge)](#许可证)

**12 个专业代理 · 153 个红队工具 · 18 个能力包 · 11 个渗透测试技能 · 7 个工作流 · 10 个 APT 模拟**

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · **中文** · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **警告**
> 只能在你已获得明确授权的目标上使用。Net-Runner 仅用于合法安全测试、实验环境和教学研究。

> **翻译说明**
> 英文版 [README.md](README.md) 是主参考文档。这个翻译刻意保持精简，避免和主文档慢慢脱节。

## 项目简介

Net-Runner 是一个毕业设计项目，让 LLM 能够自主运行安全评估。给它一个目标，它会处理其余的一切——选择工作流、启动专业代理、运行工具、执行范围控制并记录证据。基于公开的 [OpenClaude](https://github.com/Gitlawb/openclaude) 运行时构建。

- 所有证据、发现、工件和报告都保存在 `.netrunner/` 项目文件夹中
- LLM 和每个专业代理都会记住上次会话中发现的内容，让长期评估保持连贯
- 需要特定领域专业知识时，将任务委派给专业代理
- 阻止或标记任何超出范围或超过允许影响级别的操作
- 支持 Web、API、移动端、实验室、Active Directory、WiFi、CTF 评估和 APT 威胁模拟
- 模拟真实威胁行为者（APT29、Lazarus、Volt Typhoon 等），映射到 MITRE ATT&CK，按行业提供攻击链

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
- APT 模拟参考：[docs/apt-simulation/README.md](docs/apt-simulation/README.md)
- 行业威胁地图：[docs/apt-simulation/industry-threat-map.md](docs/apt-simulation/industry-threat-map.md)

## 许可证

此仓库仅用于教学用途和已授权的安全测试。
