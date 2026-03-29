---
title: "ADR-0016: SSE 기반 실시간 이벤트 스트리밍 도입"
description: Cluster Manager에서 폴링 방식 대신 Server-Sent Events(SSE)를 도입하여 실시간 클러스터 상태 이벤트를 스트리밍하는 아키텍처 결정.
sidebar_position: 16
scope: single-repo
repos: [cluster-manager]
tags: [adr, sse, real-time, cluster-manager, fastapi, event-streaming]
last_updated: 2026-03-29
---

# ADR-0016: SSE 기반 실시간 이벤트 스트리밍 도입

## 상태

**Proposed**

- 제안일: 2026-03-29
- 관련 이슈: aerospike-ce-ecosystem/project-hub#2

## 맥락 (Context)

현재 Cluster Manager UI는 클러스터 상태를 주기적 폴링(REST API 호출)으로 조회합니다. 이 방식은 다음과 같은 문제를 야기합니다:

1. **이벤트 감지 지연**: 폴링 주기(예: 5초)에 의존하여 migration 시작, split-brain 발생 등 중요 이벤트의 감지가 지연됨
2. **불필요한 서버 부하**: 상태 변화가 없어도 주기적으로 API를 호출하여 서버 리소스 낭비
3. **다중 탭 부하 증폭**: 사용자가 여러 브라우저 탭을 열면 폴링 요청이 탭 수만큼 증폭
4. **UX 저하**: 실시간 모니터링이 중요한 운영 상황(migration 모니터링, pod 상태 변경, scale 작업)에서 사용자 경험이 저하

ADR-0014에서 asyncpg 기반 PostgreSQL로 마이그레이션하면서 백엔드의 비동기 처리 기반이 강화되었고, 이를 활용한 실시간 이벤트 푸시가 기술적으로 가능한 상태입니다.

## 결정 (Decision)

> **Server-Sent Events(SSE)를 사용하여 서버→클라이언트 방향의 실시간 이벤트 스트리밍을 구현한다.**

FastAPI의 `StreamingResponse`를 활용하여 SSE 엔드포인트를 제공하고, 프론트엔드에서는 브라우저 내장 `EventSource` API로 이벤트를 수신합니다.

### 핵심 설계

- **SSE 엔드포인트**: `/api/v1/events/stream`으로 클러스터 상태 변경 이벤트를 실시간 전달
- **이벤트 브로커**: 백엔드 내부에 이벤트 발행/구독 모듈을 두어, 클러스터 상태 변경 시 구독 중인 SSE 연결에 이벤트 전파
- **이벤트 타입**: 클러스터 상태 변경, pod 상태 변경, migration 진행 상태 등 구조화된 이벤트 타입 정의
- **점진적 전환**: 기존 폴링 로직은 SSE 연결 실패 시 fallback으로 유지하며, 점진적으로 SSE로 전환

### SSE를 선택한 이유

1. **단방향 푸시 적합**: Cluster Manager의 주요 요구사항은 서버→클라이언트 방향의 상태 푸시이며, 클라이언트→서버 통신은 기존 REST API로 충분
2. **HTTP 기반 호환성**: Kubernetes Ingress, 리버스 프록시, 로드밸런서 환경에서 WebSocket보다 안정적
3. **구현 간결성**: FastAPI `StreamingResponse` + 브라우저 `EventSource`로 간결하게 구현 가능
4. **자동 재연결**: `EventSource` API가 연결 끊김 시 자동 재연결을 내장하여 reconnection 복잡도 감소

## 대안 (Alternatives Considered)

### Option A: WebSocket 기반 실시간 이벤트 스트리밍

- **장점**: 양방향 통신 가능, 진정한 실시간
- **단점**:
  - WebSocket 연결 관리 복잡도 (handshake, heartbeat, reconnection 직접 구현)
  - K8s Ingress/프록시 환경에서 WebSocket 업그레이드 지원 필요 (일부 환경에서 불안정)
  - 양방향 통신이 이 사용 사례에서는 불필요한 오버엔지니어링
- **기각 사유**: 요구사항 대비 과도한 복잡도. 단방향 푸시만 필요한 상황에서 WebSocket은 불필요한 복잡성을 추가

### Option B: SSE (Server-Sent Events) — 선택됨

- **장점**: HTTP 기반 프록시 호환성, 자동 재연결, 구현 간결성
- **단점**: 단방향만 가능 (클라이언트→서버는 REST API 사용)

### Option C: 현재 폴링 방식 유지 + 간격 최적화

- **장점**: 구현 변경 최소, 기존 코드 안정성 유지
- **단점**:
  - 근본적 해결이 아님 — 적응형 폴링 간격을 도입해도 이벤트 감지 지연은 여전히 존재
  - 다중 탭 부하 증폭 문제 해결 불가
  - 실시간 모니터링 UX 한계
- **기각 사유**: 장기적으로 사용자 경험과 서버 효율성 모두에서 한계가 명확

## 결과 (Consequences)

### 긍정적
- 실시간 이벤트 감지로 migration, split-brain, pod 상태 변경 등 중요 이벤트를 즉시 UI에 반영
- 불필요한 폴링 제거로 서버 부하 감소 및 네트워크 효율성 향상
- 사용자 경험 대폭 향상 — 대시보드에서 실시간 클러스터 상태 확인 가능
- EventSource 자동 재연결로 안정적인 연결 유지
- FastAPI async 아키텍처와 자연스러운 통합

### 부정적
- SSE 연결 관리 로직 추가 (이벤트 브로커, 구독 관리)
- 연결 끊김 시 누락된 이벤트 처리 전략 필요 (재연결 후 상태 동기화)
- 기존 폴링 기반 코드와의 공존 기간 동안 두 가지 패턴 유지 필요
- SSE 연결 수 증가 시 서버 측 연결 관리 부담 (다수 동시 접속 시)

## 관련 ADR

- [ADR-0014: SQLite에서 PostgreSQL로 마이그레이션](/docs/architecture/adr/2026-02-10-postgresql-migration) — asyncpg 기반 비동기 백엔드로 SSE StreamingResponse 구현 기반 확보
- [ADR-0010: 3-Layer Observability Stack](/docs/architecture/adr/2026-02-05-observability-stack) — SSE 이벤트에 대한 메트릭/트레이싱을 관측성 스택과 통합 가능
- [ADR-0012: Pod Readiness Gates](/docs/architecture/adr/2026-02-20-pod-readiness-gates) — Pod readiness 상태 변경을 SSE 이벤트로 실시간 전달 가능
- [ADR-0013: Reconciliation Circuit Breaker](/docs/architecture/adr/2026-03-01-reconciliation-circuit-breaker) — Circuit breaker 상태 변경을 SSE 이벤트로 UI에 알림 가능
