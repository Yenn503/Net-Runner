<div align="center">

# Net-Runner 🥷

### Red Team 評価フレームワーク

<img src="../.github/assets/Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/ライセンス-教育用途-red?style=for-the-badge)](#ライセンス)

**12 の専門エージェント · 153 の Red-Team ツール · 18 の能力パック · 11 のペンテストスキル · 7 のワークフロー · 10 の APT シミュレーション**

[English](../README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · **日本語** · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **警告**
> 明示的な許可を得た対象にのみ使用してください。Net-Runner は合法なセキュリティテスト、ラボ環境、教育目的のためのものです。

> **翻訳について**
> 英語版 [README.md](README.md) が主文書です。この翻訳は内容がずれないよう、あえて短く保っています。

## 概要

Net-Runner は大学の最終年プロジェクトで、LLM がセキュリティ評価を自律的に実行できるフレームワークです。ターゲットを指定するだけで、残りは全て処理します——ワークフローの選択、専門エージェントの起動、ツールの実行、スコープの遍守、証拠の記録。公開ランタイム [OpenClaude](https://github.com/Gitlawb/openclaude) 上に構築。

- すべての証拠、発見、成果物、レポートを `.netrunner/` プロジェクトフォルダに保存
- LLM と各専門エージェントが前回のセッションで見つけた内容を記憶し、長期評価の一貫性を維持
- 特定の専門知識が必要なとき、タスクを専門エージェントに委譲
- スコープ外または許容影響レベルを超える操作をブロックまたは警告
- Web、API、モバイル、ラボ、Active Directory、WiFi、CTF 評価および APT 脅威シミュレーションに対応
- 実在の脅威アクター（APT29、Lazarus、Volt Typhoon 等）を MITRE ATT&CK にマッピングし、業界別の攻撃チェーンでシミュレーション

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
- APT シミュレーション: [docs/apt-simulation/README.md](docs/apt-simulation/README.md)
- 業界別脅威マップ: [docs/apt-simulation/industry-threat-map.md](docs/apt-simulation/industry-threat-map.md)

## ライセンス

このリポジトリは教育目的と承認されたセキュリティテスト専用です。
