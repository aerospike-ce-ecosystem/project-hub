---
title: "PR #073: Frontend Code Quality and UX Improvements"
description: K8s 마법사 1907줄을 310줄 + 8개 Step 컴포넌트로 분리하는 프론트엔드 리팩터링
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [refactor, frontend, code-quality, ux, wizard]
last_updated: 2026-03-29
---

# PR #073: Frontend Code Quality and UX Improvements

| 항목 | 내용 |
|------|------|
| **PR** | [#073](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/73) |
| **날짜** | 2026-03-03 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

1,907줄로 구성된 K8s cluster creation wizard를 310줄의 orchestrator와 독립된 Step component 여덟 개로 나눴다. 각 step을 따로 수정하고 test할 수 있게 됐다.

## 주요 변경 사항

- K8s Wizard를 1907줄에서 310줄 + 8개 Step 컴포넌트로 분리
- 각 Step 컴포넌트의 독립적 상태 관리
- 공통 UI 컴포넌트 추출 및 재사용
- UX 개선: 단계별 유효성 검증, 진행 표시기
- 컴포넌트 단위 테스트 기반 마련

## 영향 범위

Wizard step 사이의 책임이 분리돼 새 단계를 추가하거나 기존 단계를 수정할 때 영향 범위를 좁힐 수 있다. Code review와 test도 component 단위로 진행할 수 있다.
