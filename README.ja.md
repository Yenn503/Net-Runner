<div align="center">

# Net-Runner 🥷

### Red Team 評価フレームワーク

<img src="Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/ライセンス-教育用途-red?style=for-the-badge)](#ライセンス)

**12 の専門エージェント · 153 の Red-Team ツール · 18 の能力パック · 10 のペンテストスキル · 7 のワークフロー**

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · **日本語** · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **警告**
> 明示的な許可を得た対象にのみ使用してください。Net-Runner は合法なセキュリティテスト、ラボ環境、教育目的のためのものです。

> **翻訳について**
> 英語版 [README.md](README.md) が主文書です。この翻訳は内容がずれないよう、あえて短く保っています。

## 概要

Net-Runner は大学の最終年プロジェクトであり、言語モデル支援を使う Red Team 評価フレームワークです。公開 fork の [OpenClaude](https://github.com/Gitlawb/openclaude) を土台にして、workflow、証拠、メモリ、ガードレール、専門エージェントを中心に再構成しています。

- プロジェクトごとに `.netrunner/` runtime を作り、状態、成果物、finding、レポートを保持します
- Web、API、モバイル、AD、WiFi、lab、CTF 向けの workflow を使えます
- プロジェクトメモリ、エージェントメモリ、セッション要約から有用な文脈を再利用します
- 境界が明確な作業は専門エージェントに委譲します
- MCP は必要な統合だけに使い、標準アーキテクチャにはしません

## クイックスタート

```bash
bun install
bun run build
```

その後でモデルプロバイダを設定し、次を実行します。

```bash
node dist/cli.mjs
```

例:

```text
https://target.example を評価してください。まず recon から始めて、攻撃面を整理し、実在する finding を検証し、証拠を保存してください。
```

## 主なドキュメント

- 英語版の完全な README: [README.md](README.md)
- 仕組みと workflow: [docs/workflows/overview.md](docs/workflows/overview.md)
- 完全なツールカタログ: [docs/capabilities/tool-catalog.md](docs/capabilities/tool-catalog.md)
- 研究との整合: [docs/project/research-alignment.md](docs/project/research-alignment.md)
- プロジェクトの出自: [docs/project/upstream-provenance.md](docs/project/upstream-provenance.md)

## ライセンス

このリポジトリは教育目的と承認されたセキュリティテスト専用です。
