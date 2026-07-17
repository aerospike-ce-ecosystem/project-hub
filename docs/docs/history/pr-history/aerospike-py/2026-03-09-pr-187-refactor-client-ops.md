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

Public Python API는 바뀌지 않지만 Rust contributor의 작업 위치는 달라진다. `Client`와 `AsyncClient` operation을 하나의 module에서 관리하므로 새 operation을 두 번 구현할 필요가 줄었다.
