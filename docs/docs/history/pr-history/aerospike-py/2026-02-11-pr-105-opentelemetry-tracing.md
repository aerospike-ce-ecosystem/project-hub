---
title: "PR #105: OpenTelemetry Tracing"
description: Added OpenTelemetry distributed tracing with OTLP export support
scope: single-repo
repos: [aerospike-py]
tags: [feat, opentelemetry, tracing, observability]
last_updated: 2026-03-29
---

# PR #105: OpenTelemetry Tracing

| 항목 | 내용 |
|------|------|
| **PR** | [#105](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/105) |
| **날짜** | 2026-02-11 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

OpenTelemetry 분산 추적(distributed tracing)을 aerospike-py에 통합하여 OTLP(OpenTelemetry Protocol) 기반의 트레이스 내보내기를 지원한다. 모든 Aerospike 작업이 자동으로 스팬(span)으로 기록되어 분산 시스템에서의 요청 흐름을 추적할 수 있다.

## 주요 변경 사항

- OpenTelemetry SDK 통합 (Rust tracing crate 기반)
- 모든 Aerospike 작업에 대한 자동 스팬 생성
- OTLP gRPC/HTTP 내보내기 지원
- 스팬 속성: namespace, set, operation type, duration, result code
- Python 측 트레이스 컨텍스트와 Rust 측 스팬 연결

## 영향 범위

Observability stack을 운영하는 환경이 영향을 받는다. Jaeger, Zipkin, Grafana Tempo 같은 distributed tracing backend에 span을 보낼 수 있으며, PR #104의 metric과 PR #103의 structured log를 함께 사용할 수 있다.
