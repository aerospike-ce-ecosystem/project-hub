---
title: "PR #239: Unified BatchRecords API"
description: Fixed batch result code propagation, numpy key digest calculation, and unified BatchRecords API with single container type
scope: single-repo
repos: [aerospike-py]
tags: [fix, batch, numpy, api]
last_updated: 2026-03-29
---

# PR #239: Unified BatchRecords API

| 항목 | 내용 |
|------|------|
| **PR** | [#239](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/239) |
| **날짜** | 2026-03-26 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

Batch result code propagation이 올바르게 동작하지 않던 문제와 NumPy key digest 계산 버그를 수정하고, BatchRecords API를 단일 컨테이너 타입으로 통합했다. 이전에는 batch 작업 결과가 여러 타입으로 반환되어 일관성이 부족했으며, 이번 변경으로 모든 batch 작업이 통일된 BatchRecords 타입을 사용한다.

## 주요 변경 사항

- Batch result code가 개별 레코드까지 올바르게 전파되도록 수정
- NumPy key digest 계산 로직의 정확성 개선
- BatchRecords를 단일 컨테이너 타입으로 통합하여 API 일관성 확보
- 기존 batch_read, batch_write 반환 타입이 모두 BatchRecords로 통일

## 영향 범위

모든 batch API 사용자가 영향을 받는다. `BatchRecords`를 다루는 code는 통합된 반환 type에 맞춰 update해야 할 수 있다. NumPy batch path의 key digest도 다른 API와 같은 방식으로 계산된다.
