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

NumPy 배열 기반의 `batch_write_numpy` API를 새로 추가하여 대용량 벌크 쓰기 작업의 성능을 극대화했다. NumpyBatchRecords 타입을 개선하여 NumPy 네이티브 데이터를 Python 객체 변환 없이 직접 Aerospike 서버로 전송할 수 있게 되었다.

## 주요 변경 사항

- `batch_write_numpy()` API 신규 추가
- NumpyBatchRecords 타입 개선: 더 효율적인 NumPy 배열 직접 전달
- Python 객체 변환 오버헤드 제거로 벌크 쓰기 성능 향상
- GIL 해제 상태에서의 NumPy 데이터 직접 처리

## 영향 범위

대용량 데이터 적재(bulk loading) 워크로드에 큰 성능 개선. 기존 `batch_write()`와 병행 사용 가능하며, NumPy 기반 데이터 파이프라인에서 특히 효과적이다. 데이터 사이언스, ETL 파이프라인 등의 사용 사례에 영향.
