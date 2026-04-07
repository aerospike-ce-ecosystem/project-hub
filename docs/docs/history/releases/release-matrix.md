---
title: Release Compatibility Matrix
description: Aerospike CE Ecosystem 전체 릴리스 호환성 매트릭스
sidebar_position: 1
scope: ecosystem
repos:
  - aerospike-py
  - acko
  - cluster-manager
  - plugins
tags:
  - releases
  - compatibility
  - matrix
  - versioning
last_updated: 2026-04-07
---

# Release Compatibility Matrix

Aerospike CE Ecosystem 각 프로젝트 간 릴리스 호환성 매트릭스입니다. 동일 행에 있는 버전들은 함께 테스트되었으며 호환성이 검증되었습니다.

---

## aerospike-py Releases

| Version | Date (approx) | Stage | Key Changes |
|:---:|:---:|:---:|:---|
| v0.0.1.dev2 | 2026-02-05 | Development | Initial release, PyO3 0.28 Rust core, basic CRUD |
| v0.0.1.alpha | 2026-02-10 | Alpha | CDT operations, expression filters |
| v0.0.1.alpha3 | 2026-02-12 | Alpha | Async client, OpenTelemetry tracing |
| v0.0.1.alpha4 | 2026-02-14 | Alpha | Prometheus metrics, structured logging |
| v0.0.1.alpha6 | 2026-02-17 | Alpha | NamedTuple type system, .pyi stubs, NumPy batch ops |
| v0.0.1.beta1 | 2026-02-21 | Beta | Performance optimization, double GIL elimination |
| v0.0.1.beta2 | 2026-02-27 | Beta | Policy caching, security audit, i18n docs |
| v0.0.2 | 2026-03-12 | Stable | Backpressure, batch_write retry, code dedup (~1200 lines) |
| v0.0.3 | 2026-03-19 | Stable | BatchRecords API unification, consolidated improvements |
| v0.0.4 | 2026-03-26 | Stable | Final Q1 release, stability hardening |
| v0.0.5 | 2026-03-30 | Stable | Ping health check, batch result code fixes |
| v0.1.0 | 2026-04-02 | Stable | Lifecycle state machine, Full Jitter exponential backoff |
| v0.1.1~v0.1.5 | 2026-04-01~05 | Stable | Incremental stabilization, docs versioning |
| v0.2.0 | 2026-04-07 | Stable | batch_write() API, aerospike crate v2.0.0, in_doubt field exposure |
| v0.2.1 | 2026-04-07 | Stable | batch_write post-merge review fixes |

---

## ACKO Releases

| Version | Date (approx) | Key Changes |
|:---:|:---:|:---|
| v0.0.1 | 2026-03-03 | Initial commit, CRD + Controller skeleton |
| v0.0.2 | 2026-03-04 | Webhook validation, basic reconciler |
| v0.0.3 | 2026-03-04 | Helm chart packaging |
| v0.0.4 | 2026-03-05 | StatefulSet management |
| v0.0.5 | 2026-03-05 | Service/headless service creation |
| v0.0.6 | 2026-03-06 | PVC management, storage integration |
| v0.0.7 | 2026-03-06 | Config generation, aerospike.conf templating |
| v0.0.8 | 2026-03-07 | CE constraint webhook (size 8 이하, ns 2 이하, no XDR/TLS) |
| v0.0.9 | 2026-03-07 | E2E test framework, Kind-based testing |
| v0.1.1 | 2026-03-10 | Cluster-scoped templates, operator resilience |
| v0.1.2 | 2026-03-12 | Unified Podman image, monitoring integration |
| v0.1.3 | 2026-03-14 | Migration status tracking, UI submodule integration |
| v0.1.4 | 2026-03-17 | Operator stability hardening |
| v0.1.5 | 2026-03-19 | Priority class support, data safety hardening |
| v0.1.6 | 2026-03-22 | Bilingual docs (EN/KO), Helm chart refinements |
| v0.1.7 | 2026-03-25 | Final Q1 release, agentic CI workflows |
| v0.1.8 | 2026-03-28 | UTF-8 truncation fix, internal API cleanup, UI docs sync |
| v0.2.0~v0.2.1 | 2026-04-02 | Two-phase commit for dynamic config, circuit breaker enhancement |
| v0.3.0~v0.3.2 | 2026-04-02~03 | Webhook network port validation, pod readiness watch, hard-rack template fixes |
| v0.4.0 | 2026-04-03 | Helm improvements (aerospikeImages, UI K8S_VERIFY_SSL, PostgreSQL PVC) |
| v0.4.1 | 2026-04-05 | External access support (per-pod LB/NodePort), external endpoints in status |

---

## Cluster Manager Releases

| Version | Date (approx) | Key Changes |
|:---:|:---:|:---|
| v0.2.0~v0.2.3 | 2026-02-28~03-03 | Initial release, basic CRUD UI |
| v0.3.0~v0.3.2 | 2026-03-04~10 | ACKO integration, K8s cluster management UI |
| v0.3.4~v0.3.8 | 2026-03-10~30 | Template scheduling, monitoring, stability |
| v0.4.0 | 2026-03-18 | Feature updates aligned with ACKO v0.1.4+ |
| v0.5.0~v0.5.2 | 2026-04-02~03 | SSE real-time streaming, parallel health checks, per-connection locks |
| v0.6.0~v0.6.1 | 2026-04-03 | K8s server-side pagination, security headers, virtual scrolling |

:::note
Cluster Manager follows continuous deployment aligned with ACKO integration milestones. Version tagging started at v0.2.0.
:::

---

## Plugins Releases

| Version | Date (approx) | Key Changes |
|:---:|:---:|:---|
| v1.0.0 | 2026-03-12 | Initial release: 5 skills, 1 agent, 8 deployment examples, 13 reference docs |

---

## Cross-Project Compatibility Matrix

동일 행의 버전 조합은 통합 테스트가 완료된 호환 버전입니다.

| aerospike-py | ACKO | Cluster Manager | Plugins | Aerospike CE | Period | Notes |
|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| v0.0.1.dev2 | - | - | - | 8.1 | 2026-02-05 | aerospike-py 단독 개발 시작 |
| v0.0.1.alpha | - | - | - | 8.1 | 2026-02-10 | CDT, expression filters 추가 |
| v0.0.1.alpha3 | - | - | - | 8.1 | 2026-02-12 | Async client 도입 |
| v0.0.1.alpha4 | - | - | - | 8.1 | 2026-02-14 | Observability stack 추가 |
| v0.0.1.alpha6 | - | - | - | 8.1 | 2026-02-17 | Type system, NumPy 통합 |
| v0.0.1.beta1 | - | - | - | 8.1 | 2026-02-21 | Performance optimization |
| v0.0.1.beta2 | - | - | - | 8.1 | 2026-02-27 | Quality hardening, i18n |
| v0.0.1.beta2 | v0.0.1~v0.0.9 | - | - | 8.1 | 2026-03-03 | ACKO 개발 시작, 초기 통합 |
| v0.0.2 | v0.1.1~v0.1.3 | v0.1.0 | v1.0.0 | 8.1 | 2026-03-12 | 4개 프로젝트 첫 통합 릴리스 |
| v0.0.3 | v0.1.4~v0.1.5 | v0.1.x | v1.0.0 | 8.1 | 2026-03-19 | API unification, stability |
| v0.0.4 | v0.1.6~v0.1.7 | v0.3.7~v0.4.0 | v1.0.0 | 8.1 | 2026-03-26 | Q1 최종 릴리스 |
| v0.0.5 | v0.1.8 | v0.3.8 | v1.0.0 | 8.1 | 2026-03-30 | Q1→Q2 전환, stability + CI 개선 |
| v0.1.0~v0.1.5 | v0.2.0~v0.3.2 | v0.5.0~v0.5.2 | v1.0.0 | 8.1 | 2026-04-02 | Q2 첫 통합: lifecycle state machine, two-phase config, SSE streaming |
| v0.2.1 | v0.4.1 | v0.6.1 | v1.0.0 | 8.1 | 2026-04-07 | Q2 최신: batch_write API, external access, virtual scrolling |

---

## 버전 관리 규칙

- **aerospike-py**: SemVer + pre-release (`dev`, `alpha`, `beta`, `rc`)
- **ACKO**: SemVer (v0.0.x = pre-stable, v0.1.x = feature-complete)
- **cluster-manager**: SemVer (ACKO 통합 기준)
- **plugins**: SemVer
- **Aerospike CE**: Aerospike Community Edition 서버 버전

## 호환성 보장 범위

- 동일 행의 버전 조합은 통합 테스트 완료
- 다른 행 간 교차 사용은 보장하지 않음
- Aerospike CE 서버 버전은 최소 요구 버전을 의미
- `-` 표시는 해당 시점에 프로젝트가 아직 존재하지 않았음을 의미
