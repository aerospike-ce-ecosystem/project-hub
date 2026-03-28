---
title: "PR #123: Project-Wide Refactor"
description: Removed Lua UDF support, upgraded aerospike-py, and decomposed monolithic components
sidebar_position: 7
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [refactor, lua, aerospike-py, architecture]
last_updated: 2026-03-29
---

# PR #123: Project-Wide Refactor

| 항목 | 내용 |
|------|------|
| **PR** | [#123](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/123) |
| **날짜** | 2026-03-16 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

프로젝트 전반에 걸친 대규모 리팩터링. Lua UDF 지원을 제거하고(Aerospike CE 8.1에서 미지원), aerospike-py를 최신 버전으로 업그레이드하며, 모놀리식 컴포넌트를 분해하여 유지보수성을 개선했다.

## 주요 변경 사항

- Lua UDF 관련 코드 완전 제거 (CE 8.1 호환)
- aerospike-py 최신 버전 업그레이드 (NamedTuple API 적용)
- 모놀리식 뷰/컴포넌트를 기능별 모듈로 분해
- 프론트엔드/백엔드 코드 구조 개선

## 영향 범위

Cluster Manager의 전체 코드베이스에 영향. Lua UDF 관리 기능을 사용하던 사용자는 해당 기능이 제거됨을 인지해야 한다. aerospike-py 업그레이드로 더 나은 타입 지원과 성능을 제공한다.
