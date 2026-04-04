<div align="center">

# Net-Runner 🥷

### 레드팀 평가 프레임워크

<img src="../Futuristic%20NetRunners%20logo%20with%20cyberpunk%20figure.png" alt="Net-Runners cyberpunk logo" width="720" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/라이선스-교육용-red?style=for-the-badge)](#라이선스)

**12개의 전문 에이전트 · 153개의 레드팀 도구 · 18개의 능력 팩 · 11개의 펜테스트 스킬 · 7개의 워크플로우 · 10개의 APT 시뮬레이션**

[English](../README.md) · [Español](README.es.md) · [Français](README.fr.md) · [中文](README.zh.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · **한국어** · [हिन्दी](README.hi.md) · [Deutsch](README.de.md)

---

</div>

> ⚠️ **경고**
> 명시적으로 허가받은 대상에만 사용하세요. Net-Runner는 합법적인 보안 테스트, 실습 환경, 교육 목적을 위한 도구입니다.

> **번역 안내**
> 영어판 [README.md](README.md)가 기준 문서입니다. 이 번역은 본문과 어긋나지 않도록 의도적으로 짧게 유지합니다.

## 개요

Net-Runner는 최종학년 프로젝트로, LLM이 보안 평가를 자율적으로 실행할 수 있게 해줍니다. 대상을 지정하면 나머지는 알아서 처리합니다 — 워크플로우 선택, 전문 에이전트 실행, 도구 작동, 범위 준수, 증거 기록. 공개 런타임 [OpenClaude](https://github.com/Gitlawb/openclaude) 위에 구축되었습니다.

- 모든 증거, 결과, 아티팩트, 보고서를 `.netrunner/` 프로젝트 폴더에 저장
- LLM과 각 전문 에이전트가 이전 세션에서 발견한 내용을 기억하여 장기 평가의 일관성 유지
- 특정 전문 지식이 필요할 때 전문 에이전트에 작업 위임
- 범위 밖 또는 허용 영향 수준을 초과하는 작업을 차단 또는 경고
- 웹, API, 모바일, 랩, Active Directory, WiFi, CTF 평가 및 APT 위협 시뮬레이션 지원
- 실제 위협 행위자(APT29, Lazarus, Volt Typhoon 등)를 MITRE ATT&CK에 매핑하여 산업별 공격 체인으로 시뮬레이션

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
- APT 시뮬레이션: [docs/apt-simulation/README.md](docs/apt-simulation/README.md)
- 산업별 위협 맵: [docs/apt-simulation/industry-threat-map.md](docs/apt-simulation/industry-threat-map.md)

## 라이선스

이 저장소는 교육 목적과 승인된 보안 테스트에만 사용됩니다.
