---
title: "PR #146: Reduce PyO3 Binding CPU Overhead"
description: Performance optimization with Arc<ConnectionInfo>, HashMap::with_capacity, and intern!() key interning
scope: single-repo
repos: [aerospike-py]
tags: [perf, pyo3, rust, optimization]
last_updated: 2026-03-29
---

# PR #146: Reduce PyO3 Binding CPU Overhead

| 항목 | 내용 |
|------|------|
| **PR** | [#146](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/146) |
| **날짜** | 2026-02-25 |
| **작성자** | ksr |
| **카테고리** | perf |

## 변경 요약

PyO3 바인딩 레이어의 CPU 오버헤드를 줄이기 위한 최적화를 수행했다. 연결 정보를 `Arc<ConnectionInfo>`로 공유하여 불필요한 복제를 제거하고, `HashMap::with_capacity`로 재할당을 방지하며, `intern!()` 매크로로 Python 딕셔너리 키 문자열 인터닝을 적용했다.

## 주요 변경 사항

- `Arc<ConnectionInfo>` 도입으로 연결 정보 복제 오버헤드 제거
- `HashMap::with_capacity` 적용으로 bins 변환 시 재할당 방지
- `intern!()` 매크로를 통한 Python 딕셔너리 키 인터닝
- 핫패스에서의 불필요한 메모리 할당 최소화

## 영향 범위

외부 API 변경 없이 내부 성능만 개선. 높은 처리량 워크로드에서 PyO3 바인딩 계층의 CPU 사용량이 감소하며, 특히 대량의 레코드를 반환하는 query/batch 작업에서 효과가 두드러진다.
