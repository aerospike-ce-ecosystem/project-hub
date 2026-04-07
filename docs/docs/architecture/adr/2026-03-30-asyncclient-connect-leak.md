---
title: "ADR-0020: aerospike-py AsyncClient 동시 connect() 호출 시 연결 누수 방지 및 lifecycle 안전성 강화"
description: aerospike-py AsyncClient에서 동시 connect() 호출 시 발생하는 연결 누수를 AtomicBool guard와 상태 머신으로 방지하고, close() 후 재연결 시 전체 상태를 초기화하는 아키텍처 결정.
sidebar_position: 29
scope: single-repo
repos: [aerospike-py]
tags: [adr, aerospike-py, async, connection-safety, lifecycle, concurrency]
last_updated: 2026-03-30
---

# ADR-0020: aerospike-py AsyncClient 동시 connect() 호출 시 연결 누수 방지 및 lifecycle 안전성 강화

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#33
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

aerospike-py의 `AsyncClient`에서 `connect()` 메서드를 동시에 여러 코루틴에서 호출할 경우 **연결 누수**가 발생할 수 있습니다. 이는 Rust/PyO3 내부의 `ArcSwap::store` 호출이 atomic이지만, 두 코루틴이 각각 독립적으로 client를 생성한 후 순차적으로 store하면 먼저 저장된 client의 참조가 소실되어 `close()`가 호출되지 않는 문제입니다.

### 문제 1: 동시 connect() 호출 시 연결 누수

```rust
// async_client.rs, lines 105-108
future_into_py(py, async move {
    let client = AsClient::new(...).await.map_err(as_to_pyerr)?;
    inner.store(Some(Arc::new(client)));  // 두 코루틴이 동시에 도달하면?
    Ok(())
})
```

두 코루틴이 동시에 `connect()`를 호출하면:
- 코루틴 A: client_A 생성 → `inner.store(client_A)`
- 코루틴 B: client_B 생성 → `inner.store(client_B)` → **client_A의 참조 소실, close() 미호출**

장기 실행 서비스(FastAPI 등)에서 재연결 로직이 동시에 트리거되면 연결이 누적되어 서버 리소스를 고갈시킬 수 있습니다.

### 문제 2: close() 후 재연결 시 상태 불일치

`close()`는 `inner`만 `None`으로 설정하지만, `connection_info`(Arc)와 `limiter`(Arc)는 이전 연결의 값을 유지합니다. 재연결 시 이전 메트릭/OTel 속성이 새 연결에 혼입되어 관측 데이터의 정확성이 저하됩니다.

### 문제 3: AEROSPIKE_RUNTIME_WORKERS 상한 미검증

`runtime.rs` (lines 31-37)에서 환경변수 `AEROSPIKE_RUNTIME_WORKERS`의 하한(1)만 검증하고 상한이 없어, 비정상적으로 큰 값 설정 시 Tokio 런타임 생성 실패로 Python import 시 panic이 발생합니다. 이 문제는 ADR-0018(Tokio Worker Autotuning)과 범위가 중복되므로, 해당 ADR에서 함께 처리하는 것을 권장합니다.

## 결정 (Decision)

> **connect()에 AtomicBool guard를 도입하여 동시 연결 시도를 방지하고, Client lifecycle을 상태 머신으로 명확화하며, close() 시 전체 내부 상태를 초기화한다.**

### 세부 결정 사항

1. **AtomicBool 기반 connecting guard**: `is_connecting` 플래그를 `compare_exchange`로 설정하여, 이미 연결 중인 경우 후속 connect() 호출이 즉시 에러를 반환하도록 합니다.

2. **close() 시 전체 상태 리셋**: `inner` 뿐만 아니라 `connection_info`, `limiter` 등 모든 연결 관련 상태를 초기화하여, 재연결 시 깨끗한 상태에서 시작합니다.

3. **Client lifecycle 상태 머신**: `Disconnected → Connecting → Connected → Closing → Disconnected` 전이를 명확히 정의하여, 잘못된 상태 전이를 컴파일 타임 또는 런타임에서 방지합니다.

4. **Worker thread 상한 검증**: ADR-0018(Tokio Worker Autotuning)과 통합하여 처리합니다. 이 ADR에서는 문제 1과 2에 집중합니다.

## 대안 (Alternatives Considered)

### 대안 1: connect()를 idempotent으로 구현

이미 연결된 상태면 기존 연결을 그대로 반환하는 방식입니다.

- **장점**: 가장 간단한 구현, 사용자 코드 변경 불필요
- **단점**: 설정 변경 후 재연결하려는 시나리오를 차단함. 예를 들어 클러스터 마이그레이션 중 다른 seed node로 재연결해야 할 때 close() → connect()를 강제하게 됨
- **판단**: 단순하지만 유연성이 부족하여 장기적으로 제약이 될 수 있음

### 대안 2: Mutex 기반 connect 직렬화

`tokio::sync::Mutex`로 connect()를 직렬화하여 동시 호출을 순차 실행하는 방식입니다.

- **장점**: 완전한 동시성 안전성 보장, 두 번째 호출도 성공적으로 완료
- **단점**: async context에서 Mutex contention 발생 가능, 두 번째 connect()가 첫 번째 연결을 덮어쓰는 문제는 여전히 존재
- **판단**: Mutex 자체가 race condition을 완전히 해결하지 못하며, AtomicBool guard가 더 명확한 의미를 전달

### 선택: AtomicBool guard + 상태 머신 (제안안)

- **장점**: lock-free로 성능 부담 최소화, 상태 전이가 명확하여 디버깅 용이, Rust의 타입 시스템과 자연스럽게 통합
- **단점**: 동시 connect() 중 하나가 에러를 받으므로 사용자 코드에서 처리 필요
- **판단**: 안전성과 성능의 최적 균형점

## 결과 (Consequences)

### 긍정적

- 장기 실행 서비스에서 연결 누수로 인한 리소스 고갈 방지
- OTel 메트릭의 정확성 보장 (이전 연결 메트릭 혼입 차단)
- Client lifecycle이 명확해져 디버깅 및 유지보수 용이성 향상
- ADR-0006(Backpressure Semaphore)의 limiter 상태가 close/reconnect 시 올바르게 초기화됨

### 부정적

- 동시 connect() 호출 시 하나의 코루틴이 에러를 받으므로, 기존에 "우연히 동작하던" 코드가 명시적 에러를 받게 됨
- 상태 머신 도입으로 connect/close 로직의 복잡도가 소폭 증가
- 기존 사용자 코드 중 connect()를 여러 곳에서 호출하는 패턴이 있다면 마이그레이션 필요

## 관련 ADR

- **ADR-0001 (CFFI 대신 Rust/PyO3 선택)**: Rust의 메모리 안전성이 이 ADR의 기반. PyO3 아키텍처 내에서 동시성 안전성을 강화하는 자연스러운 확장
- **ADR-0006 (Semaphore 기반 Backpressure)**: 동시 요청 제어의 선례. limiter 상태가 close/reconnect 시 올바르게 관리되어야 함
- **ADR-0018 (Tokio Worker Autotuning)**: Worker thread 상한 검증 문제가 중복되므로, 해당 ADR에서 통합 처리 권장
