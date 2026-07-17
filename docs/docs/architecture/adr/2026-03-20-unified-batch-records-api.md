---
title: "ADR-0009: Unified BatchRecords API"
description: aerospike-py의 batch 연산 반환 타입을 BatchRecords NamedTuple로 통일하여 API 일관성과 per-record 에러 추적을 개선한 결정.
sidebar_position: 9
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

aerospike-py의 batch operation인 `batch_read`, `batch_operate`, `batch_remove`는 서로 다른 type을 반환했습니다. 사용자가 operation마다 다른 형식을 처리해야 했고 record별 error를 추적하기도 어려웠습니다.

### 문제 상황

1. `batch_read`는 `list[BatchRecord]`를, `batch_operate`는 `list[tuple]`을 반환해 type이 일관되지 않았습니다.
2. Batch 안에서 일부 record만 실패하면 record별 result code를 확인하기 어려웠습니다.
3. NumPy key digest를 생성할 때 bytes key를 처리하는 방식이 일관되지 않았습니다.

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
- Record별 `result_code` field로 각 record의 성공과 실패를 추적할 수 있습니다.

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
