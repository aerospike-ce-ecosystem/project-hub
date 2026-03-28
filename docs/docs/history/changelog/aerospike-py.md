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

## Unreleased (after v0.0.4)

### Features
- **Consolidated improvements**: Exception handler, backpressure retry, observability endpoints (PR #232)
- **Unified BatchRecords API**: All batch operations now return `BatchRecords` NamedTuple with per-record result codes (PR #239)

### Bug Fixes
- **Batch result codes**: Preserve per-record result codes in batch operations (PR #239)
- **NumPy key digest**: Fix numpy key digest issues for bytes keys (PR #239)
- **Test cluster_name**: Make test cluster_name configurable via env var (PR #230)

### CI/CD
- **IssueOps redesign**: Plan-first IssueOps/CommentOps workflow (PR #216)
- **gh-aw upgrade**: Upgraded claude-code-action from 0.43.4 to 0.64.0
- **Docs memory**: Increase Node.js memory for docs build

---

aerospike-py 릴리스별 변경 사항을 기록합니다.

---

## v0.0.4 (2026-03-22)

### Features
- **Skills 통합**: 6개 api-* skill을 단일 aerospike-py skill로 통합 (PR #204)
- **Backpressure**: Semaphore 기반 operation-level backpressure 추가 (PR #213)
- **IssueOps**: gh-aw IssueOps + CommentOps workflows 추가 (PR #208)

### Bug Fixes
- **BatchRecord/BatchRecords**: NamedTuple 변환 및 문서/테스트 개편 (PR #205, #206)

### Infrastructure
- **aerospike-core**: alpha.9 -> alpha.10 업그레이드 + sync node lookup 리팩토링 (PR #218)
- **IssueOps 재설계**: Plan-first workflow 전환 (PR #216)
- **Integration tests**: get_node_names 테스트 및 async docs 수정 (PR #219)

---

## v0.0.3 (2026-03-09)

### Features
- **conn_pools_per_node**: Connection pools 설정 노출 및 에러 핸들링 문서 확장 (PR #193)
- **HyperLogLog CDT**: HLL operation helpers 추가 (PR #194)
- **Bitwise CDT**: Bitwise operation helpers 추가 (PR #195)

### Improvements
- **Project restructure**: 프로젝트 구조, 타입 안전성, 테스팅, 문서 개선 (PR #180)
- **client_ops.rs 추출**: OtelContext, unsafe lint 등 ~1,200줄 중복 제거 (PR #187)
- **Test expansion**: Concurrency tests 23->45, Property-based tests 17->36 확장 (PR #189, #190)

### Bug Fixes
- **bytes key digest**: Official client 호환성 수정 (PR #170)
- **bit_operations test**: op codes 및 Rust formatting 수정 (PR #201)
- **Podman support**: sample-fastapi Podman 지원 및 테스트 수정 (PR #181)

### Documentation
- **Architecture overview**: 아키텍처 개요 및 트러블슈팅 가이드 추가 (PR #188)
- **FAQ/API 비교**: FAQ 및 API comparison guide 추가 (PR #192)

---

## v0.0.2 (2026-03-07)

### Features
- **Double GIL 제거**: GIL 이중 획득 제거 및 metrics toggle API 추가 (PR #165)

### Improvements
- **CI hardening**: NumPy safety, async_client factory, 프로젝트 인프라 개선 (PR #156)
- **Test deduplication**: parametrize 및 sync/async invoke helper로 테스트 중복 제거 (PR #171)

### Bug Fixes
- **bytes key digest**: Official client와 호환성 수정 (PR #170)
- **Input validation**: policy/query/numpy 변환 경로 입력 검증 강화 (PR #177)
- **NumPy batch write**: batch write 변환 안정화 (PR #178)

### Documentation
- **Benchmark dashboard**: 성능 시각화 및 3-category 레이아웃 재설계 (PR #166, #169)
- **Korean translations**: 완전한 한국어 번역 및 영어 기본 설정 (PR #167)
- **Brand theme**: Aerospike 브랜드 테마 적용 (PR #168)

---

## v0.0.1 (2026-02-26)

> First stable release (post-beta)

### 주요 변경 사항
- Beta2에서 발견된 안정성 이슈 수정
- 문서화 완성
- PyPI 릴리스 파이프라인 구축

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
