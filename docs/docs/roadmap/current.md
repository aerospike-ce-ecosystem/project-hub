---
title: 현재 분기 목표 (2026-Q3)
description: Aerospike CE Ecosystem 2026년 3분기 개발 목표 및 우선순위
sidebar_position: 1
scope: ecosystem
repos:
  - aerospike-py
  - acko
  - cluster-manager
  - plugins
tags:
  - roadmap
  - q3-2026
  - goals
  - planning
last_updated: 2026-07-17
---

# 2026-Q3 목표

2026년 3분기(7월~9월)에는 **cross-repo 계약 정합화, UI/toolchain 현대화, Q2 미완료 항목 마무리**에 집중합니다. Q2에는 운영 안정성과 성능을 개선하고 에코시스템 자동화 기준을 문서화했습니다. 자세한 내용은 [Q2 회고](./milestones/Q2.md)에서 확인할 수 있습니다.

---

## aerospike-py

| 목표 | 설명 |
|------|------|
| 구조화된 `result_code` 예외 속성 도입 완료 | ADR-0027에 따라 예외 객체에 `result_code` 등의 구조화된 속성을 노출합니다. cluster-manager backend도 이 속성을 사용해 오류를 일관되게 분류하고 처리하도록 맞춥니다. |
| aerospike-core v3 stable 추적 및 채택 평가 | 현재 사용하는 `aerospike-core` v2.0.0과 v3 stable을 비교합니다. 업그레이드가 API, 성능, breaking change에 미치는 영향을 확인한 뒤 채택 여부를 결정합니다. |

---

## ACKO

| 목표 | 설명 |
|------|------|
| E2E 테스트 확장 (Q2 carry forward) | ADR-0044에 따라 scale, rolling update, ACL, dynamic config를 독립된 테스트 시나리오로 구성합니다. CI matrix에서는 이 시나리오들을 병렬로 실행합니다. |
| Go 모듈 경로 org 네임스페이스 정합화 | `go.mod`와 import 경로를 `github.com/aerospike-ce-ecosystem/...` 네임스페이스로 통일합니다. |

---

## cluster-manager

| 목표 | 설명 |
|------|------|
| UI 스택 현대화 | 프론트엔드 toolchain을 Next.js 15, ESLint 9, CopilotKit v2 등으로 업그레이드합니다. |
| Record 브라우저 성능 전략 완성 (Q2 carry forward) | ADR-0048에 따라 기본 모드에는 cursor 기반 pagination을, 탐색 모드에는 virtual scroll/streaming을 적용합니다. 세 단계로 나뉜 timeout 처리도 하나의 정책으로 통합합니다. |
| `result_code` 연동 | aerospike-py가 제공하는 구조화된 `result_code`를 backend 오류 처리에 반영합니다(ADR-0027). |

---

## plugins

| 목표 | 설명 |
|------|------|
| Skill 동기화 자동화 지속 | Skill Impact Review 파이프라인(ADR-0039)을 유지합니다. core repo의 API나 CRD가 바뀌면 관련 Skill에도 변경 사항을 반영합니다. |
| Skills 정확도 개선 | `result_code`와 UI 스택 변경 등 Q3 작업을 반영하고, Skill의 trigger와 설명이 실제 동작과 일치하는지 점검합니다. |

---

## project-hub / 에코시스템 위생

| 목표 | 설명 |
|------|------|
| CI/유지보수 위생 | GitHub Actions 버전과 워크플로우 구성을 정리하고, 공유 설정이 ADR-0043의 기준을 따르는지 점검합니다. |
| ADR 상태 정합화 | 실제 운영 상태에 맞춰 ADR을 `Proposed`에서 `Accepted`로 전환하고, ADR lifecycle 자동화(ADR-0049)를 유지합니다. |
| 릴리스 호환성 매트릭스 보강 | Release Compatibility Matrix에 Q3 릴리스를 추가하고, 이전 릴리스의 ackoctl 정보를 보완합니다. |
