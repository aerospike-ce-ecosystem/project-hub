---
title: aerospike-py Changelog
description: aerospike-py (Aerospike Python Rust binding async client) 릴리스 변경 이력
sidebar_position: 1
scope: single-repo
repos:
  - aerospike-py
tags:
  - changelog
  - aerospike-py
  - python
  - rust
  - pyo3
last_updated: 2026-03-29
---

# aerospike-py Changelog

aerospike-py 릴리스별 변경 사항을 기록합니다.

---

## v0.0.1.beta2

> Initial beta release

### 주요 변경 사항

- **Rust/PyO3 바인딩**: Rust 기반 고성능 Python 클라이언트 바인딩 구현
- **Sync/Async API**: 동기 및 비동기 API 동시 지원 (`Client` / `AsyncClient`)
- **CRUD 연산**: `put`, `get`, `delete`, `exists`, `operate` 등 기본 레코드 연산
- **Batch 연산**: `batch_read`, `batch_write`, `batch_read_numpy`, `batch_write_numpy`
- **Query/Scan**: 쿼리 및 스캔 연산 지원
- **Expression Filters**: Aerospike expression 기반 필터링
- **CDT 연산**: List, Map 등 Collection Data Type 연산
- **UDF**: User-Defined Function 등록 및 실행
- **Admin**: 사용자/역할 관리 API
- **Index 관리**: Secondary Index 생성/삭제
- **Type Stubs (.pyi)**: 전체 API에 대한 타입 스텁 완성 (IDE 자동완성 및 타입 체크 지원)
