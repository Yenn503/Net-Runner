<div align="center">

# Net-Runner 🥷

### 레드팀 평가 프레임워크

<img src="Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/라이선스-교육용-red?style=for-the-badge)](#라이선스)

**12개의 전문 에이전트 · 153개의 레드팀 도구 · 18개의 능력 팩 · 10개의 펜테스트 스킬 · 7개의 워크플로우**

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · **한국어** · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **경고**
> 명시적으로 허가받은 대상에만 사용하세요. Net-Runner는 합법적인 보안 테스트, 실습 환경, 교육 목적을 위한 도구입니다.

> **번역 안내**
> 영어판 [README.md](README.md)가 기준 문서입니다. 이 번역은 본문과 어긋나지 않도록 의도적으로 짧게 유지합니다.

## 개요

Net-Runner는 최종학년 프로젝트이자 언어 모델 지원 레드팀 평가 프레임워크입니다. 공개 fork인 [OpenClaude](https://github.com/Gitlawb/openclaude)를 기반으로, 이를 워크플로우, 증거, 메모리, 가드레일, 전문 에이전트 중심 구조로 바꿨습니다.

- 프로젝트마다 `.netrunner/` 런타임을 만들어 상태, 아티팩트, 결과, 보고서를 저장합니다
- 웹, API, 모바일, AD, WiFi, 랩, CTF 워크플로우를 제공합니다
- 프로젝트 메모리, 에이전트 메모리, 세션 요약으로 유용한 문맥을 다시 불러옵니다
- 경계가 분명한 작업은 전문 에이전트에 맡깁니다
- MCP는 필요한 통합에만 두고 기본 아키텍처로 쓰지 않습니다

## 빠른 시작

```bash
bun install
bun run build
```

그다음 모델 제공자를 설정하고 실행하세요.

```bash
node dist/cli.mjs
```

예시:

```text
https://target.example를 평가하세요. recon부터 시작해서 공격면을 정리하고, 실제 결과를 검증하고, 증거를 저장하세요.
```

## 주요 문서

- 전체 영어 README: [README.md](README.md)
- 작동 방식과 워크플로우: [docs/workflows/overview.md](docs/workflows/overview.md)
- 전체 도구 카탈로그: [docs/capabilities/tool-catalog.md](docs/capabilities/tool-catalog.md)
- 연구 정렬 문서: [docs/project/research-alignment.md](docs/project/research-alignment.md)
- 프로젝트 출처 문서: [docs/project/upstream-provenance.md](docs/project/upstream-provenance.md)

## 라이선스

이 저장소는 교육 목적과 승인된 보안 테스트에만 사용됩니다.
