---
title: "PR #213: Operation-Level Backpressure"
description: Added Tokio Semaphore-based backpressure to limit concurrent operations and prevent server overload
sidebar_position: 17
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

aerospike-py의 모든 비동기 작업에 영향. 높은 동시성 워크로드에서 서버 보호 효과가 크다. 기존에 동시 요청 수 제한 없이 사용하던 코드는 BackpressureError를 처리하는 로직을 추가해야 할 수 있다.
