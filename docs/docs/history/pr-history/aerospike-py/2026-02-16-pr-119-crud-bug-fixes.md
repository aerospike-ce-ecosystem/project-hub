---
title: "PR #119: CRUD Bug Fixes (#115, #116, #118)"
description: Fix get/select/exists/operate key tuple return issues reported in #115, #116, #118
scope: single-repo
repos: [aerospike-py]
tags: [fix, crud, key-tuple, bug]
last_updated: 2026-03-29
---

# PR #119: CRUD Bug Fixes (#115, #116, #118)

| 항목 | 내용 |
|------|------|
| **PR** | [#119](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/119) |
| **날짜** | 2026-02-16 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

get, select, exists, operate 작업에서 key tuple 반환이 올바르지 않던 버그 세 건(#115, #116, #118)을 일괄 수정했다. 공식 Python 클라이언트와의 호환성을 보장하기 위해 반환 형식을 통일하고, 관련 테스트를 보강했다.

## 주요 변경 사항

- get/select 작업의 key tuple 반환 형식 수정 (#115)
- exists 작업에서 누락되던 key 정보 반환 수정 (#116)
- operate 작업의 key tuple 구조 불일치 해결 (#118)
- 각 이슈에 대한 회귀 테스트 추가

## 영향 범위

CRUD result에 의존하는 모든 user code가 영향을 받는다. 잘못된 반환값을 별도로 보정하던 code는 workaround를 제거해야 할 수 있으며, 수정 후에는 official client와 같은 key tuple을 반환한다.
