---
title: "PR #148: OTel Fast-Path Optimization"
description: OTEL_ACTIVE AtomicBool guard and Cow<'static, str> optimization to minimize tracing overhead
scope: single-repo
repos: [aerospike-py]
tags: [perf, opentelemetry, rust, optimization]
last_updated: 2026-03-29
---

# PR #148: OTel Fast-Path Optimization

| 항목 | 내용 |
|------|------|
| **PR** | [#148](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/148) |
| **날짜** | 2026-02-25 |
| **작성자** | ksr |
| **카테고리** | perf |

## 변경 요약

OpenTelemetry 트레이싱이 비활성 상태일 때의 CPU 오버헤드를 최소화하기 위한 fast-path를 도입했다. `OTEL_ACTIVE` AtomicBool 플래그로 트레이싱 비활성 시 span 생성 경로를 완전히 건너뛰고, `Cow<'static, str>`로 span 이름의 동적 할당을 제거했다.

## 주요 변경 사항

- `OTEL_ACTIVE` AtomicBool 전역 플래그 도입으로 트레이싱 활성 여부 빠른 판별
- 트레이싱 비활성 시 span 생성 로직 전체 스킵 (zero-cost fast-path)
- `Cow<'static, str>` 적용으로 span 이름 문자열 힙 할당 제거
- OTel 관련 조건 분기 최적화

## 영향 범위

OpenTelemetry를 사용하지 않는 사용자에게 가장 큰 효과. 트레이싱 비활성 상태에서 모든 작업의 오버헤드가 AtomicBool 체크 한 번으로 줄어들어, OTel 의존성이 있더라도 성능 페널티가 사실상 없어졌다.
