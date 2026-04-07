---
title: "ADR-0019: aerospike-py 구조화된 에러 코드(result_code) 체계 도입"
description: aerospike-py의 모든 AerospikeError 하위 예외에 result_code 정수 속성을 추가하여, 문자열 매칭 대신 안정적인 정수 코드 기반 에러 분류를 지원하는 아키텍처 결정.
sidebar_position: 27
scope: single-repo
repos: [aerospike-py, cluster-manager, plugins]
tags: [adr, error-handling, result-code, aerospike-py, observability]
last_updated: 2026-03-30
---

# ADR-0019: aerospike-py 구조화된 에러 코드(result_code) 체계 도입

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#22
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

aerospike-py의 예외 계층은 `AerospikeError` → 15개+ 구체적 예외 타입으로 잘 구조화되어 있으나, Aerospike 서버에서 반환하는 **result_code (정수 에러 코드)**가 Python 예외에 노출되지 않습니다.

### 현재 문제

현재 에러 분류는 예외 메시지 문자열 매칭에 의존하고 있어, 상위 프로젝트에서 취약한 패턴이 발생합니다:

```python
# Cluster Manager (main.py:159-167)
if "FailForbidden" in msg:  # ← 문자열 매칭 (깨지기 쉬움)
```

이 접근법의 문제점:
- 메시지 포맷이 변경되면 에러 분류가 즉시 깨짐
- 다국어 메시지 지원 불가
- 같은 예외 타입 내에서 여러 result_code를 구분할 수 없음
- OTel span에 정수 코드를 기록하면 집계/필터링이 용이하지만, 현재 문자열만 사용 가능

### 기술적 배경

Aerospike 서버는 모든 응답에 정수 `result_code`를 포함합니다 (0=OK, 2=RECORD_NOT_FOUND, 5=RECORD_EXISTS, 22=FORBIDDEN 등 약 40개 이상). Rust 코어(`aerospike` crate)에서 이 코드를 이미 파싱하지만, PyO3 바인딩에서 Python 예외로 전달 시 코드가 손실됩니다.

ADR-0009 (Unified BatchRecords API)에서는 이미 `BatchRecord.result_code`로 per-record 에러 추적을 도입했으나, 예외 계층에는 동일한 패턴이 적용되지 않은 불일치가 존재합니다.

## 결정 (Decision)

> **모든 AerospikeError 하위 예외에 `result_code: int` 속성을 추가하고, `result_codes` 상수 모듈을 제공하여 정수 코드 기반 에러 분류를 지원한다.**

### 구현 방안

#### 1. Rust → Python 예외 매핑 강화

```rust
// rust/src/errors.rs
fn aerospike_error_to_py(err: AerospikeError) -> PyErr {
    let result_code = err.result_code() as i32;
    let py_err = match err {
        AerospikeError::RecordNotFound { .. } => {
            PyRecordNotFound::new_err((err.to_string(), result_code))
        }
        // ... 기타 매핑
    };
    py_err
}
```

#### 2. Python 예외 클래스 확장

```python
class AerospikeError(Exception):
    result_code: int  # Aerospike server result code
    message: str

class RecordNotFound(AerospikeError):
    result_code: int  # always 2

class ServerError(AerospikeError):
    result_code: int  # varies (22=FORBIDDEN, 26=TOO_BIG, etc.)
```

#### 3. Result Code 상수 모듈

```python
# python/aerospike_py/result_codes.py
OK = 0
RECORD_NOT_FOUND = 2
RECORD_EXISTS = 5
FORBIDDEN = 22
RECORD_TOO_BIG = 26
# ... 전체 목록
```

### 알 수 없는 코드 처리

Rust crate의 result_code 매핑이 불완전할 경우, 알 수 없는 코드는 `-1`로 설정하고 경고 로그를 출력합니다.

## 대안 (Alternatives Considered)

### 대안 1: 예외 타입만 세분화 (ForbiddenError, RecordTooBigError 등)

- **장점**: Python-idiomatic, `isinstance()` 체크 가능
- **단점**: 40개+ 코드 → 40개+ 예외 클래스 = 과도한 타입 폭발. API 표면이 크게 확장되어 유지보수 부담 증가
- **미선택 사유**: 주요 코드만 타입화하고 나머지는 `result_code`로 커버하는 것이 실용적

### 대안 2: result_code를 예외 args에 튜플로 전달

- **장점**: 기존 예외 클래스 변경 불필요
- **단점**: `e.args[1]`로 접근 = 매직 인덱스, 타입 안전성 없음. ADR-0004 (NamedTuple over Dict)에서 확립한 명시적 속성 접근 원칙에 위배
- **미선택 사유**: 명시적 속성이 사용성/가독성 모두 우수

## 결과 (Consequences)

### 긍정적

- **안정적 에러 분류**: 정수 코드 기반이므로 메시지 변경에 불변
- **Observability 강화**: OTel span, Prometheus 메트릭에 `result_code` 라벨 추가 가능 (ADR-0010 목표 직접 지원)
- **Cluster Manager TODO 해결**: 문자열 매칭 → `result_code` 기반 분류로 마이그레이션
- **Retry 로직 지원**: `result_code`로 retryable/non-retryable 에러 판별 가능 (Goal 1-5 batch_write retry 지원)
- **API 일관성**: ADR-0009의 `BatchRecord.result_code`와 동일한 패턴을 예외 계층에도 적용
- **사용자 코드 세밀한 에러 핸들링**: 같은 `ServerError` 내에서도 FORBIDDEN과 RECORD_TOO_BIG을 구분 가능

### 부정적

- **API 표면 확장**: `result_code` 속성 1개 + `result_codes` 모듈 1개 추가 (미미한 수준)
- **호환성 유지 필요**: 기존 예외 핸들링 코드와 호환성 유지 필요하나, `result_code`는 추가 속성이므로 파괴적 변경 없음
- **Rust crate 의존성**: `aerospike` crate의 result_code 매핑이 불완전할 경우 일부 코드가 `-1`로 전달될 수 있음

## 관련 ADR

- [ADR-0001: CFFI 대신 Rust/PyO3 선택](/docs/architecture/adr/2026-01-15-pyo3-over-cffi) — Rust→Python 바인딩 레이어의 기반 결정
- [ADR-0004: Dict 대신 NamedTuple 반환 선택](/docs/architecture/adr/2026-02-10-namedtuple-over-dict) — 명시적 속성 접근 원칙 (대안 2 기각 근거)
- [ADR-0006: Semaphore 기반 Backpressure](/docs/architecture/adr/2026-03-05-backpressure-semaphore) — 구조화된 예외 패턴 선례 (`BackpressureError`)
- [ADR-0009: Unified BatchRecords API](/docs/architecture/adr/2026-03-20-unified-batch-records-api) — `BatchRecord.result_code` per-record 에러 추적 패턴
- [ADR-0010: 3-Layer Observability Stack](/docs/architecture/adr/2026-02-05-observability-stack) — OTel span에 result_code 활용
