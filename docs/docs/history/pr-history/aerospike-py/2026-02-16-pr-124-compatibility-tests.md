---
title: "PR #124: Compatibility Bug-Hunting Tests"
description: 211 cross-verification tests comparing aerospike-py behavior against the official Python client
scope: single-repo
repos: [aerospike-py]
tags: [test, compatibility, cross-verification, quality]
last_updated: 2026-03-29
---

# PR #124: Compatibility Bug-Hunting Tests

| 항목 | 내용 |
|------|------|
| **PR** | [#124](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/124) |
| **날짜** | 2026-02-16 |
| **작성자** | ksr |
| **카테고리** | test |

## 변경 요약

공식 Aerospike Python 클라이언트와 aerospike-py의 동작을 교차 검증하는 211개의 호환성 테스트를 추가했다. 두 클라이언트의 동일한 작업에 대한 결과를 비교하여 동작 불일치를 체계적으로 탐지할 수 있는 테스트 프레임워크를 구축했다.

## 주요 변경 사항

- 211개의 교차 검증 테스트 케이스 작성
- 공식 클라이언트와 aerospike-py 결과를 나란히 비교하는 테스트 구조
- CRUD, query, batch, CDT 등 주요 API 영역별 호환성 검증
- 발견된 불일치 사항을 이슈로 추적할 수 있는 체계 마련

## 영향 범위

Production code는 바뀌지 않는다. 새 test suite는 기능을 추가하거나 refactor할 때 official client와 다른 결과가 생기는지 자동으로 검사한다.
