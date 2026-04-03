<div align="center">

# Net-Runner 🥷

### 에이전트형 레드팀 평가 프레임워크

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/라이선스-교육용-red?style=for-the-badge)](#라이선스)

**12개의 전문 에이전트 · 141개의 레드팀 도구 · 17개의 능력 팩 · 10개의 펜테스트 스킬 · 6개의 워크플로우**

*자연스럽게 말하면 됩니다. 나머지는 Net-Runner가 처리합니다.*

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · **한국어** · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **경고**
> 명시적으로 허가받은 대상에 대해서만 사용해야 합니다. Net-Runner는 합법적이고 승인된 보안 테스트와 교육용으로 설계되었습니다.

> **번역 메모**
> 영어판 (`README.md`) 이 프로젝트 설명과 현재 연구 방향의 기준 문서입니다. 이 번역본은 읽기 편의를 위한 것이며 메인 문서보다 늦게 갱신될 수 있습니다.

## 🔍 Net-Runner란

Net-Runner는 자연어로 운용할 수 있도록 설계된 멀티 에이전트 보안 테스트 프레임워크입니다.

LLM을 연결하고 대상과 목표를 일반적인 언어로 설명하면 Net-Runner가 전체 엔진을 가동합니다.

- 평가 의도를 감지합니다
- 프로젝트 범위의 `.netrunner/` 런타임 디렉터리를 만듭니다
- 범위와 워크플로 컨텍스트를 세션에 주입합니다
- 필요할 때 전문 에이전트로 작업을 라우팅합니다
- 평가가 진행되는 동안 증거, 메모리, 보고서를 기록합니다

```text
할 일을 설명합니다.
Net-Runner가 계획하고, 위임하고, 실행하고, 기억하고, 보고합니다.
```

---

## ✨ 사람들이 쓰는 이유

- **자연어 우선** — 시작하려고 명령을 외울 필요가 없습니다
- **하나의 인라인 시스템** — 에이전트, 도구, 증거, 메모리, 보고서가 같은 흐름 안에서 동작합니다
- **전문 에이전트** — 정찰, 웹, API, 네트워크, 익스플로잇, AD, 재검증, 증거, 보고 역할이 이미 연결돼 있습니다
- **지속 메모리** — 유용한 컨텍스트를 RAG 기반 검색으로 세션 간 다시 불러올 수 있습니다
- **증거 우선 운영** — 발견사항, 실행 단계, 승인, 보고서가 같은 engagement에 묶여 있습니다

---

## 🚀 여기서 시작하세요

### 1. 설치 및 빌드

```bash
bun install
bun run build
```

### 2. 모델 연결

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

#### OpenAI 호환 API

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_BASE_URL="https://your-provider.com/v1"
export OPENAI_MODEL="your-model"
node dist/cli.mjs
```

### 3. 자연스럽게 말하세요

```text
https://target.example를 평가하세요. 정찰부터 시작하고, 주요 공격면을 찾고, 가능성이 높은 문제를 검증하면서 증거를 남기세요.
```

Net-Runner가 대상을 감지하고 engagement를 시작한 뒤 올바른 컨텍스트를 주입하고 agentic runtime을 실행합니다.

---

## ⚙️ 어떻게 동작하는가

```text
사용자
  ↓
메인 LLM 세션
  ↓
Net-Runner 런타임 컨텍스트
  ↓
전문 에이전트 + 도구 + 메모리 + 증거
  ↓
구조화된 평가 결과
```

| 단계 | Net-Runner가 하는 일 |
|------|----------------------|
| **1. 감지** | 평가 의도, 대상 유형, 가장 적합한 워크플로를 파악합니다 |
| **2. 부트스트랩** | 아직 없다면 해당 engagement용 `.netrunner/` 상태를 만듭니다 |
| **3. 주입** | 범위, 영향 경계, 워크플로, 기본 스킬을 현재 세션에 추가합니다 |
| **4. 라우팅** | 메인 런타임과 전문 에이전트를 함께 사용해 명령을 세세하게 관리할 필요를 줄입니다 |
| **5. 보호** | 파괴적이거나 지속적이거나 범위를 벗어난 행동에 내부 가드레일을 적용합니다 |
| **6. 기록** | 증거, 실행 단계, 발견사항, 리뷰, 메모리, 보고서를 같은 상태 안에 저장합니다 |

일반적인 흐름에서는 다음을 할 수 있습니다.

- 대상을 알려주기
- 어떤 평가를 실행할지 말하기
- 계속 진행, 심화, 재검증, 요약, 보고를 요청하기
- 이미 사용 가능한 환경, 도구, 메모리, 에이전트를 그대로 활용하게 두기

---

## 🕵️ 에이전트

Net-Runner는 원래의 일반 agentic 흐름을 유지하면서 그 위에 보안 전문 역할을 추가합니다.

| 에이전트 | 역할 |
|:---------|:-----|
| **Engagement Lead** | 평가를 총괄하고 워크플로 단계를 고르며 작업을 라우팅합니다 |
| **Recon Specialist** | 호스트, 서비스, 서브도메인, 기술 스택, 공격면을 찾습니다 |
| **Web Testing Specialist** | 경로, 파라미터, 인증 흐름, 웹 취약점을 테스트합니다 |
| **API Testing Specialist** | API, 스키마, JWT, IDOR 경로, 상태 전이를 테스트합니다 |
| **Network Testing Specialist** | 서비스 열거, 네트워크 검증, 호스트 수준 테스트를 담당합니다 |
| **Exploit Specialist** | 실제 영향을 통제된 방식으로 검증합니다 |
| **Privilege Escalation Specialist** | 초기 접근 후 권한 상승 경로를 다룹니다 |
| **Lateral Movement Specialist** | 피벗, 신뢰 경로, 다중 호스트 이동을 다룹니다 |
| **AD Specialist** | Active Directory와 Kerberos에 집중합니다 |
| **Retest Specialist** | 발견사항을 재현하고 수정 여부를 검증합니다 |
| **Evidence Specialist** | 아티팩트와 추적 가능한 증거를 정리합니다 |
| **Reporting Specialist** | 증거를 깔끔한 보고서로 바꿉니다 |

`general-purpose`, `Explore`, `Plan`, `verification` 같은 코어 런타임 에이전트도 계속 시스템 안에 남아 있습니다.

---

## 🧱 프로젝트 구조

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

- `engagement.json` — 현재 워크플로, 대상, 영향 경계, 제한 사항
- `run-state.json` — 실행 단계와 대기 중인 리뷰
- `evidence/` — append-only 증거 원장
- `findings/` — 구조화된 발견사항 출력
- `reports/` — 생성된 평가 보고서
- `artifacts/` — 수집된 출력과 보조 파일
- `memory/` — 운영자, 팀, 에이전트의 지속 메모리
- `instructions/` — 프로젝트 범위 런타임 지침

---

## 💬 예시 프롬프트

```text
https://target.example를 평가하고 외부 공격면을 매핑하세요.
```

```text
현재 engagement를 계속 진행하고, 인증 취약점에 집중하며, 실제 문제에 대한 증거를 남기세요.
```

```text
침투적 검증 단계로 높이고, 식별된 문제가 실제로 악용 가능한지 확인하세요.
```

```text
현재 증거를 바탕으로 보고서를 생성하고, 가장 위험한 발견사항부터 요약하세요.
```

---

## 📚 문서

이 README는 운영자 경로용입니다. 기술 세부사항은 `docs/`를 참고하세요.

- [워크플로 개요](docs/workflows/overview.md)
- [서비스 서피스](docs/capabilities/service-surfaces.md)
- `docs/`에는 구현 세부사항, 능력 매핑, 더 깊은 런타임 노트가 있습니다

---

## 📜 라이선스

이 저장소는 **교육 목적**과 **승인된 보안 테스트**에만 사용됩니다.

---

<div align="center">

*플래그나 설정 의식이 아니라 대상과 결과 중심으로 생각하는 운영자를 위해 만들었습니다.*

</div>
