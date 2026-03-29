---
title: "ADR-0009: Unified BatchRecords API"
description: aerospike-py의 batch 연산 반환 타입을 BatchRecords NamedTuple로 통일하여 API 일관성과 per-record 에러 추적을 개선한 결정.
scope: single-repo
repos: [aerospike-py]
tags: [adr, batch, api-design, namedtuple, aerospike-py]
last_updated: 2026-03-29
---

# ADR-0009: Unified BatchRecords API

## 상태

**Accepted**

- 제안일: 2026-03-20
- 승인일: 2026-03-26

## 맥락 (Context)

aerospike-py의 batch 연산(`batch_read`, `batch_operate`, `batch_remove`)들이 서로 다른 반환 타입을 사용하고 있어 사용자 혼란과 per-record 에러 추적의 어려움이 있었습니다.

### 문제 상황

1. `batch_read`는 `list[BatchRecord]`, `batch_operate`는 `list[tuple]` 등 비일관적 반환 타입
2. batch 연산에서 일부 레코드만 실패할 때 per-record result code를 확인하기 어려움
3. NumPy key digest 생성에서 bytes 키 처리 불일치

## 결정 (Decision)

> **모든 batch 연산의 반환 타입을 `BatchRecords` NamedTuple로 통일한다.**

### BatchRecords 구조

```python
class BatchRecord(NamedTuple):
    key: tuple
    bins: dict | None
    meta: RecordMeta | None
    result_code: int

class BatchRecords(NamedTuple):
    records: list[BatchRecord]
    total: int
    succeeded: int
    failed: int
```

### 적용 범위

- `batch_read()` → `BatchRecords` 반환
- `batch_operate()` → `BatchRecords` 반환
- `batch_remove()` → `BatchRecords` 반환
- per-record `result_code` 필드로 개별 레코드 성공/실패 추적 가능

## 대안 검토 (Alternatives Considered)

### 대안: Exception-based Error Reporting

- 일부 레코드 실패 시 예외 발생
- **미선택 사유**: batch의 partial failure는 정상 동작이며, 예외보다는 result_code 기반 처리가 적합

## 결과 (Consequences)

### 긍정적 결과

- 모든 batch API의 일관된 반환 타입으로 학습 비용 감소
- per-record result_code로 세밀한 에러 추적 가능
- `succeeded`/`failed` 카운트로 빠른 성공률 확인

### 부정적 결과

- 기존 batch API 사용자의 코드 마이그레이션 필요
- Breaking change (v0.0.5에서 적용)

## 영향받는 레포지토리

| 레포 | 영향 내용 |
|------|----------|
| `aerospike-py` | PR #205, #239에서 BatchRecords 통일 |
| `cluster-manager` | Backend의 batch 호출 코드 업데이트 |
| `plugins` | aerospike-py-api Skill 업데이트 |

## 참고 자료

- [PR #205 - BatchRecord/BatchRecords NamedTuple](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/205)
- [PR #239 - Unified BatchRecords API](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/239)
