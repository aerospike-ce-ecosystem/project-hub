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

2026년 3분기(7월~9월) Aerospike CE Ecosystem 각 프로젝트별 개발 목표입니다. Q2가 운영 안정화·성능·에코시스템 자동화 명문화에 집중했다면([Q2 회고](./milestones/Q2.md) 참고), Q3는 **cross-repo 계약 정합화, UI/toolchain 현대화, Q2 미완료 항목 완성**에 집중합니다.

---

## aerospike-py

| 목표 | 설명 |
|------|------|
| 구조화된 result_code 예외 속성 도입 완료 | ADR-0027 기반으로 예외 객체에 `result_code` 등 구조화된 속성을 노출하고, cluster-manager backend와 연동하여 에러 분류·처리를 일관화 |
| aerospike-core v3 stable 추적 및 채택 평가 | 현재 `aerospike-core` v2.0.0 사용. v3 stable 릴리스 추적 및 채택 시 영향(API/성능/breaking change) 평가 |

---

## ACKO

| 목표 | 설명 |
|------|------|
| E2E 테스트 확장 (Q2 carry forward) | ADR-0044 확정 전략에 따라 scale/rolling update/ACL/dynamic config 등 시나리오별 독립 테스트 스위트와 CI matrix 병렬 실행 구현 |
| Go 모듈 경로 org 네임스페이스 정합화 | `go.mod` 모듈 경로를 org 네임스페이스(`github.com/aerospike-ce-ecosystem/...`)로 정합화하고 import 경로 일괄 갱신 |

---

## cluster-manager

| 목표 | 설명 |
|------|------|
| UI 스택 현대화 | Next.js 15, ESLint 9, CopilotKit v2 등으로 프론트엔드 toolchain 업그레이드 및 마이그레이션 |
| Record 브라우저 성능 전략 완성 (Q2 carry forward) | ADR-0048에 따라 cursor 기반 pagination(기본 모드) + virtual scroll/streaming(탐색 모드) + 3계층 timeout 통합을 구현 |
| result_code 연동 | aerospike-py 구조화된 result_code 예외 속성을 backend 에러 처리에 반영 (ADR-0027) |

---

## plugins

| 목표 | 설명 |
|------|------|
| Skill 동기화 자동화 지속 | Skill Impact Review 파이프라인(ADR-0039)을 유지하며 core repo API/CRD 변경을 skill에 지속 반영 |
| Skills 정확도 개선 | result_code·UI 스택 변경 등 Q3 변경 사항을 반영하고 skill 트리거/내용 정확도 개선 |

---

## project-hub / 에코시스템 위생

| 목표 | 설명 |
|------|------|
| CI/유지보수 위생 | GitHub Actions 버전 정렬, 워크플로우 스위트(ADR-0043) 정합성 유지, 공유 설정 표준 점검 |
| ADR 상태 정합화 | 운영 중인 시스템을 반영하도록 ADR 상태(Proposed→Accepted) 및 lifecycle 자동화(ADR-0049) 유지 |
| 릴리스 호환성 매트릭스 보강 | Release Compatibility Matrix에 Q3 릴리스 반영 및 ackoctl 컬럼 backfill |
