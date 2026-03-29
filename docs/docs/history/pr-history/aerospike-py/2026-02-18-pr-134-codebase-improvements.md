---
title: "PR #134: Comprehensive Codebase Improvements"
description: Extract shared logic to client_common.rs (~900 lines dedup) and add expression helpers
scope: single-repo
repos: [aerospike-py]
tags: [refactor, rust, dedup, expression, code-quality]
last_updated: 2026-03-29
---

# PR #134: Comprehensive Codebase Improvements

| 항목 | 내용 |
|------|------|
| **PR** | [#134](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/134) |
| **날짜** | 2026-02-18 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

Client와 AsyncClient 간 공유 로직을 `client_common.rs`로 추출하여 약 900줄의 중복 코드를 제거하고, expression 헬퍼 함수를 정비하여 코드베이스 전반의 유지보수성을 크게 향상시켰다.

## 주요 변경 사항

- `client_common.rs` 모듈 생성 및 공유 로직 추출 (~900줄 중복 제거)
- Expression 헬퍼 함수 정리 및 재사용 가능한 유틸리티로 분리
- Client/AsyncClient 간 일관된 코드 패턴 수립
- 코드 구조 개선을 통한 향후 기능 추가 용이성 확보

## 영향 범위

내부 Rust 코드 구조 변경으로 외부 Python API에는 영향 없음. 동기/비동기 클라이언트의 핵심 로직이 단일 모듈에서 관리되어 버그 수정과 기능 추가 시 양쪽을 동시에 반영할 수 있게 되었다.
