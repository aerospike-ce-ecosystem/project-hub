---
title: "PR #195: Bitwise CDT 연산 헬퍼 추가"
description: Bitwise CDT 연산 헬퍼 함수 추가 (bit_resize, bit_insert, bit_get 등)
sidebar_position: 23
scope: single-repo
repos: [aerospike-py]
tags: [feat, cdt, bitwise, bit]
last_updated: 2026-03-29
---

# PR #195: feat: add Bitwise CDT operation helpers

| 항목 | 내용 |
|------|------|
| **PR** | [#195](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/195) |
| **날짜** | 2026-03-09 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Bitwise CDT 연산을 위한 헬퍼 함수를 추가했다. Bitwise 연산은 bytes 타입 bin을 비트 단위로 조작할 수 있는 서버 사이드 연산으로, 플래그 관리, 비트맵 인덱스, 권한 비트마스크 등에 활용할 수 있다.

## 주요 변경 사항

- `bit_resize`: bytes bin의 크기 변경
- `bit_insert`: 특정 오프셋에 bytes 삽입
- `bit_remove`: 특정 오프셋에서 bytes 제거
- `bit_set`: 비트 범위를 특정 값으로 설정
- `bit_or`, `bit_xor`, `bit_and`, `bit_not`: 비트 논리 연산
- `bit_lshift`, `bit_rshift`: 비트 시프트 연산
- `bit_add`, `bit_subtract`: 비트 범위에 대한 산술 연산
- `bit_get`: 비트 범위 읽기
- `bit_count`: 설정된 비트 수 카운트
- `bit_lscan`, `bit_rscan`: 좌/우측부터 특정 비트 검색
- `bit_get_int`: 비트 범위를 정수로 읽기
- operate() API와 통합하여 단일 요청에 여러 Bitwise 연산 결합 가능

## 영향 범위

비트 단위 데이터 조작이 필요한 워크로드에서 활용할 수 있다. 사용자 권한 플래그, 피처 토글 비트맵, 블룸 필터 구현 등에 적합하다. HLL과 마찬가지로 기존 CDT 연산 패턴을 따르므로 operate()에서 일관된 방식으로 사용할 수 있다.
