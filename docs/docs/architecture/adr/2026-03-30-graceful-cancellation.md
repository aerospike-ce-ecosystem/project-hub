---
title: "ADR-0018: Cluster Manager Backend 비동기 연산의 Graceful Cancellation 전략"
description: Cluster Manager Backend에서 클라이언트 연결 끊김 시 장시간 실행 중인 비동기 연산(scan, query, K8s API)을 Graceful하게 취소하는 전략 도입.
sidebar_position: 18
scope: single-repo
repos: [cluster-manager]
tags: [adr, cluster-manager, fastapi, cancellation, async, resource-management]
last_updated: 2026-03-30
---

# ADR-0018: Cluster Manager Backend 비동기 연산의 Graceful Cancellation 전략

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#12
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Cluster Manager Backend는 FastAPI 기반으로, 레코드 브라우저 scan, 대규모 batch 조회, K8s 클러스터 상태 조회 등 장시간 실행되는 비동기 연산을 처리합니다.

### 현재 문제점

1. **연결 끊김 시 리소스 누수**: 프론트엔드 사용자가 브라우저 탭을 닫거나 페이지를 이동하면 HTTP 연결이 끊어지지만, 백엔드의 scan/query 작업은 완료될 때까지 계속 실행됩니다.
   - 대규모 namespace scan: 수백만 레코드 scan이 불필요하게 계속 진행
   - K8s API 호출: kubectl watch가 해제되지 않아 API 서버 부하
2. **에러 전파 부재**: `client_manager.py`의 `contextlib.suppress(Exception)`이 모든 close 에러를 삼키고 있어, 연결 풀 고갈 시에도 에러 로그가 없고 디버깅이 어렵습니다.
3. **타임아웃 전파 미비**: FastAPI의 request timeout과 aerospike-py의 operation timeout이 독립적으로 동작하여, FastAPI 60초 timeout 후에도 Aerospike 작업이 계속 실행될 수 있습니다.

### 기술적 배경

- ADR-0016에서 SSE 기반 `StreamingResponse` 패턴이 이미 도입 제안되어, scan/query 결과 스트리밍과 자연스럽게 통합 가능
- ADR-0006의 Semaphore 기반 backpressure가 요청 수 제한을 담당하지만, 이미 실행 중인 연산의 조기 종료 메커니즘은 부재
- ADR-0014에서 asyncpg 기반 비동기 백엔드가 구축되어 있어 비동기 cancellation 패턴 적용 기반 확보

## 결정 (Decision)

> **FastAPI Request 라이프사이클 기반 Graceful Cancellation을 도입하여, 클라이언트 연결 끊김 시 장시간 비동기 연산을 조기 종료한다.**

### 핵심 설계

```python
@router.get("/api/records/{conn_id}")
async def get_records(request: Request, conn_id: str):
    async def scan_with_cancellation():
        async for record in client.scan(namespace, set_name):
            if await request.is_disconnected():
                logger.info(f"Client disconnected, cancelling scan for {conn_id}")
                break
            yield record
    return StreamingResponse(scan_with_cancellation())
```

- FastAPI의 `Request.is_disconnected()` 폴링으로 클라이언트 연결 상태 확인
- scan/query 결과 스트리밍 중 주기적으로 연결 확인 (매 100 레코드마다)
- 연결 끊김 시 graceful하게 iteration 중단
- `client_manager.py`의 `contextlib.suppress(Exception)` 제거 및 structured logging 도입

### 구현 범위

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 파일 | `routers/records.py`, `routers/query.py` | 동일 파일 + `middleware/cancellation.py` (신규) |
| client_manager.py | `suppress(Exception)` | structured error logging + connection state tracking |
| 의존성 | 없음 | 없음 (FastAPI 내장 기능 활용) |
| 호환성 | - | 하위 호환 (기존 API 스펙 변경 없음) |
| 성능 | 불필요한 작업 지속 | 조기 종료로 리소스 절약 |

## 대안 (Alternatives Considered)

### Option A: FastAPI Request 라이프사이클 기반 Cancellation — 선택됨

- **장점**: FastAPI 내장 기능 활용으로 외부 의존성 없음, `StreamingResponse`와 자연스러운 통합, 하위 호환성 유지
- **단점**: 매 N 레코드마다 `is_disconnected()` 폴링으로 약간의 오버헤드 존재

### Option B: asyncio Task 기반 Cancellation

```python
async def scan_with_timeout(client, namespace, set_name, timeout=60):
    task = asyncio.create_task(client.scan(namespace, set_name))
    try:
        return await asyncio.wait_for(task, timeout=timeout)
    except asyncio.TimeoutError:
        task.cancel()
        raise HTTPException(408, "Operation timed out")
```

- **장점**: `asyncio.wait_for()`로 전체 작업에 timeout 적용, Task cancellation을 통해 Tokio runtime까지 전파 가능
- **단점**: timeout 기반으로 연결 끊김을 직접 감지하지 못함. 연결이 유지된 상태에서도 timeout으로 강제 종료될 수 있음
- **평가**: Option A와 조합하면 효과적이나 단독으로는 부족. 구현 시 Option A와 병행 적용 권장

### Option C: 현재 유지 + 로깅 강화

- **장점**: 구현 변경 최소, 가시성 개선
- **단점**: 근본적 해결 없이 모니터링만 강화. 리소스 누수 문제가 그대로 존재
- **평가**: 프로젝트 목표 2-2(timeout·limit 관리)와 2-8(대용량 데이터 성능)에 부합하지 않음

## 결과 (Consequences)

### 긍정적
- 클라이언트 연결 끊김 시 불필요한 scan/query 즉시 종료로 서버 리소스 절약
- `contextlib.suppress()` 제거로 연결 관련 에러 가시성 확보 (ADR-0010 Observability 원칙 부합)
- ADR-0016 SSE 스트리밍 패턴과 `StreamingResponse` 공유로 코드 일관성 향상
- ADR-0006 Semaphore backpressure와 상호보완적 리소스 보호 계층 구축
- 하위 호환성 유지로 기존 API 클라이언트에 영향 없음

### 부정적
- `is_disconnected()` 폴링 주기에 따라 약간의 응답 지연 가능 (매 100 레코드 = 무시 가능한 수준)
- `middleware/cancellation.py` 신규 모듈 추가로 코드 복잡도 소폭 증가
- aerospike-py scan/query iterator의 cancellation 시그널 전파 가능 여부에 따라 Rust Tokio 런타임 수준까지의 완전한 종료 보장 여부 확인 필요

## 관련 ADR

- [ADR-0016: SSE 기반 실시간 이벤트 스트리밍](/docs/architecture/adr/2026-03-29-sse-event-streaming) — `StreamingResponse` 패턴 공유, SSE 구현과 병행하여 통합 적용 권장
- [ADR-0006: Semaphore 기반 Backpressure](/docs/architecture/adr/2026-03-05-backpressure-semaphore) — 요청 수 제한(backpressure)과 실행 중 연산 취소(cancellation)는 서로 다른 계층에서 리소스를 보호하는 상호보완적 메커니즘
- [ADR-0010: 3-Layer Observability Stack](/docs/architecture/adr/2026-02-05-observability-stack) — `contextlib.suppress()` 제거 후 structured logging 도입은 관측성 원칙과 부합
- [ADR-0014: SQLite에서 PostgreSQL로 마이그레이션](/docs/architecture/adr/2026-02-10-postgresql-migration) — asyncpg 기반 비동기 백엔드가 cancellation 패턴 적용 기반 제공
