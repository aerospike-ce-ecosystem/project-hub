---
title: "ADR-0018: Cluster Manager K8s API에 Server-Side Pagination 및 Namespace Filtering 도입"
description: Cluster Manager의 K8s 클러스터 목록 API에 Kubernetes 네이티브 cursor 기반 pagination과 namespace 필터링을 도입하여 대규모 환경 확장성을 확보하는 아키텍처 결정.
sidebar_position: 18
scope: single-repo
repos: [cluster-manager]
tags: [adr, pagination, k8s, performance, cluster-manager, filtering]
last_updated: 2026-03-30
---

# ADR-0018: Cluster Manager K8s API에 Server-Side Pagination 및 Namespace Filtering 도입

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#14
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Cluster Manager는 `/api/k8s/clusters` 엔드포인트를 통해 K8s 클러스터 목록을 제공한다. 현재 구현은 모든 AerospikeCluster CR을 한 번에 조회하여 전체 목록을 프론트엔드에 전달하고, 클라이언트 사이드에서 필터링하는 구조이다.

### 현재 문제점

1. **확장성 한계**: 대규모 환경(100+ AerospikeCluster CR)에서 매 조회마다 전체 목록을 K8s API 서버에서 가져오며, JSON 직렬화 및 네트워크 전송 비용이 선형적으로 증가한다.
2. **필터링 비효율**: 특정 namespace의 클러스터만 필요한 경우에도 전체 조회가 필수이며, K8s RBAC 제한으로 특정 namespace만 접근 가능한 경우 에러 가능성이 있다.
3. **프론트엔드 병목 유지**: ADR-0017(가상 스크롤)이 프론트엔드 렌더링을 최적화하지만, 백엔드에서 전체 데이터를 전송하는 네트워크/메모리 병목은 그대로 남아있다.

이 문제는 프로젝트 목표 2-2(Backend read/write timeout·limit 관리), 2-6(ACKO 클러스터 관리 편의성·성능), 2-8(대용량 데이터 성능)과 직결된다.

## 결정 (Decision)

> **Kubernetes List API의 네이티브 `limit`/`continue` 메커니즘을 활용한 cursor 기반 server-side pagination과 namespace 필터링을 도입한다.**

### API 변경

`GET /api/k8s/clusters` 엔드포인트에 다음 query parameter를 추가한다:

- `namespace` (optional): 특정 namespace로 필터링. K8s API 레벨에서 `list_namespaced_custom_object()` 호출
- `limit` (optional, default=20, max=100): 페이지당 반환할 CR 수. K8s List API의 `limit` 파라미터에 직접 매핑
- `continue_token` (optional): K8s API가 반환하는 opaque continue token으로 다음 페이지 조회
- `label_selector` (optional): 라벨 기반 필터링 (예: `env=production`)

### 응답 포맷

```json
{
  "items": [...],
  "total": 150,
  "continue_token": "eyJ...",
  "has_more": true
}
```

query parameter를 생략하면 기존 동작(전체 목록 반환)을 유지하여 하위 호환성을 확보한다.

## 대안 (Alternatives Considered)

### Option A: Cursor 기반 Pagination + Namespace 필터 (채택)
- K8s List API의 `limit` + `continue` 파라미터를 직접 활용
- **장점**: K8s API 서버 레벨에서 pagination이 처리되어 근본적 확장성 확보, RBAC 호환, 네트워크 효율
- **단점**: continue token은 opaque하여 "N번째 페이지로 이동" 불가, K8s API 서버의 continue token 만료(기본 5분) 관리 필요

### Option B: Offset 기반 Pagination
- 전체 조회 후 서버에서 Python 슬라이싱
- **장점**: 구현 간단, 페이지 번호 기반 네비게이션 가능
- **단점**: 매 요청마다 전체 CR 조회 → K8s API 부하 동일, 근본적 확장성 문제 미해결

### Option C: 캐싱 + Incremental Sync (Watch API)
- K8s Watch API로 변경사항만 실시간 추적, 메모리 캐시 유지
- **장점**: API 요청 시 K8s API 호출 없음 (캐시 응답)
- **단점**: ADR-0016(SSE 이벤트 스트리밍)과 기능 중복 가능성 높음, 구현 복잡도 높음, 메모리 관리 부담

Option A가 K8s API의 네이티브 메커니즘을 활용하여 복잡도 대비 효과가 가장 높고, 기존 ADR과의 중복을 피할 수 있어 채택되었다.

## 결과 (Consequences)

### 긍정적
- K8s API 서버 부하 감소: 페이지 단위(20개)로 조회하여 대규모 환경에서도 안정적
- 네트워크 대역폭 절감: 전체 CR 목록 대신 페이지 단위 전송
- RBAC 호환성 개선: `namespace` 파라미터로 접근 가능한 namespace만 조회하여 권한 에러 방지
- ADR-0017(가상 스크롤)과 시너지: 프론트엔드(렌더링) + 백엔드(데이터 전송) 양쪽 최적화 완성
- ADR-0017(Codegen 타입 동기화)과 연계: pagination 응답 타입을 OpenAPI → TypeScript 자동 생성 가능
- 하위 호환성: query parameter 없으면 기존 동작 유지

### 부정적
- Cursor 기반 pagination은 "N번째 페이지로 바로 이동" 기능 구현 불가 → infinite scroll / "Load More" UI 패턴으로 해결
- K8s continue token 만료(기본 5분) 시 재조회 필요 → 프론트엔드에서 token 만료 핸들링 로직 추가
- 프론트엔드 상태 관리 복잡도 증가: pagination state(token, page, loading) 관리를 위한 Zustand store 추가

## 관련 ADR

- [ADR-0017: 가상 스크롤 도입](/docs/architecture/adr/2026-03-30-virtual-scroll-record-browser) — 프론트엔드 렌더링 최적화. 이 ADR은 백엔드 데이터 전송 최적화로 상호 보완
- [ADR-0017: Codegen 타입 동기화](/docs/architecture/adr/2026-03-30-codegen-type-sync) — pagination 응답 타입 동기화에 활용
- [ADR-0016: SSE 이벤트 스트리밍](/docs/architecture/adr/2026-03-29-sse-event-streaming) — Option C(Watch 캐싱)와의 중복을 피하기 위해 cursor 기반 접근 채택
