---
title: "PR #213: Operation-Level Backpressure"
description: Added Tokio Semaphore-based backpressure to limit concurrent operations and prevent server overload
scope: single-repo
repos: [aerospike-py]
tags: [feat, backpressure, performance, tokio]
last_updated: 2026-03-29
---

# PR #213: Operation-Level Backpressure

| 항목 | 내용 |
|------|------|
| **PR** | [#213](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/213) |
| **날짜** | 2026-03-16 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Tokio Semaphore 기반의 operation-level backpressure를 도입하여 동시 실행 가능한 작업 수를 제한한다. 이를 통해 클라이언트가 서버에 과도한 요청을 보내는 것을 방지하고, 서버 과부하로 인한 타임아웃이나 연결 장애를 예방한다.

## 주요 변경 사항

- Tokio Semaphore를 활용한 동시 작업 수 제한 메커니즘 구현
- 설정 가능한 최대 동시 작업 수 (configurable max concurrent operations)
- Semaphore 대기 시 BackpressureError 예외 발생
- 비동기 환경에서의 효율적인 리소스 관리

## 영향 범위

모든 async operation이 영향을 받는다. 높은 concurrency에서 client가 in-flight request 수를 제한하며, 기존에 제한 없이 요청하던 application은 `BackpressureError`를 처리해야 할 수 있다.
