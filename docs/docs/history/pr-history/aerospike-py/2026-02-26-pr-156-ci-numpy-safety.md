---
title: "PR #156: CI Hardening and NumPy Safety"
description: Infrastructure improvements including CI hardening, NumPy safety, async_client factory, and project infra
scope: single-repo
repos: [aerospike-py]
tags: [improve, ci, numpy, async, infrastructure]
last_updated: 2026-03-29
---

# PR #156: CI Hardening and NumPy Safety

| 항목 | 내용 |
|------|------|
| **PR** | [#156](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/156) |
| **날짜** | 2026-02-26 |
| **작성자** | ksr |
| **카테고리** | improve |

## 변경 요약

CI 파이프라인 강화, NumPy 연동의 안전성 개선, async_client 팩토리 패턴 도입, 프로젝트 인프라 전반의 개선을 포함한다. NumPy 배열 처리 시 발생할 수 있는 메모리 안전성 문제를 사전에 차단하고, 비동기 클라이언트 생성을 더 편리하게 만들었다.

## 주요 변경 사항

- CI 파이프라인 강화: 더 엄격한 테스트 및 린트 검사
- NumPy 배열 처리의 메모리 안전성 개선
- `async_client()` 팩토리 함수 도입
- 프로젝트 인프라 개선 (빌드, 패키징 등)

## 영향 범위

CI/CD 파이프라인과 NumPy 기반 작업에 영향. `async_client()` 팩토리를 사용하면 비동기 클라이언트 생성이 더 간편해진다. NumPy 대용량 데이터 처리의 안정성이 향상된다.
