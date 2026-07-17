---
title: "PR #123: Project-Wide Refactor"
description: Removed Lua UDF support, upgraded aerospike-py, and decomposed monolithic components
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

프로젝트 전반을 refactor했다. Aerospike CE 8.1이 지원하지 않는 Lua UDF 기능을 제거하고, aerospike-py를 upgrade했으며, monolithic component를 기능별로 나눠 유지보수하기 쉽게 만들었다.

## 주요 변경 사항

- Lua UDF 관련 코드 완전 제거 (CE 8.1 호환)
- aerospike-py 최신 버전 업그레이드 (NamedTuple API 적용)
- 모놀리식 뷰/컴포넌트를 기능별 모듈로 분해
- 프론트엔드/백엔드 코드 구조 개선

## 영향 범위

Cluster Manager codebase 전체가 영향을 받는다. Lua UDF 관리 기능은 제거됐으므로 이를 사용하던 사용자는 migration이 필요하다. aerospike-py upgrade로 type support와 성능도 개선됐다.
