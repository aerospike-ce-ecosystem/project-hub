---
title: "ADR-0048: Record 브라우저 대용량 데이터 통합 성능 전략 — Virtual Scroll + Pagination + Timeout 계층"
description: 대용량 Record Browser를 위한 cursor pagination, virtual scroll, streaming, timeout 전략
sidebar_position: 48
scope: single-repo
repos: [cluster-manager]
tags: [adr, performance, virtual-scroll, pagination, timeout, cluster-manager, record-browser]
last_updated: 2026-04-07
---

# ADR-0048: Record 브라우저 대용량 데이터 통합 성능 전략 — Virtual Scroll + Pagination + Timeout 계층

## 상태

**Proposed**

- 제안일: 2026-04-07
- 관련 이슈: aerospike-ce-ecosystem/project-hub#53
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Q2 2026 roadmap은 Record Browser가 대용량 data set을 안정적으로 처리하도록 개선하는 것을 목표로 합니다. Project goal 2-2는 Backend read/write timeout과 limit 관리를, goal 2-8은 Record Browser의 대용량 성능을 요구합니다.

### 현재 상태

- **Frontend**: Record Browser page(`/browser/[connId]/[ns]/[set]`)가 scan/query 결과를 table로 표시합니다.
- **Backend**: aerospike-py scan/query API로 데이터를 읽으며 `MAX_QUERY_RECORDS = 10,000` hard limit을 적용합니다.
- **기존 Proposed ADR**: ADR-0017은 virtual scroll을, ADR-0018은 K8s server-side pagination을 각각 다룹니다.

### 문제점

1. **Frontend rendering 병목**: 10,000개 이상의 record를 scan하면 DOM node 수가 급격히 늘어 초기 rendering에 2~5초가 걸리고 scrolling frame rate가 10~20 fps까지 떨어집니다. 자세한 분석은 ADR-0017에 있습니다.
2. **Backend memory 사용량**: 전체 scan 결과를 memory에 올리므로 data set이 커질수록 server resource가 빠르게 소모됩니다.
3. **분리된 timeout**: Frontend의 `AbortController`, Backend의 `asyncio.timeout`, Aerospike의 `socket_timeout`이 서로 독립적으로 동작합니다. 상위 layer의 cancellation이 아래로 전달되지 않으면 작업이 남아 있거나 resource가 정리되지 않을 수 있습니다.
4. **end-to-end 전략 부재**: ADR-0017은 Frontend rendering만 다루고 ADR-0018은 K8s cluster 목록만 다룹니다. Record Browser 전체 data flow를 위한 공통 성능 기준이 필요합니다.

최근 Cluster Manager의 83개 commit 가운데 상당수가 browser 성능과 관련돼 있어 개별 변경을 묶는 상위 설계가 필요합니다.

## 결정 (Decision)

> **Record 브라우저에 Cursor-based Pagination(기본 모드) + Virtual Scroll + Streaming(탐색 모드) + 3계층 Timeout 통합 전략을 도입한다.**

이 ADR은 virtual scroll을 다루는 ADR-0017과 server-side pagination을 다루는 ADR-0018을 Record Browser 관점에서 연결합니다. 두 문서에 없던 timeout propagation도 함께 정의합니다.

### 듀얼 모드 설계

1. **기본 mode(Cursor-based Pagination)**: Aerospike partition filter 기반 cursor로 page를 이동합니다. 한 번에 일정량(예: 100개)의 record만 불러오므로 memory 사용량을 예측할 수 있습니다. 일반적인 데이터 확인 작업에는 이 mode를 사용합니다.

2. **탐색 mode(Virtual Scroll + Streaming)**: TanStack Virtual로 화면에 보이는 row만 rendering하고 SSE/`StreamingResponse`로 data를 점진적으로 전달합니다. `max_records` limit을 적용한 scan 결과를 빠르게 훑어볼 때 사용합니다. ADR-0017의 virtual scroll과 ADR-0016의 SSE pattern을 결합합니다.

### 3계층 Timeout 통합

```
Layer 3: Frontend — AbortController (사용자 취소 / 페이지 이탈)
    ↓ signal 전파
Layer 2: Backend — asyncio.timeout (요청 레벨 timeout)
    ↓ cancellation 전파 (ADR-0018 Graceful Cancellation 패턴)
Layer 1: Aerospike — socket_timeout (operation 레벨 timeout)
```

- 상위 layer의 timeout과 cancellation을 하위 layer로 전달합니다. 사용자가 page를 떠나면 Backend scan과 Aerospike operation도 함께 정리됩니다.
- Backend에서는 ADR-0018의 `Request.is_disconnected()` pattern을 사용합니다.

## 대안 (Alternatives Considered)

### Option A: Frontend Virtual Scroll + Backend Streaming
- Frontend: TanStack Virtual 기반 windowed rendering
- Backend: SSE/StreamingResponse로 점진적 데이터 전송
- Aerospike: scan with `max_records` limit
- **장점**: 대량 데이터를 빠르게 훑어볼 수 있는 탐색적 UX, ADR-0017/ADR-0016과 일관
- **단점**: 전체 데이터셋 크기에 비례하는 backend 메모리 사용, 안정적 페이지 탐색 불가

### Option B: Cursor-based Pagination
- Frontend: 페이지 네비게이션 (next/prev)
- Backend: Aerospike digest 기반 cursor 유지
- Aerospike: partition filter 기반 paginated scan
- **장점**: 메모리 사용 예측 가능, 안정적 탐색, K8s pagination ADR-0018과 패턴 일관
- **단점**: 전체 결과를 한눈에 볼 수 없음, 실시간 탐색 UX 제한

### Option C: Client-side Filtering + Server Limit
- Frontend: 전체 데이터 로드 후 client-side sort/filter
- Backend: 고정 limit(예: 1000건)으로 제한
- **장점**: 구현 가장 단순
- **단점**: 대용량 데이터셋에서 한계 명확, 1000건 이상 탐색 불가, 프로젝트 목표 2-8 미충족

### Option A + B 조합 (채택)

- 기본 mode에서는 cursor-based pagination을, 탐색 mode에서는 virtual scroll과 streaming을 사용합니다.
- 세 layer의 timeout을 연결해 어느 지점에서든 cancellation이 전체 작업을 정리하도록 합니다.
- **장점**: 작업 목적에 맞는 UX를 제공하면서 memory 사용량과 탐색 편의성을 함께 관리할 수 있습니다.
- **단점**: Frontend와 Backend가 두 mode를 구현해야 하며 cursor state도 관리해야 합니다.

## 결과 (Consequences)

### 긍정적
- 기본 mode의 pagination으로 10,000개 이상의 record도 예측 가능한 memory 사용량 안에서 탐색할 수 있습니다.
- Virtual scroll은 DOM node 수를 제한하고 pagination은 Backend가 보관하는 record 수를 제한합니다.
- 세 layer의 timeout을 연결해 어느 layer에서 중단해도 전체 pipeline이 정리됩니다.
- ADR-0017(virtual scroll), ADR-0016(SSE), ADR-0018(graceful cancellation)의 pattern을 하나의 flow로 통합합니다.
- 이후 `MAX_QUERY_RECORDS` hard limit을 안전하게 조정할 수 있는 기반이 생깁니다.
- ADR-0006의 backpressure가 request 수를 제한한다면, 이 ADR은 실행 중인 request의 data flow를 제한합니다.

### 부정적
- Frontend와 Backend가 pagination과 streaming을 모두 구현하고 mode 전환도 처리해야 합니다.
- Aerospike partition-based scan은 insertion order를 보장하지 않으므로 cursor page의 record 순서가 달라질 수 있습니다.
- Backend에서 session 또는 token에 연결된 cursor state를 유지해야 합니다.
- Frontend Zustand store가 pagination state, streaming state, mode 전환을 함께 관리해야 합니다.

## 관련 ADR

- [ADR-0017: 가상 스크롤 도입](/docs/architecture/adr/2026-03-30-virtual-scroll-record-browser) — 이 ADR의 "탐색 모드"가 ADR-0017의 TanStack Virtual 결정을 통합
- [ADR-0018: K8s Server-Side Pagination](/docs/architecture/adr/2026-03-30-k8s-server-side-pagination) — cursor 기반 pagination 패턴의 선례. 이 ADR은 동일 패턴을 record browser에 적용
- [ADR-0016: SSE 기반 이벤트 스트리밍](/docs/architecture/adr/2026-03-29-sse-event-streaming) — "탐색 모드"의 streaming 데이터 전송에 SSE/StreamingResponse 패턴 활용
- [ADR-0018: Graceful Cancellation](/docs/architecture/adr/2026-03-30-graceful-cancellation) — 3계층 timeout의 Backend 계층 구현에 `Request.is_disconnected()` 패턴 활용
- [ADR-0006: Semaphore 기반 Backpressure](/docs/architecture/adr/2026-03-05-backpressure-semaphore) — 요청 수 제한(backpressure)과 데이터 흐름 제어(이 ADR)는 상호보완적 리소스 보호 계층
