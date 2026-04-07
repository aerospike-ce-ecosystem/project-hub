---
title: "ADR-0039: NumPy Batch 연산 인터페이스 확정 — Owned Arrays 기본 메모리 모델"
description: aerospike-py의 NumPy batch 연산에서 Owned Arrays를 기본 메모리 모델로 확정하고, API surface를 안정화하는 아키텍처 결정.
sidebar_position: 39
scope: single-repo
repos: [aerospike-py]
tags: [adr, numpy, batch, memory-model, pyo3, aerospike-py, zero-copy]
last_updated: 2026-04-07
---

# ADR-0039: NumPy Batch 연산 인터페이스 확정 — Owned Arrays 기본 메모리 모델

## 상태

**Proposed**

- 제안일: 2026-04-07
- 관련 이슈: aerospike-ce-ecosystem/project-hub#52
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Q2 2026 로드맵에 "NumPy batch 연산 안정화"가 명시되어 있으며, 프로젝트 목표 1-3에서도 `batch_read_numpy`, `batch_write_numpy` 스펙의 개선과 유지보수를 명확히 요구하고 있습니다.

현재 aerospike-py는 NumPy 통합을 상당 수준 구현했으나, 핵심 API가 확정되지 않은 상태입니다:

### 현재 구현 현황
- **Rust 측**: `numpy_support.rs` (1,646줄) — PyO3/numpy 크레이트 기반 변환 로직
- **Python 측**: `numpy_batch.py` — `NumpyBatchRecords` 클래스, structured array 변환
- **API**: `batch_read_numpy()`, `batch_write_numpy()` — 표준 batch API의 NumPy 변환 버전

### 확정이 필요한 핵심 기술 과제
1. **메모리 모델**: Rust → Python 데이터 전달 시 zero-copy vs copy 선택
2. **dtype 추론**: Aerospike bin 타입 → NumPy dtype 자동 매핑 (int, float, str, bytes, list, map)
3. **부분 실패 처리**: batch 연산에서 일부 레코드 실패 시 structured array 표현 방법
4. **Mixed-type bins**: 같은 bin에 int/str 혼재 시 dtype 결정 전략

이 결정은 aerospike-py의 data science 워크플로우 지원에 직접적인 영향을 미치며, API가 확정되면 이후 breaking change 없이 장기 유지보수가 가능해야 합니다.

## 결정 (Decision)

> **Owned Arrays (데이터 복사)를 기본 메모리 모델로 확정하고, 고급 사용자를 위한 zero-copy 옵트인은 추후 별도 ADR에서 검토한다.**

### 핵심 결정 사항

1. **메모리 모델**: Rust에서 NumPy array로 데이터를 복사(owned)하여 전달. Python 측에서 완전한 소유권을 가지며, Rust 측 메모리와 독립적으로 GC 관리됨.

2. **API surface**: `batch_read_numpy()`, `batch_write_numpy()`를 공식 API로 확정. ADR-0009의 `BatchRecords` 패턴과 일관된 반환 구조를 유지.

3. **선택적 의존성**: NumPy는 optional dependency로 제공 (`pip install aerospike-py[numpy]`), 기본 설치에는 포함하지 않음.

### 근거

- **ADR-0001 일관성**: PyO3를 선택한 핵심 이유가 메모리 안전성이었음. Zero-copy는 `unsafe` 코드를 증가시켜 이 철학에 반함.
- **성능 충분성**: 대부분의 사용 사례에서 데이터 복사 오버헤드는 Aerospike 서버와의 네트워크 latency 대비 무시할 수 있는 수준.
- **예측 가능성**: Hybrid(크기 기반 자동 선택)보다 일관된 동작을 보장하여 디버깅이 용이.

## 대안 (Alternatives Considered)

### Option A: Zero-copy Views (성능 우선)

- **설명**: Rust 메모리를 Python에서 직접 참조하여 복사 없이 최고 성능 달성
- **장점**: 메모리 사용량 최소화, 대용량 데이터에서 최고 성능
- **단점**: 
  - `unsafe` 코드 증가로 메모리 안전성 리스크
  - GC 복잡성 — Rust lifetime과 Python GC 간 조율 필요
  - PyO3 경계에서의 lifetime 관리가 매우 어려움
- **미선택 사유**: ADR-0001에서 확립한 "메모리 안전성 우선" 원칙에 위배. `unsafe` 블록이 증가하면 Rust 선택의 핵심 가치가 훼손됨.

### Option B: Owned Arrays (안전성 우선) ← **채택**

- **설명**: Rust에서 NumPy array로 데이터를 복사하여 전달
- **장점**: 
  - 명확한 소유권 — Python GC가 독립적으로 관리
  - `unsafe` 코드 불필요
  - 디버깅 용이
- **단점**: 
  - 대용량 데이터에서 peak memory 약 2배 사용
  - 복사에 따른 CPU 오버헤드 (네트워크 대비 미미)

### Option C: Hybrid (크기 기반 자동 선택)

- **설명**: 임계값 이하는 zero-copy, 이상은 owned array 또는 chunked streaming
- **장점**: 상황별 최적 성능
- **단점**: 
  - 구현 복잡도 높음
  - 동작 예측이 어려워 디버깅 곤란
  - 임계값 설정이 사용 패턴에 따라 달라져야 함
- **미선택 사유**: "개발자 경험 우선" 설계 철학(프로젝트 설계 원칙 §1)과 충돌. 예측 불가능한 동작은 사용자 혼란을 초래.

## 결과 (Consequences)

### 긍정적
- **API 안정화**: 메모리 모델이 확정되면 사용자 코드의 장기 호환성 보장
- **ADR-0001 일관성**: PyO3 선택의 핵심 가치(메모리 안전성)를 NumPy 통합에서도 유지
- **ADR-0009 확장**: Unified BatchRecords API 위에 NumPy 변형을 자연스럽게 구축
- **디버깅 용이성**: 명확한 소유권 모델로 메모리 관련 이슈 추적이 단순화
- **Data science 워크플로우**: Aerospike 데이터를 NumPy/Pandas에서 직접 활용 가능

### 부정적
- **메모리 오버헤드**: Owned array 방식은 peak memory가 약 2배 (Rust 버퍼 + NumPy array 동시 존재)
- **dtype 추론 복잡성**: mixed-type bin 처리, 자동 추론 vs 명시 스키마 간 edge case 존재
- **Optional dependency 관리**: NumPy가 선택적 의존성이므로 import 시점 에러 처리, 조건부 모듈 로딩 등 패키징 복잡도 증가
- **추가 결정 필요**: dtype 추론 전략, 부분 실패 표현 방식 등 세부 사항은 구현 단계에서 추가 결정 필요

## 관련 ADR

- [ADR-0001: CFFI 대신 Rust/PyO3 선택](/docs/architecture/adr/2026-01-15-pyo3-over-cffi) — 메모리 안전성 우선 원칙의 근거
- [ADR-0004: Dict 대신 NamedTuple 반환 선택](/docs/architecture/adr/2026-02-10-namedtuple-over-dict) — 타입 안전성과 개발자 경험 우선 패턴
- [ADR-0009: Unified BatchRecords API](/docs/architecture/adr/2026-03-20-unified-batch-records-api) — batch 연산 통일 반환 타입, per-record result_code 패턴
- [ADR-0018: Tokio Runtime Worker Thread 자동 튜닝](/docs/architecture/adr/2026-03-30-tokio-worker-autotuning) — aerospike-py 성능 최적화 관련 선례
