---
title: "PR #127: NamedTuple Type System"
description: Fundamental type system change from tuples to NamedTuples and TypedDicts for all API returns
sidebar_position: 10
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

모든 API 반환값을 기존의 일반 튜플에서 NamedTuple/TypedDict로 전환하는 근본적인 타입 시스템 변경이다. 이를 통해 IDE 자동 완성, 타입 검사, 코드 가독성이 크게 향상되며, `record.bins`, `record.meta.gen` 같은 명시적 속성 접근이 가능해졌다.

## 주요 변경 사항

- 모든 API 반환 타입을 NamedTuple로 전환
- Record: `(key, meta, bins)` -> `Record(key, meta, bins)` (속성 접근 가능)
- Metadata: TypedDict로 gen, ttl 등의 필드 명시
- .pyi 스텁 파일 업데이트로 IDE 지원 완전 확보
- 하위 호환성 유지: 기존 튜플 언패킹도 동작

## 영향 범위

aerospike-py의 모든 API 사용자에게 영향을 미치는 핵심 변경. 기존 코드는 하위 호환성이 유지되어 즉시 깨지지 않지만, 새로운 속성 접근 패턴(`record.bins` 등)으로의 점진적 마이그레이션을 권장한다. 후속 PR #205에서 batch 타입에도 동일 패턴이 적용된다.
