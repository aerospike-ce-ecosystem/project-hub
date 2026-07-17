---
title: "PR #205: BatchRecord NamedTuple Overhaul"
description: Restructured batch return types to use NamedTuple pattern consistently with docs and test overhaul
scope: single-repo
repos: [aerospike-py]
tags: [fix, batch, namedtuple, docs, testing]
last_updated: 2026-03-29
---

# PR #205: BatchRecord NamedTuple Overhaul

| 항목 | 내용 |
|------|------|
| **PR** | [#205](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/205) |
| **날짜** | 2026-03-15 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

`BatchRecord`와 `BatchRecords`의 반환 type을 NamedTuple pattern으로 통일했다. PR #127에서 일반 record에 적용한 type system을 batch result에도 확장하고 관련 documentation과 test를 갱신했다.

## 주요 변경 사항

- BatchRecord를 NamedTuple로 변환 (key, bins, meta, result_code 필드)
- BatchRecords 컨테이너 타입의 일관된 NamedTuple 접근
- 기존 튜플 언패킹 패턴에서 속성 접근 패턴으로 전환
- 관련 documentation update와 test suite 재작성

## 영향 범위

Batch operation을 사용하는 모든 aerospike-py 사용자가 영향을 받는다. 기존의 `result[0]`, `result[1]` 같은 index access를 `result.key`, `result.bins` 같은 attribute access로 변경해야 한다. 이 변경은 PR #127의 NamedTuple pattern을 batch API까지 확장한다.
