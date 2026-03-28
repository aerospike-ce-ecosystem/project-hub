---
title: "PR #194: HyperLogLog CDT 연산 헬퍼 추가"
description: HyperLogLog CDT 연산 헬퍼 함수 추가 (hll_init, hll_add, hll_count 등)
sidebar_position: 22
scope: single-repo
repos: [aerospike-py]
tags: [feat, cdt, hyperloglog, hll]
last_updated: 2026-03-29
---

# PR #194: feat: add HyperLogLog CDT operation helpers

| 항목 | 내용 |
|------|------|
| **PR** | [#194](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/194) |
| **날짜** | 2026-03-09 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

HyperLogLog(HLL) CDT 연산을 위한 헬퍼 함수를 추가했다. HLL은 대규모 데이터셋의 고유 원소 수(cardinality)를 확률적으로 추정하는 자료구조로, 서버 사이드에서 직접 HLL 연산을 수행할 수 있다.

## 주요 변경 사항

- `hll_init`: HLL bin 초기화 (index_bit_count, minhash_bit_count 설정)
- `hll_add`: HLL에 값 추가
- `hll_count`: 추정 cardinality 조회
- `hll_get_union`: 여러 HLL의 합집합 계산
- `hll_get_union_count`: 합집합의 추정 cardinality 조회
- `hll_get_intersect_count`: 교집합의 추정 cardinality 조회
- `hll_get_similarity`: Jaccard 유사도 추정
- `hll_describe`: HLL 메타데이터 조회
- operate() API와 통합하여 단일 요청에 여러 HLL 연산 결합 가능

## 영향 범위

고유 사용자 수 추정, 실시간 분석, A/B 테스트 지표 등 대규모 cardinality 추정이 필요한 워크로드에서 활용할 수 있다. 기존 CDT 연산(List, Map)과 동일한 패턴으로 operate()에서 사용할 수 있어 학습 곡선이 낮다.
