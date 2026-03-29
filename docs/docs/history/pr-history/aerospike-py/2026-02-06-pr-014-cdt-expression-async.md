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

aerospike-py의 핵심 기능을 대폭 확장한 마일스톤 릴리스. CDT(Collection Data Type) 작업, 표현식(Expression) 필터, 비동기(async) 클라이언트를 추가하고 PyO3를 0.28로 업그레이드했다. 이 PR을 기점으로 aerospike-py가 프로덕션 수준의 기능 완성도를 갖추게 되었다.

## 주요 변경 사항

- CDT 작업: List/Map 조작 (append, insert, get_by_index, remove_by_rank 등)
- Expression 필터: 서버 사이드 레코드 필터링 (exp 모듈)
- AsyncClient: Python asyncio 기반 비동기 클라이언트
- PyO3 0.28 업그레이드: 최신 Rust-Python 바인딩
- operate() API: 단일 요청에 여러 작업 결합

## 영향 범위

aerospike-py의 전체 기능 범위에 영향을 미치는 근본적 확장. CDT 작업으로 복잡한 데이터 구조를 서버에서 직접 조작할 수 있고, Expression 필터로 네트워크 트래픽을 줄일 수 있으며, AsyncClient로 고성능 비동기 워크로드를 지원한다. 이후 모든 기능 PR의 기반이 되는 핵심 릴리스이다.
