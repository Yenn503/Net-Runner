<div align="center">

# Net-Runner 🥷

### エージェント型レッドチーム評価フレームワーク

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/ライセンス-教育利用-red?style=for-the-badge)](#ライセンス)

**12 の専門エージェント · 141 の Red-Team ツール · 17 の能力パック · 10 のペンテストスキル · 6 のワークフロー**

*自然に話せば大丈夫です。あとは Net-Runner が処理します。*

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · **日本語** · [한국어](README.ko.md) · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **警告**
> 明示的に許可された対象に対してのみ使用してください。Net-Runner は、合法かつ許可されたセキュリティテストと教育用途のために設計されています。

> **翻訳メモ**
> 英語版 (`README.md`) がプロジェクト説明と現在の研究方針の基準です。この翻訳は読みやすさのための補助であり、更新が遅れる場合があります。

## 🔍 Net-Runner とは

Net-Runner は、自然言語で操作できるマルチエージェント型のセキュリティテストフレームワークです。

LLM を接続し、対象と目的を普通の言葉で伝えると、Net-Runner が全体の実行エンジンを動かします。

- 評価の意図を判定する
- プロジェクト単位の `.netrunner/` 実行領域を作る
- スコープとワークフローの文脈をセッションへ注入する
- 必要に応じて専門エージェントへ作業を振り分ける
- 評価の進行中に証拠、メモリ、レポートを保存する

```text
やりたいことを伝える。
Net-Runner が計画し、委任し、実行し、記憶し、報告する。
```

---

## ✨ 使われる理由

- **自然言語ファースト** — 開始のためにコマンドを覚える必要がない
- **ひとつの統合フロー** — エージェント、ツール、証拠、メモリ、レポートが同じ流れで動く
- **専門エージェント** — Recon、Web、API、Network、Exploit、AD、Retest、Evidence、Reporting が最初から接続済み
- **永続メモリ** — RAG ベースの取得でセッションをまたいで有用な文脈を呼び戻せる
- **証拠優先** — 発見、実行手順、承認、レポートが同じ engagement に紐づく

---

## 🚀 ここから始める

### 1. インストールとビルド

```bash
bun install
bun run build
```

### 2. モデルを接続する

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

#### OpenAI 互換 API

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_BASE_URL="https://your-provider.com/v1"
export OPENAI_MODEL="your-model"
node dist/cli.mjs
```

### 3. 自然に話す

```text
https://target.example を評価してください。まず偵察を行い、主要な攻撃面を見つけ、可能性の高い問題を検証しながら証拠を残してください。
```

Net-Runner は対象を判定し、engagement を開始し、適切な文脈を注入して agentic runtime を動かし始めます。

---

## ⚙️ 仕組み

```text
あなた
  ↓
メインの LLM セッション
  ↓
Net-Runner のランタイム文脈
  ↓
専門エージェント + ツール + メモリ + 証拠
  ↓
構造化された評価結果
```

| ステップ | Net-Runner が行うこと |
|---------|------------------------|
| **1. 検出** | 評価意図、対象タイプ、適切なワークフローを判断する |
| **2. 起動** | まだなければ engagement 用の `.netrunner/` 状態を作成する |
| **3. 注入** | スコープ、影響境界、ワークフロー、既定スキルを現在のセッションへ追加する |
| **4. ルーティング** | メイン runtime と専門エージェントを組み合わせて使い、コマンドの細かい管理を不要にする |
| **5. 保護** | 破壊的、永続的、または範囲外の操作に内部ガードレールを適用する |
| **6. 記録** | 証拠、実行手順、発見、レビュー、メモリ、レポートを同じ環境に保存する |

通常の流れでは、次のようなことができます。

- 対象を伝える
- どの種類の評価を走らせるか伝える
- 続行、深掘り、再検証、要約、レポート生成を依頼する
- すでに使える環境、ツール、メモリ、エージェントをそのまま使わせる

---

## 🕵️ エージェント

Net-Runner は元の汎用 agentic フローを保ちつつ、その上に専門的なセキュリティ役割を追加します。

| エージェント | 役割 |
|:-------------|:-----|
| **Engagement Lead** | 評価全体を統括し、ワークフロー段階を選び、作業を振り分ける |
| **Recon Specialist** | ホスト、サービス、サブドメイン、技術、攻撃面を見つける |
| **Web Testing Specialist** | ルート、パラメータ、認証フロー、Web 脆弱性を検証する |
| **API Testing Specialist** | API、スキーマ、JWT、IDOR 経路、状態遷移を検証する |
| **Network Testing Specialist** | サービス列挙、ネットワーク検証、ホストレベルのテストを担当する |
| **Exploit Specialist** | 実際の影響を制御付きで検証する |
| **Privilege Escalation Specialist** | 初期アクセス後の権限昇格経路を扱う |
| **Lateral Movement Specialist** | ピボット、信頼経路、複数ホスト間移動を扱う |
| **AD Specialist** | Active Directory と Kerberos に集中する |
| **Retest Specialist** | 発見を再現し、修正を検証する |
| **Evidence Specialist** | 成果物と追跡可能な証拠を整理する |
| **Reporting Specialist** | 証拠を明確なレポートへまとめる |

`general-purpose`、`Explore`、`Plan`、`verification` などのコア runtime エージェントも引き続きシステムに含まれます。

---

## 🧱 プロジェクト構造

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

- `engagement.json` — 現在のワークフロー、対象、影響境界、制約
- `run-state.json` — 実行手順と保留中レビュー
- `evidence/` — append-only の証拠台帳
- `findings/` — 構造化された発見出力
- `reports/` — 生成された評価レポート
- `artifacts/` — 収集された出力と補助ファイル
- `memory/` — オペレーター、チーム、エージェントの永続メモリ
- `instructions/` — プロジェクト単位のランタイム指示

---

## 💬 プロンプト例

```text
https://target.example を評価し、外部攻撃面をマッピングしてください。
```

```text
現在の engagement を続け、認証の弱点に集中し、実在する問題の証拠を残してください。
```

```text
侵入的な検証に進み、特定された問題が本当に悪用可能か確認してください。
```

```text
現在の証拠からレポートを生成し、最もリスクの高い発見から先に要約してください。
```

---

## 📚 ドキュメント

この README は運用開始用です。技術的な詳細は `docs/` を参照してください。

- [ワークフロー概要](docs/workflows/overview.md)
- [サービスサーフェス](docs/capabilities/service-surfaces.md)
- `docs/` には実装詳細、能力マッピング、より深いランタイムノートがあります

---

## 📜 ライセンス

このリポジトリは **教育用途** と **許可されたセキュリティテスト** のみを対象としています。

---

<div align="center">

*フラグや設定儀式ではなく、対象と結果で考えるオペレーターのために作られています。*

</div>
