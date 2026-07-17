---
title: "PR #052: Apache 2.0 Relicense"
description: Relicensed project to Apache-2.0 with expanded tests and FastAPI example
scope: single-repo
repos: [aerospike-py]
tags: [chore, license, testing, example]
last_updated: 2026-03-29
---

# PR #052: Apache 2.0 Relicense

| 항목 | 내용 |
|------|------|
| **PR** | [#052](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/52) |
| **날짜** | 2026-02-07 |
| **작성자** | ksr |
| **카테고리** | chore |

## 변경 요약

프로젝트 라이선스를 Apache-2.0으로 변경하여 커뮤니티 에코시스템에서의 활용성을 높였다. 테스트 스위트를 확장하고 FastAPI 기반의 예제 애플리케이션을 추가하여 실제 사용 시나리오를 보여준다.

## 주요 변경 사항

- 전체 소스 파일의 라이선스 헤더를 Apache-2.0으로 변경
- LICENSE 파일 교체
- 테스트 확장: 더 많은 엣지 케이스 커버리지
- FastAPI 예제 애플리케이션 추가 (CRUD 패턴 시연)

## 영향 범위

프로젝트의 license 조건이 영향을 받는다. Apache-2.0은 명시적인 patent grant를 포함하며, 함께 추가한 FastAPI example은 Web service에서 aerospike-py를 사용하는 기본 pattern을 보여 준다.
