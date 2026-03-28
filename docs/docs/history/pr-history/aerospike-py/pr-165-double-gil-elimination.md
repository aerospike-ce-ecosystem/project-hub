---
title: "PR #165: Double GIL Elimination"
description: Performance optimization removing redundant GIL locks and adding metrics toggle API
sidebar_position: 13
scope: single-repo
repos: [aerospike-py]
tags: [perf, gil, metrics, python]
last_updated: 2026-03-29
---

# PR #165: Double GIL Elimination

| 항목 | 내용 |
|------|------|
| **PR** | [#165](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/165) |
| **날짜** | 2026-02-28 |
| **작성자** | ksr |
| **카테고리** | perf |

## 변경 요약

이중 GIL(Global Interpreter Lock) 획득 패턴을 제거하여 성능을 최적화했다. Rust에서 Python 콜백 실행 시 불필요하게 두 번 GIL을 획득하던 문제를 수정하고, 메트릭 수집을 런타임에 켜고 끌 수 있는 토글 API를 추가했다.

## 주요 변경 사항

- 이중 GIL 획득 패턴 식별 및 제거
- GIL 획득 횟수 감소로 인한 처리량(throughput) 향상
- `enable_metrics()` / `disable_metrics()` 토글 API 추가
- 메트릭 비활성화 시 추가적인 성능 오버헤드 제거

## 영향 범위

모든 aerospike-py 사용자에게 성능 개선 효과. 특히 멀티스레드 환경에서 GIL 경합이 줄어들어 더 높은 동시성 처리가 가능하다. 메트릭 토글 API를 통해 개발 환경에서는 메트릭을 켜고 프로덕션에서는 최대 성능을 위해 끌 수 있다.
