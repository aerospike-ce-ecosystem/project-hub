---
title: "PR #014: CDT, Expressions, and Async Client"
description: Major feature release adding CDT operations, expression filters, async client, and PyO3 0.28 upgrade
scope: single-repo
repos: [aerospike-py]
tags: [feat, cdt, expression, async, pyo3]
last_updated: 2026-03-29
---

# PR #014: CDT, Expressions, and Async Client

| 항목 | 내용 |
|------|------|
| **PR** | [#014](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/14) |
| **날짜** | 2026-02-06 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

CDT(Collection Data Type) operation, Expression filter, async client를 추가하고 PyO3를 0.28로 upgrade한 milestone release다. 이 변경으로 sync CRUD 외에도 async workload와 server-side data operation을 지원하게 됐다.

## 주요 변경 사항

- CDT 작업: List/Map 조작 (append, insert, get_by_index, remove_by_rank 등)
- Expression 필터: 서버 사이드 레코드 필터링 (exp 모듈)
- AsyncClient: Python asyncio 기반 비동기 클라이언트
- PyO3 0.28 업그레이드: 최신 Rust-Python 바인딩
- operate() API: 단일 요청에 여러 작업 결합

## 영향 범위

Client의 public feature 범위가 넓어졌다. CDT는 복합 data structure를 server에서 변경하고, Expression은 조건에 맞는 record만 처리하며, `AsyncClient`는 asyncio workload를 지원한다. 이후 PR은 이 API를 기반으로 기능을 확장했다.
