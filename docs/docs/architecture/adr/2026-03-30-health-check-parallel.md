---
title: "ADR-0020: Cluster Manager Health Check 병렬화 및 연결 실패 컨텍스트 전파"
description: Cluster Manager 초기 로딩 시 순차 health check를 병렬화하고, 연결 실패 시 에러 유형을 UI에 표시하여 디버깅 편의성을 개선
sidebar_position: 34
scope: single-repo
repos: [cluster-manager]
tags: [adr, cluster-manager, health-check, performance, ux]
last_updated: 2026-03-30
---

# ADR-0020: Cluster Manager Health Check 병렬화 및 연결 실패 컨텍스트 전파

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#30
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Cluster Manager의 초기 로딩 시 모든 등록된 연결에 대해 health check를 수행한다. 현재 구현은 두 가지 문제를 가지고 있다:

### 1. 순차 Health Check로 인한 초기 로딩 지연

`connection-store.ts`의 `fetchAllHealth`는 각 연결에 대해 `fetchConnectionHealth`를 호출하지만, 브라우저의 HTTP/1.1 동일 호스트 동시 연결 제한(6개)으로 인해 실질적인 병목이 발생한다. 연결 10개 기준으로 평균 5초/연결 × 10 = ~50초의 초기 로딩 시간이 소요된다.

### 2. 에러 컨텍스트 손실

연결 실패 시 `HealthStatus`에 `connected: false`만 저장되어 사용자가 실패 원인(네트워크 오류, 인증 실패, 타임아웃, 호스트 도달 불가)을 구분할 수 없다. 디버깅을 위해 브라우저 DevTools를 열어야 하는 불편함이 존재한다.

이 두 문제는 연결 수가 증가할수록 사용자 경험을 크게 저하시키며, Cluster Manager의 핵심 가치인 편의성 있는 클러스터 관리를 방해한다.

## 결정 (Decision)

> **Health check를 `Promise.allSettled` 기반으로 병렬 실행하고, `HealthStatus` 인터페이스에 구조화된 에러 컨텍스트를 추가한다.**

### 1. Promise.allSettled 기반 병렬 실행 + 진행률 표시

```typescript
fetchAllHealth: async () => {
  const { connections } = get();
  const results = await Promise.allSettled(
    connections.map((conn) => fetchConnectionHealth(conn.id))
  );
  // 진행률: `${fulfilled.length}/${total} checked`
},
```

`Promise.allSettled`를 사용하여 개별 연결 실패가 전체 health check를 중단하지 않도록 한다. 진행률 표시를 통해 사용자에게 점진적 피드백을 제공한다.

### 2. HealthStatus에 에러 컨텍스트 추가

```typescript
interface HealthStatus {
  connected: boolean;
  nodeCount: number;
  namespaceCount: number;
  error?: {
    type: 'network' | 'auth' | 'timeout' | 'unknown';
    message: string;
    timestamp: number;
  };
}
```

Optional `error` 필드를 추가하여 기존 API 호환성을 유지하면서 에러 정보를 전파한다.

### 3. Backend health check 응답에 에러 유형 포함

503 응답 시 `error_type` 필드와 `Retry-After` 헤더를 추가하여 Frontend가 에러를 구조화된 형태로 수신할 수 있도록 한다.

## 대안 (Alternatives Considered)

### 대안 1: 현재 순차 실행 유지 + 개별 타임아웃 단축

- **장점**: 구현 변경 최소화
- **단점**: 근본적인 성능 문제 미해결. 타임아웃을 줄이면 느린 네트워크에서 false negative 증가

### 대안 2: Web Worker 기반 병렬 실행

- **장점**: 메인 스레드 블로킹 없음
- **단점**: 과도한 복잡도. health check는 CPU-intensive 작업이 아니므로 Web Worker가 불필요

### 대안 3: SSE 기반 실시간 health check 스트리밍

- **장점**: ADR-0016(SSE 이벤트 스트리밍)과 통합 가능
- **단점**: SSE는 상태 변경 이벤트에 적합하며, 초기 로딩 시 일괄 health check와는 목적이 다름. SSE 도입 후에도 초기 병렬 health check는 여전히 필요

**추천안 선택 이유**: `Promise.allSettled`는 JavaScript 네이티브 API로 추가 의존성 없이 최소한의 변경으로 최대 효과(10x 성능 개선)를 달성한다. 에러 컨텍스트 추가는 ADR-0019의 구조화된 에러 코드 패턴과 일관된 방향이다.

## 결과 (Consequences)

### 긍정적

- **초기 로딩 시간 10x 개선**: 10개 연결 기준 ~50초 → ~5초
- **에러 원인 즉시 파악**: DevTools 없이 UI에서 네트워크/인증/타임아웃 등 에러 유형 확인 가능
- **점진적 UX**: 전체 완료까지 빈 화면 대신 진행률 표시 + 개별 결과 점진적 업데이트
- **기존 API 호환성 유지**: HealthStatus의 `error` 필드는 optional이므로 기존 코드에 영향 없음
- **에코시스템 일관성**: ADR-0019(구조화된 에러 코드)의 Frontend 적용 사례로 패턴 확립

### 부정적

- **브라우저 동시 연결 제한**: HTTP/1.1 환경에서 6개 이상의 동시 요청은 여전히 큐잉됨 (HTTP/2 사용 시 해소)
- **Backend 부하 순간 증가**: 모든 health check가 동시에 도착하므로 Backend에 순간적 부하 증가 가능 (단, health check는 경량 요청으로 영향 미미)

## 관련 ADR

- [ADR-0015: asinfo 기반 Health Check](/docs/architecture/adr/2026-03-05-asinfo-health-checks) — ACKO K8s 레벨의 health check 전략. 본 ADR은 Cluster Manager UI 레벨의 health check 최적화로 계층이 다름
- [ADR-0016: SSE 기반 실시간 이벤트 스트리밍](/docs/architecture/adr/2026-03-29-sse-event-streaming) — 실시간 상태 변경 스트리밍과 상호 보완적. SSE 도입 후에도 초기 health check 병렬화는 별도로 필요
- [ADR-0019: 구조화된 에러 코드 체계](/docs/architecture/adr/2026-03-30-structured-result-code) — aerospike-py의 구조화된 에러 분류 패턴을 Frontend HealthStatus에도 적용하는 일관된 방향
- [ADR-0006: Semaphore 기반 Backpressure](/docs/architecture/adr/2026-03-05-backpressure-semaphore) — 동시성 제어 패턴이 에코시스템에 확립되어 있으며, Promise.allSettled도 같은 맥락의 동시 실행 관리
