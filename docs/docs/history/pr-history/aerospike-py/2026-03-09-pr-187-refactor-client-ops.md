---
title: "PR #187: Extract client_ops.rs"
description: Major refactor extracting operation implementations into dedicated module with ~1,200 lines dedup
scope: single-repo
repos: [aerospike-py]
tags: [refactor, rust, otel, code-quality]
last_updated: 2026-03-29
---

# PR #187: Extract client_ops.rs

| 항목 | 내용 |
|------|------|
| **PR** | [#187](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/187) |
| **날짜** | 2026-03-09 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

Client 구현체에서 작업(operation) 구현부를 `client_ops.rs`라는 전용 모듈로 추출하여 약 1,200줄의 중복 코드를 제거했다. OtelContext를 정리하고 unsafe lint를 적용하여 코드 안전성과 유지보수성을 크게 향상시켰다.

## 주요 변경 사항

- `client_ops.rs` 모듈 추출로 작업 구현 코드 분리
- ~1,200줄의 중복 코드 제거 (Client/AsyncClient 간 공유)
- OtelContext 구조 정리 및 일관된 사용 패턴 수립
- unsafe 코드 블록에 대한 lint 적용 및 안전성 검증

## 영향 범위

내부 Rust 코드 구조 변경으로, 외부 Python API에는 영향 없음. Rust 코드를 직접 수정하는 기여자에게 영향이 있으며, Client와 AsyncClient의 작업 구현이 단일 모듈에서 관리되어 향후 새 작업 추가가 용이해졌다.
