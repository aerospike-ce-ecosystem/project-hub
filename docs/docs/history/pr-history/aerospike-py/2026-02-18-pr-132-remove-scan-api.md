---
title: "PR #132: Remove Deprecated Scan API"
description: Remove entire Scan API from codebase, consolidating scan functionality into Query API
scope: single-repo
repos: [aerospike-py]
tags: [refactor, breaking-change, scan, api]
last_updated: 2026-03-29
---

# PR #132: Remove Deprecated Scan API

| 항목 | 내용 |
|------|------|
| **PR** | [#132](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/132) |
| **날짜** | 2026-02-18 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

더 이상 사용되지 않는(deprecated) Scan API를 코드베이스에서 완전히 제거했다. Aerospike CE 8.x에서 scan 기능이 Query API로 통합됨에 따라, 별도의 Scan 모듈과 관련 코드를 삭제하여 API 표면을 간소화했다.

## 주요 변경 사항

- Scan 관련 Rust 모듈 및 PyO3 바인딩 전체 삭제
- Scan 관련 Python 인터페이스 및 타입 정의 제거
- Scan 테스트 코드 삭제
- 문서에서 Scan API 참조 정리

## 영향 범위

Scan API를 직접 사용하던 코드는 Query API로 마이그레이션이 필요한 breaking change다. scan() 호출을 query()로 전환해야 하며, 파티션 필터를 통한 전체 네임스페이스 스캔은 Query API에서 동일하게 지원된다.
