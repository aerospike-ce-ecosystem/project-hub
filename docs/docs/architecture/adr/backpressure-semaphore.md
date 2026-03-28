---
title: "ADR-0006: Semaphore 기반 Backpressure 메커니즘"
description: aerospike-py에서 동시 요청 과부하 방지를 위한 Semaphore 기반 backpressure를 도입한 아키텍처 결정 기록.
sidebar_position: 8
scope: single-repo
repos: [aerospike-py]
tags: [adr, backpressure, semaphore, performance, aerospike-py]
last_updated: 2026-03-29
---

# ADR-0006: Semaphore 기반 Backpressure 메커니즘

## 상태

**Accepted**

- 제안일: 2026-03-05
- 승인일: 2026-03-10

## 맥락 (Context)

aerospike-py를 사용하는 고부하 환경에서 다음과 같은 문제가 반복적으로 발생했습니다:

### 문제 상황

1. **서버 과부하**: Python asyncio 애플리케이션에서 수천 개의 동시 coroutine이 Aerospike에 요청을 보내면, 서버의 transaction queue가 포화되어 전체 클러스터 성능 저하
2. **Timeout 연쇄 발생**: 서버 과부하로 인해 응답 지연이 발생하면, 대기 중인 요청들이 연쇄적으로 timeout되어 에러율 급증 (thundering herd 패턴)
3. **메모리 증가**: 대기 중인 요청 버퍼가 클라이언트 측에서 무한히 증가하여 OOM 위험
4. **예측 불가능한 에러**: 서버가 과부하 상태에서 반환하는 에러가 다양하고 (timeout, server not available, partition unavailable 등), 클라이언트에서 일관된 에러 처리가 어려움

### 기술적 배경

aerospike-py는 내부적으로 Rust의 tokio 런타임을 사용하며, aerospike-client-rust v2의 connection pool을 통해 서버에 접속합니다. Connection pool의 크기는 유한하지만, asyncio에서 발생하는 동시 요청 수는 이론적으로 무제한입니다. 즉, connection pool이 포화되더라도 요청은 계속 쌓이는 구조였습니다.

### 요구사항

1. 서버에 동시에 전달되는 요청 수를 제한하여 과부하 방지
2. 한도 초과 시 명확하고 일관된 에러를 반환하여 클라이언트가 대응 가능
3. 설정 가능한(configurable) 한도로 다양한 환경에 맞게 조절
4. 성능 오버헤드 최소화 (hot path에서의 latency 증가 최소)

## 결정 (Decision)

> **aerospike-py에 operation-level Semaphore 기반 backpressure를 도입하고, 한도 초과 시 `BackpressureError` 예외를 발생시킨다.**

### 구현 구조

```
Python Application
    ↓ await client.put(key, bins)
aerospike-py (Python layer)
    ↓ Semaphore.acquire() — 초과 시 BackpressureError
Rust layer (PyO3)
    ↓ tokio::sync::Semaphore
aerospike-client-rust v2
    ↓ Connection Pool
Aerospike Server CE
```

### 동작 방식

1. `AsyncClient` 생성 시 `max_concurrent_ops` 파라미터로 Semaphore 크기 설정 (기본값: 1000)
2. 모든 operation (`get`, `put`, `query`, `scan`, `batch_*`, `operate` 등) 호출 시 Semaphore permit 획득 시도
3. permit 획득 성공: operation 실행 후 완료 시 자동 반환
4. permit 획득 실패 (동시 operation이 `max_concurrent_ops` 초과): 즉시 `BackpressureError` 발생 (대기하지 않음)

### API 설계

```python
from aerospike_py import AsyncClient, BackpressureError

# Semaphore 크기 설정
client = await AsyncClient(
    hosts=[("127.0.0.1", 3000)],
    max_concurrent_ops=500,  # 기본값: 1000
)

# 사용 예시
try:
    await client.put(key, bins)
except BackpressureError:
    # 재시도 로직 또는 요청 거부
    await asyncio.sleep(0.01)  # 짧은 backoff
    await client.put(key, bins)  # 재시도
```

### Semaphore 기본값 결정 근거

기본값 1000은 다음 기준으로 설정되었습니다:

- Aerospike CE의 기본 `proto-fd-max` (파일 디스크립터 한도): 15,000
- 일반적인 단일 클라이언트가 사용하는 connection: 64-128개
- connection 당 pipelining 가능한 요청 수: 약 8-16개
- 안전 마진 포함: 128 connections * 8 pipelined = 1024, 반올림하여 1000

## 대안 검토 (Alternatives Considered)

### 대안 1: Client-side Queue (요청 대기열)

- **설명**: Semaphore 대신 내부 asyncio Queue를 두어 초과 요청을 대기열에 보관하고 순차 처리
- **장점**: 요청 유실 없음 (모든 요청이 결국 처리됨), 클라이언트 코드에서 에러 처리 불필요
- **단점**: 대기열이 무한히 증가하여 메모리 문제 발생 가능, 대기 시간이 길어지면 사실상 timeout과 동일, 애플리케이션이 과부하 상태를 인지할 수 없음
- **미선택 사유**: 과부하 상황에서 요청을 즉시 거부(fail-fast)하여 애플리케이션이 스스로 부하를 조절하도록 하는 것이 더 건강한 시스템 패턴

### 대안 2: Connection Pool 크기 제한

- **설명**: Connection pool의 최대 크기를 줄여서 간접적으로 동시 요청 수 제한
- **장점**: 구현 단순, 네트워크 리소스 직접 제어
- **단점**: Connection pool 크기와 동시 요청 수는 1:1 관계가 아님 (하나의 connection에 여러 요청 pipelining 가능), pool 크기를 줄이면 정상 상태에서도 성능 저하
- **미선택 사유**: Connection pool은 네트워크 리소스 관리 목적이며, application-level backpressure와는 별개의 관심사

### 대안 3: Server-side Throttle 의존

- **설명**: Aerospike 서버의 `transaction-threads-limit` 등 서버 측 설정에 의존하여 과부하 방지
- **장점**: 클라이언트 코드 변경 불필요, 서버가 전역적으로 부하 관리
- **단점**: 서버가 거부한 요청은 네트워크 왕복 후에야 에러 발생 (latency 낭비), 서버 에러 메시지가 다양하여 일관된 처리 어려움, 멀티 클라이언트 환경에서 공정한 배분 불가
- **미선택 사유**: 네트워크 왕복 없이 클라이언트 측에서 즉시 거부하는 것이 리소스 효율적이며, 클라이언트별 독립적인 부하 제어 가능

## 결과 (Consequences)

### 긍정적 결과

- **서버 보호**: 클라이언트가 자체적으로 요청량을 제한하여 Aerospike 서버의 transaction queue 포화 방지
- **예측 가능한 에러**: 모든 과부하 상황이 단일 `BackpressureError`로 통일되어 에러 처리 로직 단순화
- **Fail-fast 패턴**: 대기 없이 즉시 에러를 반환하여 애플리케이션이 빠르게 대응 가능 (재시도, 부하 분산, 요청 거부 등)
- **설정 가능**: `max_concurrent_ops` 파라미터로 환경에 맞게 조절 (소규모 개발 환경: 100, 대규모 프로덕션: 5000 등)
- **메트릭 통합**: Prometheus `get_metrics()`에 현재 동시 operation 수, BackpressureError 발생 횟수 노출

### 부정적 결과 / 트레이드오프

- **클라이언트 코드에서 BackpressureError 처리 필요**: 모든 operation 호출부에 try/except 또는 재시도 로직 추가 필요
- **적정 `max_concurrent_ops` 값 튜닝 필요**: 환경마다 최적값이 다르므로 부하 테스트를 통해 결정해야 함
- **기본값 논쟁**: 1000이라는 기본값이 모든 환경에 적합하지 않을 수 있음 (너무 높거나 낮을 수 있음)

### 리스크

- `BackpressureError`를 처리하지 않는 기존 코드에서 예상치 못한 예외 발생 (마이그레이션 가이드 및 문서로 완화)
- Semaphore의 단일 글로벌 한도가 operation 유형별 세밀한 제어를 제공하지 못함 (향후 operation-type별 Semaphore로 확장 가능)

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `aerospike-py` | Semaphore 기반 backpressure 구현, `BackpressureError` 예외 추가, `max_concurrent_ops` 설정 |
| `cluster-manager` | Backend에서 `BackpressureError` 처리 로직 추가 (HTTP 503 반환) |
| `plugins` | aerospike-py-api Skill에서 backpressure 패턴 가이드 추가, aerospike-py-fastapi Skill에서 에러 핸들링 패턴 반영 |

## 참고 자료

- [PR #213 - Semaphore backpressure 도입](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/213)
- [tokio::sync::Semaphore 문서](https://docs.rs/tokio/latest/tokio/sync/struct.Semaphore.html)
- [Backpressure 패턴 - Reactive Manifesto](https://www.reactivemanifesto.org/glossary#Back-Pressure)
- [Aerospike proto-fd-max 설정](https://aerospike.com/docs/server/reference/configuration#proto-fd-max)
