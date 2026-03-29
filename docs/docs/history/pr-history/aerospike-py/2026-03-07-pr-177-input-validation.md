---
title: "PR #177: Harden Input Validation"
description: Strict type checks for policy, query, numpy parameters and admin privilege validation
scope: single-repo
repos: [aerospike-py]
tags: [fix, validation, type-safety, security, admin]
last_updated: 2026-03-29
---

# PR #177: Harden Input Validation

| 항목 | 내용 |
|------|------|
| **PR** | [#177](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/177) |
| **날짜** | 2026-03-07 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

정책(policy), 쿼리(query), NumPy 파라미터 및 관리자 권한(admin privilege)에 대한 엄격한 타입 검증을 추가했다. 잘못된 타입의 인자가 전달될 때 Rust 레이어에서 예측 불가능한 동작이 발생하던 문제를 방지하고, 명확한 에러 메시지를 제공하도록 개선했다.

## 주요 변경 사항

- Policy 객체 필드에 대한 타입 및 범위 검증 추가
- Query 파라미터의 엄격한 타입 체크 적용
- NumPy 배열 입력의 dtype 및 shape 검증
- Admin privilege 값에 대한 유효성 검사 강화
- 잘못된 입력 시 구체적인 TypeError/ValueError 메시지 제공

## 영향 범위

잘못된 타입의 인자를 전달하던 코드는 이전에 무시되거나 예측 불가능한 동작을 보이던 것이 이제 명확한 예외를 발생시킨다. 보안 관점에서 admin 권한 관련 입력 검증이 강화되어 의도치 않은 권한 부여를 방지한다.
