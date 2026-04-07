---
title: "ADR-0039: OpenTelemetry Tracing 완전 통합 및 에코시스템 전파"
description: aerospike-py의 OTel Tracing을 완성하고 cluster-manager까지 trace context를 전파하는 아키텍처 결정. Metrics는 Prometheus 유지.
sidebar_position: 39
scope: ecosystem
repos: [aerospike-py, cluster-manager]
tags: [adr, opentelemetry, tracing, observability, prometheus]
last_updated: 2026-04-07
---

# ADR-0039: OpenTelemetry Tracing 완전 통합 및 에코시스템 전파

## 상태

**Proposed**

- 제안일: 2026-04-07
- 관련 이슈: aerospike-ce-ecosystem/project-hub#50
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

ADR-0010(3-Layer Observability Stack)은 aerospike-py에 Logging + Metrics + Tracing 3계층 관측성 스택을 도입하는 결정을 문서화했다. PR #103(Logging), #104(Metrics), #105/#112(Tracing)를 통해 기본 구현이 완료되었으나, Q2 2026 로드맵의 "OpenTelemetry tracing 통합" 목표는 ADR-0010의 범위를 넘는 확장 결정을 요구한다.

### 현재 상태

- **aerospike-py**: OTel tracing 부분 구현 (PR #105, #112), Prometheus metrics 노출 완료
- **cluster-manager**: Prometheus 기반 모니터링 대시보드 존재

### 확장이 필요한 영역

1. **PyO3 경계 trace context 전파**: Python → Rust → Aerospike 전체 경로의 distributed tracing 완성
2. **opt-in 활성화 메커니즘**: 환경변수, API parameter, decorator 등을 통한 사용자 제어
3. **cluster-manager trace 소비**: aerospike-py가 생산한 OTel 시그널을 cluster-manager 대시보드에서 활용
4. **OTel-native metrics vs Prometheus**: Prometheus exposition과 OTel metrics의 공존 전략
5. **성능 예산**: full instrumentation의 overhead 허용 범위 정의

## 결정 (Decision)

> **Q2 2026에 Option A(OTel Tracing Only)를 완성하고, Metrics는 Prometheus를 유지한다. 장기적으로 Full OTel 전환(Option B)을 검토한다.**

### 구체적 결정 사항

1. **Tracing**: aerospike-py의 OTel distributed tracing을 완성한다. PyO3 경계에서 W3C trace context를 전파하여 Python → Rust → Aerospike 전체 경로를 추적 가능하게 한다.
2. **Metrics**: Prometheus exposition format을 primary로 유지한다. ACKO ServiceMonitor 및 cluster-manager 기존 인프라와의 호환성을 보장한다.
3. **활성화**: OTel tracing은 opt-in으로 제공한다. 비활성화 시 성능 영향 zero를 목표로 한다.
4. **소비**: cluster-manager가 aerospike-py의 trace 데이터를 대시보드에 표시할 수 있는 기반을 마련한다.

## 대안 (Alternatives Considered)

### Option A: OTel Tracing Only (추천안 ✅)

Tracing만 OTel로 완성하고, Metrics는 Prometheus를 유지한다.

| 장점 | 단점 |
|------|------|
| 이미 진행 중인 구현 완성에 집중 | 두 시스템(OTel + Prometheus) 병행 운영 |
| ACKO ServiceMonitor 호환성 유지 | 장기적으로 통합 필요성 남음 |
| 점진적 도입으로 리스크 최소화 | |
| W3C trace context로 최대 가치 제공 | |

### Option B: Full OTel 전환 (Tracing + Metrics + Logs)

모든 시그널을 OTel SDK로 수집하고, OTel Collector를 통해 Prometheus exporter로 내보낸다.

| 장점 | 단점 |
|------|------|
| 단일 관측성 파이프라인 | ACKO ServiceMonitor 재설정 필요 |
| OTel Collector의 풍부한 처리 기능 | 인프라 복잡도 증가 (Collector 운영) |
| 장기적 표준화 | 기존 Prometheus 대시보드 마이그레이션 비용 |

### Option C: Prometheus 중심 유지 + OTel Bridge

Prometheus를 primary로 유지하고 trace context만 OTel bridge로 연동한다.

| 장점 | 단점 |
|------|------|
| 기존 인프라 변경 최소화 | Distributed tracing 기능 제한적 |
| 운영 복잡도 낮음 | OTel 에코시스템 활용 어려움 |

## 결과 (Consequences)

### 긍정적

- **Distributed tracing으로 성능 병목 식별 용이**: Python → Rust → Aerospike 전체 경로의 latency breakdown 가능
- **W3C trace context 표준 채택**: vendor-neutral 호환성 확보, Jaeger/Tempo/Zipkin 등 다양한 backend 지원
- **cluster-manager 대시보드 고도화 기반**: trace 데이터를 활용한 request-level 분석 가능
- **프로젝트 목표 1-4 직접 달성**: "Observability 유지" 목표에 정확히 부합
- **opt-in 설계로 성능 영향 제어**: 사용하지 않는 환경에서는 zero overhead

### 부정적

- **OTel SDK 의존성 추가**: opt-in이라도 패키지 크기 증가 (optional dependency로 완화)
- **PyO3 경계 instrumentation의 성능 overhead**: trace context 전파 시 추가 비용 발생 (ADR-0010에서 ~2% 수용)
- **Tracing + Prometheus 이중 운영**: 단기적으로 두 시스템을 병행 운영하는 복잡성
- **cluster-manager trace 표시 구현 비용**: 새로운 UI 컴포넌트 및 backend 미들웨어 개발 필요

## 관련 ADR

- **ADR-0010: 3-Layer Observability Stack** — 본 결정의 직접적인 선행 ADR. Logging + Metrics + Tracing 구조를 확립한 결정을 확장함
- **ADR-0001: PyO3 over CFFI** — Rust/PyO3 아키텍처에서의 trace context 전파 방식을 결정하는 기술적 기반
- **ADR-0006: Semaphore Backpressure** — opt-in 성능 제어 패턴의 선례 (backpressure도 성능 영향을 사용자가 제어)
