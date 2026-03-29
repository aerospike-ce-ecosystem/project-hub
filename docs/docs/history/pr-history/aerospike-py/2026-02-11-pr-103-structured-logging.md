---
title: "PR #103: Structured Logging Bridge"
description: Added structured logging with Rust-to-Python bridge for unified log output
scope: single-repo
repos: [aerospike-py]
tags: [feat, logging, rust, observability]
last_updated: 2026-03-29
---

# PR #103: Structured Logging Bridge

| 항목 | 내용 |
|------|------|
| **PR** | [#103](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/103) |
| **날짜** | 2026-02-11 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Rust 내부의 구조화된 로그를 Python의 logging 모듈로 브릿지하는 기능을 구현했다. Rust의 tracing crate에서 생성된 로그 이벤트가 Python 표준 logging으로 전달되어, 애플리케이션의 통합 로그 출력에서 Aerospike 클라이언트의 내부 동작을 확인할 수 있다.

## 주요 변경 사항

- Rust tracing -> Python logging 브릿지 구현
- 구조화된 로그 필드 (key, namespace, operation, duration 등) 전달
- 로그 레벨 매핑: Rust trace/debug/info/warn/error -> Python logging levels
- 런타임 로그 레벨 변경 지원

## 영향 범위

aerospike-py를 사용하는 모든 Python 애플리케이션의 로깅에 영향. 기존 Python logging 설정을 그대로 활용할 수 있어 추가 설정 부담 없음. PR #105 (트레이싱), PR #104 (메트릭)과 함께 observability 3대 요소를 구성한다.
