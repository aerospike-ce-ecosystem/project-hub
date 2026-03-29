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

BatchRecord와 BatchRecords의 반환 타입을 NamedTuple 패턴으로 일관되게 재구성했다. PR #127에서 도입된 NamedTuple 타입 시스템이 batch 작업 결과에도 완전히 적용되도록 하여, 모든 API 반환값이 동일한 패턴을 따르게 만들었다. 관련 문서와 테스트도 전면 개편했다.

## 주요 변경 사항

- BatchRecord를 NamedTuple로 변환 (key, bins, meta, result_code 필드)
- BatchRecords 컨테이너 타입의 일관된 NamedTuple 접근
- 기존 튜플 언패킹 패턴에서 속성 접근 패턴으로 전환
- 문서 전면 업데이트 및 테스트 스위트 재작성

## 영향 범위

batch 작업을 사용하는 모든 aerospike-py 사용자에게 영향. 기존의 `result[0]`, `result[1]` 같은 인덱스 기반 접근을 `result.key`, `result.bins` 같은 속성 접근으로 변경해야 한다. PR #127의 NamedTuple 타입 시스템 완성을 위한 중요한 후속 작업이다.
