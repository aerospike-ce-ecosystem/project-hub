---
title: "ADR-0019: Cluster Manager Aerospike Info 명령 배치 집계로 클러스터 Overview 응답 시간 단축"
description: Cluster Manager에서 개별 Aerospike info 호출을 세미콜론 구분자 기반 배치 호출로 통합하고 TTL 캐시를 도입하여 클러스터 Overview 응답 시간을 75% 단축하는 아키텍처 결정.
sidebar_position: 19
scope: single-repo
repos: [cluster-manager]
tags: [adr, performance, cluster-manager, caching, aerospike-info]
last_updated: 2026-03-30
---

# ADR-0019: Cluster Manager Aerospike Info 명령 배치 집계로 클러스터 Overview 응답 시간 단축

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#23
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Cluster Manager의 클러스터 Overview 페이지는 클러스터 상태를 조회할 때 `statistics`, `build`, `edition`, `service` 등 여러 Aerospike info 명령을 **개별적으로** 호출합니다. 이 방식은 동일 노드에 대해 여러 번의 네트워크 왕복을 발생시킵니다.

### 성능 문제의 규모

- 단일 노드 info 왕복: ~2-5ms (로컬), ~10-20ms (원격)
- 4개 info 호출 × 8 노드 = 32 네트워크 왕복
- 원격 클러스터 기준: 32 × 15ms = **~480ms** (Overview 한 번 로드)
- 자동 리프레시(10초 간격) 시 분당 약 **192회** 불필요한 왕복

대규모 클러스터(16+ 노드)에서는 이 문제가 더욱 심화되어 UX에 직접적인 영향을 미칩니다.

### Aerospike Info 프로토콜의 배치 지원

Aerospike `info` 프로토콜은 세미콜론 구분자로 여러 명령을 한 요청에 포함할 수 있습니다:

```
"statistics;build;edition;service"  → 1회 왕복으로 4개 결과 수신
```

현재 `info_all()` API가 이미 단일 문자열 전달을 지원하지만, 호출 측에서 개별 호출을 사용하고 있어 최적화 기회가 활용되지 않고 있습니다.

## 결정 (Decision)

> **개별 info 호출을 세미콜론 구분자 기반 배치 호출로 통합하고, 결과를 Backend에서 TTL 캐시한다.**

### 핵심 구현 요소

#### 1. Info 배치 호출 통합

```python
# Before: 4회 개별 네트워크 왕복
stats = await client.info_all("statistics")
build = await client.info_all("build")
edition = await client.info_all("edition")
service = await client.info_all("service")

# After: 1회 왕복
combined = await client.info_all("statistics;build;edition;service")
stats, build, edition, service = parse_combined_info(combined)
```

#### 2. Backend TTL 캐시

`InfoCache` 클래스를 도입하여 동일 명령 조합에 대해 TTL(5초) 기반 캐시를 제공합니다. 자동 리프레시 시나리오에서 캐시 적중 시 네트워크 호출을 완전히 생략합니다.

#### 3. Overview 엔드포인트 리팩터링

단일 배치 호출로 모든 Overview 데이터를 수집하는 통합 엔드포인트로 리팩터링합니다.

### 성능 개선 예상

| 시나리오 | Before | After | 개선 |
|----------|--------|-------|------|
| 8노드 로컬 | ~120ms | ~30ms | **75% 단축** |
| 8노드 원격 | ~480ms | ~120ms | **75% 단축** |
| 자동 리프레시 (캐시 적용) | ~480ms | ~0ms (캐시 히트) | **~100%** |

## 대안 (Alternatives Considered)

### 대안 1: 프론트엔드 SWR 캐시만 적용

- **장점**: 백엔드 변경 없음
- **단점**: 네트워크 왕복은 여전히 발생, 첫 로드 여전히 느림
- **평가**: 근본적인 네트워크 효율 문제를 해결하지 못함

### 대안 2: 백그라운드 폴링 스레드로 주기적 수집

- **장점**: API 응답이 항상 즉각적 (사전 수집)
- **단점**: 미사용 클러스터에 대해서도 폴링하여 리소스 낭비
- **평가**: 요청 기반 캐시가 더 효율적이며, 연결되지 않은 클러스터에 불필요한 부하 발생

### 대안 3: aerospike-py에 `info_batch()` API 추가

- **장점**: 클라이언트 레벨 최적화로 모든 프로젝트에 혜택
- **단점**: aerospike-py 코어 의존성 변경 필요
- **평가**: 장기 과제로 별도 추적. 단기적으로는 세미콜론 구분자 활용으로 충분

## 결과 (Consequences)

### 긍정적

- 클러스터 Overview 페이지 응답 시간 75% 단축
- 자동 리프레시 시 캐시 적중률에 따라 최대 ~100% 응답 시간 감소
- Aerospike 노드에 대한 불필요한 연결 부하 감소
- 대규모 클러스터(16+ 노드)에서 UX 체감 성능 대폭 개선
- Info 캐시 인프라를 Record 브라우저 카운트 조회 등에 재활용 가능

### 부정적

- 캐시 TTL 동안 최대 5초 지연된 데이터 표시 가능 (모니터링 용도에서는 허용 범위)
- 캐시 무효화 로직 관리 복잡도 증가 (향후 SSE 도입 시 이벤트 기반으로 전환 가능)
- 세미콜론 구분자 파싱 로직 추가 필요
- 노드 간 응답 불일치 시 캐시 정합성 이슈 가능 (노드별 캐시로 해결)

## 관련 ADR

- **[ADR-0009: Unified BatchRecords API](./2026-03-20-unified-batch-records-api.md)** — aerospike-py에서 확립된 "개별→배치 통합" 최적화 패러다임과 동일한 방향
- **[ADR-0016: SSE 기반 실시간 이벤트 스트리밍](./2026-03-29-sse-event-streaming.md)** — 향후 SSE 도입 시 TTL 캐시를 이벤트 기반 캐시 무효화로 진화 가능
- **[ADR-0006: Semaphore 기반 Backpressure](./2026-03-05-backpressure-semaphore.md)** — 동시 요청 수 감소로 backpressure 부하 경감
- **[ADR-0015: asinfo 기반 Health Check](./2026-03-05-asinfo-health-checks.md)** — ACKO에서 asinfo 명령 기반 패턴 검증 선례
