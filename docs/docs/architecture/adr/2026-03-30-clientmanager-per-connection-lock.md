---
title: "ADR-0020: Cluster Manager ClientManager 동시성 결함 분석 및 per-connection lock 도입"
description: ClientManager의 double-checked locking race condition을 per-connection-id AsyncLock으로 해결하고, string 기반 에러 감지를 구조화된 result_code 기반으로 전환하는 아키텍처 결정.
sidebar_position: 20
scope: single-repo
repos: [cluster-manager, aerospike-py]
tags: [adr, concurrency, connection-management, error-handling, cluster-manager]
last_updated: 2026-03-30
---

# ADR-0020: Cluster Manager ClientManager 동시성 결함 분석 및 per-connection lock 도입

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#29
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Cluster Manager의 `ClientManager`는 Aerospike 연결을 관리하는 핵심 컴포넌트입니다. 현재 구현에서 두 가지 결함이 식별되었습니다.

### 1. Double-Checked Locking Race Condition

`client_manager.py:25-51`에서 `get_client()` 메서드는 global lock으로 캐시 조회 후 lock을 해제하고, lock 외부에서 `connect()`를 수행합니다. 이 패턴은 동시 요청이 동일 `conn_id`에 대해 중복 `AsyncClient`를 생성하는 race window를 만듭니다.

```python
async def get_client(self, conn_id: str) -> AsyncClient:
    async with self._lock:
        client = self._clients.get(conn_id)
        if client is not None and client.is_connected():
            return client
    # ← RACE WINDOW: lock 해제 후 connect() 전까지
    #    동시 요청이 동일 conn_id에 대해 중복 연결 시도
    profile = await db.get_connection(conn_id)
    client = aerospike_py.AsyncClient(as_config)
    await client.connect()
    async with self._lock:
        old = self._clients.get(conn_id)
```

**영향**:
- 동일 connection에 대해 다수의 `AsyncClient` 생성 → zombie 연결 발생
- 고부하 시 Aerospike CE 서버의 connection limit 소진 가능 (CE 제약 위반)

### 2. String 기반 에러 감지 취약점

`main.py:169`에서 `if "FailForbidden" in msg` 패턴으로 TTL 관련 에러를 감지합니다. aerospike-py의 메시지 포맷 변경 시 silent failure가 발생할 수 있으며, 이는 ADR-0019에서 지적된 anti-pattern과 동일합니다.

## 결정 (Decision)

> **per-connection-id AsyncLock을 도입하여 연결 생성의 race condition을 제거하고, string 기반 에러 감지를 ADR-0019의 result_code 기반으로 점진적으로 전환한다.**

### per-connection-id AsyncLock 구현

```python
class ClientManager:
    def __init__(self):
        self._clients: dict[str, AsyncClient] = {}
        self._conn_locks: dict[str, asyncio.Lock] = {}
        self._global_lock = asyncio.Lock()

    async def _get_conn_lock(self, conn_id: str) -> asyncio.Lock:
        async with self._global_lock:
            if conn_id not in self._conn_locks:
                self._conn_locks[conn_id] = asyncio.Lock()
            return self._conn_locks[conn_id]

    async def get_client(self, conn_id: str) -> AsyncClient:
        lock = await self._get_conn_lock(conn_id)
        async with lock:
            # 전체 생성 과정이 conn_id별로 직렬화됨
            client = self._clients.get(conn_id)
            if client is not None and client.is_connected():
                return client
            profile = await db.get_connection(conn_id)
            client = aerospike_py.AsyncClient(as_config)
            await client.connect()
            self._clients[conn_id] = client
            return client
```

### String 에러 감지 전환 전략

1. **즉시 조치**: 대소문자 무시 매칭 + fallback logging 강화
2. **ADR-0019 완료 후**: `exc.result_code == ResultCode.FAIL_FORBIDDEN`으로 최종 전환

## 대안 (Alternatives Considered)

### 대안 1: Global lock으로 전체 get_client() 직렬화

- **장점**: 구현이 가장 단순함
- **단점**: 서로 다른 connection에 대한 요청까지 직렬화되어 동시성 성능 저하. 설계 원칙 2-2 (Performance-first)에 위배
- **미선택 사유**: per-connection lock이 동일한 안전성을 보장하면서 더 높은 동시성을 제공

### 대안 2: asyncio.Event 기반 대기 패턴

- **장점**: Lock 대신 Event로 "생성 중" 상태를 알릴 수 있음
- **단점**: 상태 관리가 복잡하고 에러 전파가 어려움. Lock에 비해 유의미한 성능 이점 없음
- **미선택 사유**: per-connection lock이 더 직관적이고 유지보수 용이

### 대안 3: 현행 유지 (string 매칭)

- **장점**: 변경 없음
- **단점**: ADR-0019에서 명시적으로 anti-pattern으로 지적됨. 메시지 변경 시 silent failure 위험
- **미선택 사유**: 기존 ADR 방향과 불일치

## 결과 (Consequences)

### 긍정적

- **Race condition 완전 제거**: 동일 `conn_id`에 대한 연결 생성이 직렬화되어 zombie 연결 방지
- **동시성 유지**: 서로 다른 `conn_id`에 대한 요청은 독립적으로 병렬 처리
- **CE connection limit 보호**: 불필요한 중복 연결이 제거되어 Aerospike CE의 유한한 connection limit을 효율적으로 사용 (설계 원칙 2-5)
- **ADR-0019 연계**: string 기반 에러 감지 전환이 ADR-0019의 구현 로드맵과 자연스럽게 연결
- **테스트 가능성**: 동시 `get_client()` 호출에 대한 단위 테스트로 검증 가능

### 부정적

- **Lock dict 메모리**: `_conn_locks` dict에 삭제된 connection의 lock 객체가 남을 수 있음 (connection 수가 유한하므로 실질적 영향 미미)
- **Global lock bottleneck**: per-connection lock 획득 시 `_global_lock`을 거치므로 이론적 bottleneck이나, dict 조회는 O(1)이므로 실질적 영향 없음
- **ADR-0019 의존성**: string 에러 감지의 최종 전환은 aerospike-py의 `result_code` 시스템 완료에 의존

## 관련 ADR

- [ADR-0006: Semaphore 기반 Backpressure](/docs/architecture/adr/2026-03-05-backpressure-semaphore) — 에코시스템의 구조화된 동시성 제어 패턴 선례
- [ADR-0018: Graceful Cancellation](/docs/architecture/adr/2026-03-30-graceful-cancellation) — Cluster Manager 리소스 관리의 보완적 결정 (연결 종료 시 정리)
- [ADR-0019: Structured Result Code](/docs/architecture/adr/2026-03-30-structured-result-code) — string 매칭 → result_code 전환의 기반 결정
