---
title: "PR #131: Unified Cluster List"
description: Unified cluster list view with code dedup and type-checking hooks
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, ui, code-quality, type-checking]
last_updated: 2026-03-29
---

# PR #131: Unified Cluster List

| 항목 | 내용 |
|------|------|
| **PR** | [#131](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/131) |
| **날짜** | 2026-03-19 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

클러스터 목록을 통합된 뷰로 재구성하고, 중복 코드를 제거하며, 타입 체킹 훅을 도입했다. 이전에 분산되어 있던 클러스터 표시 로직을 하나로 통합하여 일관된 사용자 경험을 제공한다.

## 주요 변경 사항

- 통합 클러스터 목록 UI: 직접 연결 및 ACKO 관리 클러스터 통합 표시
- 클러스터 상태별 필터링 및 검색
- 코드 중복 제거: 공통 컴포넌트 추출
- Pre-commit 타입 체킹 훅 도입 (pyright/mypy)

## 영향 범위

Cluster Manager UI 전반에 영향. 여러 클러스터를 관리하는 환경에서 통합된 뷰를 통해 전체 인프라 상황을 한눈에 파악할 수 있다. 타입 체킹 훅으로 코드 품질과 안정성이 향상된다.
