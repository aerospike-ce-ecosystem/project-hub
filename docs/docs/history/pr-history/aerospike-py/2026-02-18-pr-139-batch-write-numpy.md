---
title: "PR #139: NumPy Batch Write API"
description: New NumPy-based batch write API for high-performance bulk operations
scope: single-repo
repos: [aerospike-py]
tags: [feat, numpy, batch, performance]
last_updated: 2026-03-29
---

# PR #139: NumPy Batch Write API

| 항목 | 내용 |
|------|------|
| **PR** | [#139](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/139) |
| **날짜** | 2026-02-18 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

NumPy array를 받는 `batch_write_numpy` API를 추가했다. 개선한 `NumpyBatchRecords` type은 NumPy data를 Python object로 변환하지 않고 Aerospike server에 전달한다.

## 주요 변경 사항

- `batch_write_numpy()` API 신규 추가
- NumpyBatchRecords 타입 개선: 더 효율적인 NumPy 배열 직접 전달
- Python 객체 변환 오버헤드 제거로 벌크 쓰기 성능 향상
- GIL 해제 상태에서의 NumPy 데이터 직접 처리

## 영향 범위

Bulk loading workload가 영향을 받는다. 기존 `batch_write()`는 그대로 사용할 수 있으며, NumPy 기반 data science와 ETL pipeline은 Python object conversion을 줄이기 위해 새 API를 선택할 수 있다.
