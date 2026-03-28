---
title: "ADR-0010: 3-Layer Observability Stack"
description: aerospike-py에 Logging(Rust tracing) + Metrics(Prometheus) + Tracing(OpenTelemetry) 3계층 관측성 스택을 도입한 아키텍처 결정.
sidebar_position: 11
scope: single-repo
repos: [aerospike-py]
tags: [adr, observability, logging, metrics, tracing, opentelemetry, prometheus]
last_updated: 2026-03-29
---

# ADR-0010: 3-Layer Observability Stack

## 상태

**Accepted**

- 제안일: 2026-02-05
- 승인일: 2026-02-12

## 맥락 (Context)

aerospike-py는 Rust로 작성된 네이티브 라이브러리로, Python 애플리케이션에서 내부 동작을 관측하기 어려운 구조였습니다. 특히 프로덕션 환경에서 성능 문제나 에러 원인을 진단하기 위한 표준적인 관측성 도구가 필요했습니다.

### 문제 상황

1. Rust 내부의 연산 지연, 에러, 재시도 등을 Python 쪽에서 관찰할 수 없음
2. FastAPI 같은 프레임워크의 기존 관측성 스택과 통합 불가
3. 프로덕션 환경에서 성능 병목 지점 식별 불가

## 결정 (Decision)

> **3계층 관측성 스택을 도입한다: Structured Logging + Prometheus Metrics + OpenTelemetry Distributed Tracing.**

### 계층 구조

```
Layer 1: Logging (Rust tracing → Python logging bridge)
  - Rust 내부의 구조화된 로그를 Python logging으로 전달
  - PR #103

Layer 2: Metrics (prometheus-client Rust → Python get_metrics())
  - Operation count, latency histogram, error rate, connection pool 상태
  - Prometheus exposition format 호환
  - PR #104

Layer 3: Tracing (OpenTelemetry OTLP export)
  - Distributed tracing spans for every operation
  - server.address, server.port, db.aerospike.cluster_name attributes
  - PR #105, #112
```

### Metrics Toggle

- 성능 오버헤드 최소화를 위해 metrics 수집을 런타임에 on/off 가능
- `enable_metrics()` / `disable_metrics()` API 제공

## 대안 검토 (Alternatives Considered)

### 대안: Python-only Instrumentation

- Python 래퍼에서 decorator 기반 계측
- **미선택 사유**: Rust 내부의 connection pool, wire protocol 수준의 계측 불가

## 결과 (Consequences)

### 긍정적 결과

- FastAPI/Django 등 기존 Python 관측성 스택과 자연스러운 통합
- Grafana 대시보드로 Aerospike 클라이언트 성능 모니터링 가능
- Jaeger/Tempo 등으로 분산 추적 가능

### 부정적 결과

- OpenTelemetry 의존성 추가 (선택적 설치)
- Metrics 활성화 시 ~2% 성능 오버헤드

## 영향받는 레포지토리

| 레포 | 영향 내용 |
|------|----------|
| `aerospike-py` | PR #103, #104, #105, #112에서 3-layer 관측성 구현 |
| `cluster-manager` | Backend에서 aerospike-py metrics 활용 |
| `plugins` | aerospike-py-api Skill에 관측성 가이드 추가 |

## 참고 자료

- [PR #103 - Structured Logging](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/103)
- [PR #104 - Prometheus Metrics](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/104)
- [PR #105 - OpenTelemetry Tracing](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/105)
- [PR #112 - Tracing Attributes](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/112)
