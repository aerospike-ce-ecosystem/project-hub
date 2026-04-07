---
title: "ADR-0039: Record 브라우저 대용량 데이터 통합 성능 전략 — Virtual Scroll + Pagination + Timeout 계층"
description: Record 브라우저에서 대용량 데이터셋을 안정적으로 탐색하기 위해 가상 스크롤, cursor 기반 pagination, 3계층 timeout을 통합하는 상위 아키텍처 결정.
sidebar_position: 39
scope: single-repo
repos: [cluster-manager]
tags: [adr, performance, virtual-scroll, pagination, timeout, cluster-manager, record-browser]
last_updated: 2026-04-07
---

# ADR-0039: Record 브라우저 대용량 데이터 통합 성능 전략 — Virtual Scroll + Pagination + Timeout 계층

## 상태

**Proposed**

- 제안일: 2026-04-07
- 관련 이슈: aerospike-ce-ecosystem/project-hub#53
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Q2 2026 로드맵에 "Record 브라우저 대용량 데이터 성능 최적화"가 명시되어 있으며, 프로젝트 목표 2-2("Backend read/write timeout·limit 관리")와 2-8("Record 브라우저 대용량 데이터 성능")이 이를 뒷받침한다.

### 현재 상태

- **Frontend**: Record browser 페이지(`/browser/[connId]/[ns]/[set]`)에서 scan/query 결과를 테이블로 표시
- **Backend**: aerospike-py scan/query API로 데이터 조회, `MAX_QUERY_RECORDS = 10,000` 하드 리밋 적용
- **기존 Proposed ADR**: ADR-0017(가상 스크롤), ADR-0018(K8s server-side pagination)이 개별적으로 존재

### 문제점

1. **Frontend 렌더링 병목**: 대용량 set(10K+ records) scan 시 DOM 노드 폭증, 초기 렌더링 2-5초 지연, 스크롤 시 10-20fps까지 하락 (ADR-0017에서 상세 분석)
2. **Backend 메모리 적재**: 전체 scan 결과를 메모리에 적재하여 대용량 데이터셋에서 서버 리소스 압박
3. **Timeout 미통합**: Frontend(AbortController) ↔ Backend(asyncio.timeout) ↔ Aerospike(socket_timeout) 3계층 timeout이 독립적으로 동작하여, 한 계층의 timeout이 다른 계층으로 전파되지 않아 hang 및 리소스 누수 발생
4. **통합 전략 부재**: ADR-0017(가상 스크롤)은 frontend 렌더링만, ADR-0018(K8s pagination)은 K8s 클러스터 목록만 다루며, record browser의 end-to-end 성능 전략이 부재

최근 cluster-manager에 83 commits가 집중되어 있으며, 상당수가 browser 성능 관련 작업이다.

## 결정 (Decision)

> **Record 브라우저에 Cursor-based Pagination(기본 모드) + Virtual Scroll + Streaming(탐색 모드) + 3계층 Timeout 통합 전략을 도입한다.**

이 ADR은 기존 Proposed ADR 2건(ADR-0017 가상 스크롤, ADR-0018 서버 사이드 페이지네이션)을 통합하는 상위 결정이며, 누락되었던 timeout 통합 전략을 추가한다.

### 듀얼 모드 설계

1. **기본 모드 (Cursor-based Pagination)**: Aerospike partition filter 기반 cursor로 안정적 페이지 탐색. 일정량(예: 100건)씩 로드하여 메모리 사용을 예측 가능하게 제어. 대부분의 일상적 데이터 확인 작업에 적합.

2. **탐색 모드 (Virtual Scroll + Streaming)**: TanStack Virtual 기반 가상 스크롤 + SSE/StreamingResponse로 점진적 데이터 전송. scan with `max_records` limit으로 대량 데이터를 빠르게 훑어보는 용도. ADR-0017의 virtual scroll과 ADR-0016의 SSE 패턴을 결합.

### 3계층 Timeout 통합

```
Layer 3: Frontend — AbortController (사용자 취소 / 페이지 이탈)
    ↓ signal 전파
Layer 2: Backend — asyncio.timeout (요청 레벨 timeout)
    ↓ cancellation 전파 (ADR-0018 Graceful Cancellation 패턴)
Layer 1: Aerospike — socket_timeout (operation 레벨 timeout)
```

- 상위 계층의 timeout/cancellation이 하위 계층으로 전파되어, 사용자가 페이지를 떠나면 Backend scan과 Aerospike operation이 모두 정리됨
- ADR-0018(Graceful Cancellation)의 `Request.is_disconnected()` 패턴과 자연스럽게 통합

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
- 기본 모드로 cursor-based pagination, 탐색 모드로 virtual scroll + streaming
- 3계층 timeout으로 모든 경로에서 hang 방지
- **장점**: 용도별 최적 UX 제공, 메모리 제어와 탐색성 모두 확보
- **단점**: 구현 복잡성(2가지 모드), cursor 상태 관리 overhead

## 결과 (Consequences)

### 긍정적
- 대용량 데이터셋(10K+ records)에서도 안정적 브라우징 — 기본 모드의 pagination으로 메모리 사용 예측 가능
- Frontend/Backend 양쪽 메모리 사용량 제어 — virtual scroll로 DOM 노드 수 일정, pagination으로 backend 메모리 일정
- 3계층 timeout 통합으로 어떤 계층에서든 hang 발생 시 전체 파이프라인 정리
- 기존 ADR-0017(가상 스크롤), ADR-0016(SSE), ADR-0018(Graceful Cancellation)의 패턴을 자연스럽게 통합하여 아키텍처 일관성 확보
- `MAX_QUERY_RECORDS` 하드 리밋을 점진적으로 완화할 수 있는 기반 마련
- ADR-0006(Backpressure Semaphore)과 상호보완 — backpressure는 요청 수 제한, 이 ADR은 실행 중 요청의 데이터 흐름 제어

### 부정적
- 구현 복잡성 증가: 2가지 모드(pagination/streaming)의 Frontend/Backend 양쪽 구현 및 모드 전환 로직 필요
- Aerospike partition-based scan의 순서 비보장: cursor 기반 pagination에서 레코드 순서가 insertion order와 다를 수 있음
- Cursor 상태 관리 overhead: Backend에서 session 또는 token 기반 cursor 상태 유지 필요
- Frontend 상태 관리 복잡도 증가: pagination state, streaming state, 모드 전환을 위한 Zustand store 추가

## 관련 ADR

- [ADR-0017: 가상 스크롤 도입](/docs/architecture/adr/2026-03-30-virtual-scroll-record-browser) — 이 ADR의 "탐색 모드"가 ADR-0017의 TanStack Virtual 결정을 통합
- [ADR-0018: K8s Server-Side Pagination](/docs/architecture/adr/2026-03-30-k8s-server-side-pagination) — cursor 기반 pagination 패턴의 선례. 이 ADR은 동일 패턴을 record browser에 적용
- [ADR-0016: SSE 기반 이벤트 스트리밍](/docs/architecture/adr/2026-03-29-sse-event-streaming) — "탐색 모드"의 streaming 데이터 전송에 SSE/StreamingResponse 패턴 활용
- [ADR-0018: Graceful Cancellation](/docs/architecture/adr/2026-03-30-graceful-cancellation) — 3계층 timeout의 Backend 계층 구현에 `Request.is_disconnected()` 패턴 활용
- [ADR-0006: Semaphore 기반 Backpressure](/docs/architecture/adr/2026-03-05-backpressure-semaphore) — 요청 수 제한(backpressure)과 데이터 흐름 제어(이 ADR)는 상호보완적 리소스 보호 계층
