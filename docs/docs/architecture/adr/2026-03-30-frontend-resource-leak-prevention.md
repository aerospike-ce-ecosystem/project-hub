---
title: "ADR-0033: Cluster Manager Frontend 리소스 누수 방지 및 API 호출 최적화"
description: Cluster Manager 프론트엔드에서 폴링 메모리 누수, AbortController 미사용, 상태 초기화 누락, 에러 정보 미노출 문제를 해결하는 표준 패턴 도입.
sidebar_position: 33
scope: single-repo
repos: [cluster-manager]
tags: [adr, performance, frontend, cluster-manager, resource-management, optimization]
last_updated: 2026-03-30
---

# ADR-0033: Cluster Manager Frontend 리소스 누수 방지 및 API 호출 최적화

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#35
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Cluster Manager frontend에서 resource가 정리되지 않거나 불필요한 API request가 계속되는 pattern을 확인했습니다. 이 문제는 UI 상태를 부정확하게 만들고 backend 부하를 높입니다.

### 문제 1: K8s 클러스터 폴링 메모리 누수

`k8s-cluster-store.ts`의 `startDetailPolling()`은 module-level `_k8sDetailIntervalId`를 설정합니다. Component가 unmount될 때 `stopDetailPolling()`을 호출하지 않으면 interval이 background에서 계속 실행됩니다. 그 결과 store 상태를 불필요하게 갱신하고 API server에 request를 계속 보냅니다.

ADR-0016에서 SSE 기반 실시간 이벤트 스트리밍이 제안되어 장기적으로 폴링이 SSE로 대체될 예정이나, 전환 과도기 및 SSE fallback 상황에서 폴링 정리 패턴은 여전히 필수적입니다.

### 문제 2: useAsyncData Hook의 AbortController 미사용

`use-async-data.ts`는 `requestIdRef`로 stale update만 막습니다. 실제 fetch request는 완료될 때까지 실행되므로 dependency가 빠르게 바뀌면 여러 request가 동시에 in-flight 상태로 남아 network bandwidth와 CPU를 사용합니다.

ADR-0018에서 백엔드 Graceful Cancellation이 제안되었으나, 프론트엔드에서 AbortController로 취소 시그널을 전파해야 백엔드까지 완전한 cancellation 체인이 구축됩니다.

### 문제 3: 네임스페이스 전환 시 페이지네이션 상태 미초기화

`browser-store.ts`에서 `setNamespace()`를 호출하면 record와 `selectedSet`만 초기화됩니다. Pagination 상태인 `pageSize`, `total`, `hasMore`가 남아 이전 namespace의 정보가 새 namespace 화면에 표시됩니다.

### 문제 4: Connection Health Check 에러 정보 미노출

`connection-store.ts`에서 health check 실패 시 `connected: false`만 설정하고 에러 상세 정보는 `console.log`로만 출력하여, 사용자가 연결 실패 원인(네트워크 오류 vs 인증 오류 vs 서버 다운)을 파악할 수 없습니다.

## 결정 (Decision)

> **프론트엔드 리소스 관리 표준 패턴 4가지를 도입하여 메모리 누수를 방지하고 불필요한 API 호출을 제거한다.**

### 1. 폴링 자동 정리 패턴 표준화

useEffect cleanup과 연동하여 컴포넌트 unmount 시 자동으로 폴링을 중지합니다.

```typescript
useEffect(() => {
  const cleanup = startDetailPolling(clusterId);
  return () => cleanup();
}, [clusterId]);
```

### 2. useAsyncData에 AbortController 도입

브라우저 내장 AbortController API를 활용하여 의존성 변경 시 이전 요청을 자동 취소합니다. ADR-0018의 백엔드 Graceful Cancellation과 결합하여 완전한 요청 취소 체인을 구축합니다.

```typescript
useEffect(() => {
  const controller = new AbortController();
  fetchFn({ signal: controller.signal })
    .then(data => { if (!controller.signal.aborted) setData(data); })
    .catch(err => { if (!controller.signal.aborted) setError(err); });
  return () => controller.abort();
}, deps);
```

### 3. Store 전환 시 전체 관련 상태 리셋

`setNamespace()` 호출 시 records, selectedSet뿐만 아니라 pageSize, total, hasMore 등 페이지네이션 관련 상태를 전체 초기화합니다.

### 4. 에러 상태 구조화

ConnectionHealth 인터페이스에 구조화된 에러 정보를 추가하여 사용자에게 구체적인 연결 실패 원인을 제공합니다.

```typescript
interface ConnectionHealth {
  connected: boolean;
  error?: { code: string; message: string; retryable: boolean };
  lastCheckedAt: number;
}
```

## 대안 (Alternatives Considered)

### Option A: 개별 문제별 점진적 수정 (현재 유지 + 최소 수정)

- **장점**: 변경 범위 최소화, regression 위험 낮음
- **단점**: 표준 패턴 없이 각 개발자가 다른 방식으로 수정할 수 있어 일관성 저하. 근본 원인(패턴 부재)이 해결되지 않아 새로운 Store/Hook에서 동일 문제 재발 가능
- **평가**: 단기적으로 안전하나 장기적으로 기술 부채 축적

### Option B: 표준 패턴 도입 및 일괄 적용 — 선택됨

- **장점**: 4가지 표준 패턴을 정의하고 기존 코드에 일괄 적용하여 일관성 확보. 새로운 Store/Hook 개발 시 가이드라인으로 활용 가능
- **단점**: 수정 범위가 넓어 regression 위험 존재하나, 각 변경은 표준 React/TypeScript 패턴이므로 복잡도 낮음

### Option C: React Query(TanStack Query) 도입

- **장점**: 캐싱, 재시도, 자동 refetch, garbage collection 등 데이터 fetching 관련 모든 문제를 라이브러리 수준에서 해결
- **단점**: 대규모 마이그레이션 필요. 기존 Zustand Store 기반 데이터 관리 패턴과의 공존 기간 동안 복잡도 증가. 외부 의존성 추가
- **평가**: 장기적으로 검토할 가치가 있으나, 현재 4가지 문제 해결을 위해 도입하기에는 과도한 변경. 향후 별도 ADR로 검토 가능

## 결과 (Consequences)

### 긍정적
- 프론트엔드 메모리 사용량 감소 (폴링 인터벌 누수 제거)
- 백엔드 API 호출 30-50% 감소 (AbortController + stale 요청 제거)
- ADR-0018 (Graceful Cancellation)과 결합하여 프론트엔드→백엔드 완전한 요청 취소 체인 구축
- 사용자 경험 향상 (정확한 에러 메시지, 일관된 UI 상태)
- 대규모 클러스터 관리 시 브라우저 성능 안정성 확보 (프로젝트 목표 2-8 부합)
- ADR-0016 (SSE) 전환 과도기에서의 폴링 안정성 확보

### 부정적
- 기존 Store/Hook 코드 수정 범위가 넓어 regression 위험 존재
- useAsyncData에 AbortController 도입 시 기존 fetchFn 시그니처에 signal 파라미터 추가 필요 — 호출부 업데이트 필요
- 에러 상태 구조화에 따른 UI 컴포넌트 수정 (에러 메시지 표시 영역 추가)

## 관련 ADR

- [ADR-0016: SSE 기반 실시간 이벤트 스트리밍](/docs/architecture/adr/2026-03-29-sse-event-streaming) — 장기적으로 폴링을 SSE로 대체하지만, 전환 과도기 및 fallback에서 폴링 정리 패턴은 여전히 필요
- [ADR-0018: Graceful Cancellation](/docs/architecture/adr/2026-03-30-graceful-cancellation) — 백엔드 cancellation과 프론트엔드 AbortController가 결합하여 완전한 요청 취소 체인 구축
- [ADR-0017: 가상 스크롤 도입](/docs/architecture/adr/2026-03-30-virtual-scroll-record-browser) — 레코드 브라우저 성능 개선과 함께 상태 관리 정합성 향상
- [ADR-0005: DaisyUI 제거 및 Tailwind CSS 4 전환](/docs/architecture/adr/2026-02-25-daisyui-removal) — 프론트엔드 기술 스택 기준 확립
