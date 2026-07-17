---
title: "PR #127: NamedTuple Type System"
description: Fundamental type system change from tuples to NamedTuples and TypedDicts for all API returns
scope: single-repo
repos: [aerospike-py]
tags: [feat, type-system, namedtuple, api]
last_updated: 2026-03-29
---

# PR #127: NamedTuple Type System

| 항목 | 내용 |
|------|------|
| **PR** | [#127](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/127) |
| **날짜** | 2026-02-18 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

API 반환값을 일반 tuple에서 NamedTuple과 TypedDict로 변경했다. 사용자는 `record.bins`, `record.meta.gen`처럼 이름이 있는 attribute로 값에 접근할 수 있고, IDE completion과 static type checking도 활용할 수 있다.

## 주요 변경 사항

- 모든 API 반환 타입을 NamedTuple로 전환
- Record: `(key, meta, bins)` -> `Record(key, meta, bins)` (속성 접근 가능)
- Metadata: TypedDict로 gen, ttl 등의 필드 명시
- .pyi 스텁 파일 업데이트로 IDE 지원 완전 확보
- 하위 호환성 유지: 기존 튜플 언패킹도 동작

## 영향 범위

모든 aerospike-py API 사용자가 영향을 받는다. 기존 index access도 당장은 동작하지만 `record.bins`처럼 이름이 있는 attribute로 점진적으로 옮기는 것을 권장한다. 후속 PR #205는 같은 pattern을 batch type에도 적용한다.
