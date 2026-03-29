---
title: "PR #104: Prometheus Metrics"
description: Added OpenTelemetry-compatible Prometheus metrics collection
scope: single-repo
repos: [aerospike-py]
tags: [feat, prometheus, metrics, observability]
last_updated: 2026-03-29
---

# PR #104: Prometheus Metrics

| 항목 | 내용 |
|------|------|
| **PR** | [#104](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/104) |
| **날짜** | 2026-02-11 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

OpenTelemetry 호환 Prometheus 메트릭 수집 기능을 추가했다. `get_metrics()` API를 통해 Aerospike 작업에 대한 히스토그램, 카운터 등의 메트릭을 Prometheus 형식으로 내보낼 수 있다.

## 주요 변경 사항

- Prometheus 메트릭 레지스트리 통합
- `get_metrics()` API: Prometheus 텍스트 형식으로 메트릭 반환
- 작업별 레이턴시 히스토그램 (put, get, query, batch 등)
- 에러율 카운터, 연결 풀 상태 메트릭
- OpenTelemetry Metrics SDK와 호환되는 구현

## 영향 범위

Prometheus/Grafana 기반 모니터링 환경에 직접적 영향. FastAPI 등의 웹 프레임워크에서 `/metrics` 엔드포인트를 통해 노출 가능. ACKO의 Prometheus exporter와 함께 사용하면 클라이언트-서버 양쪽의 통합 모니터링이 가능하다.
