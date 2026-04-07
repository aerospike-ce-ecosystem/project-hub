---
title: "ADR-0018: aerospike-py Tokio Runtime Worker Thread 자동 튜닝 및 성능 프로파일링"
description: aerospike-py의 Tokio runtime worker thread 수를 CPU 코어 기반 heuristic으로 자동 결정하고, RuntimeMetrics를 Prometheus 메트릭으로 노출하는 아키텍처 결정.
sidebar_position: 24
scope: single-repo
repos: [aerospike-py]
tags: [adr, tokio, runtime, performance, metrics, aerospike-py, profiling]
last_updated: 2026-03-30
---

# ADR-0018: aerospike-py Tokio Runtime Worker Thread 자동 튜닝 및 성능 프로파일링

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#15
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

aerospike-py는 Rust/PyO3 기반으로 내부적으로 Tokio async runtime을 사용하며, 모든 async I/O 작업이 단일 Tokio runtime에서 실행됩니다. 현재 구현(`rust/src/runtime.rs`)에서는 `AEROSPIKE_RUNTIME_WORKERS` 환경변수로 worker thread 수를 설정하며, 기본값은 2로 고정되어 있습니다.

### 현재 문제점

1. **Worker Thread 기본값의 범용성 부족**: 2개 worker thread는 단일 클라이언트/소규모 동시성에 최적이지만, 다양한 배포 환경에서는 부족할 수 있습니다:
   - **Gunicorn + FastAPI 멀티워커 환경**: 각 워커가 독립 Tokio runtime을 생성하여 프로세스당 2 thread만 사용
   - **대규모 batch 작업**: `batch_write` 수천 건 동시 실행 시 worker thread 경합 발생 가능
   - **Free-threaded Python (3.14t)**: GIL 해제 환경에서 Python thread와 Tokio thread 간 경합 패턴 변경 예상

2. **튜닝 가이드 부재**: 어떤 상황에서 worker 수를 늘려야 하는지, CPU-bound vs I/O-bound operation 비율에 따른 최적값, 8-node 클러스터(CE 최대)에서의 최적 worker 수에 대한 가이드가 없습니다.

3. **런타임 프로파일링 도구 부재**: Tokio runtime의 부하 상태를 확인할 방법이 없습니다. Worker thread utilization, task queue depth 메트릭이 없어 병목 발생 시 진단이 불가합니다.

### 성능 벤치마크 현황

현재 벤치마크(README.md 기준)에서 Sync Client는 공식 C client 대비 동등, Async Client는 2.2–2.4x 빠른 성능을 보이지만, 이는 단일 클라이언트 기준 측정입니다.

## 결정 (Decision)

> **Heuristic 기반 자동 튜닝과 Prometheus 메트릭 노출을 도입한다.**

### Worker Thread 자동 결정

CPU 코어 수 기반 heuristic으로 기본 worker thread 수를 자동 결정합니다:

```rust
fn default_workers() -> usize {
    let cpu_count = num_cpus::get();
    let env_workers = std::env::var("AEROSPIKE_RUNTIME_WORKERS")
        .ok()
        .and_then(|v| v.parse().ok());

    env_workers.unwrap_or_else(|| {
        // I/O-bound 워크로드에 최적화: 최소 2, 최대 cpu_count, 기본 min(cpu_count, 4)
        std::cmp::max(2, std::cmp::min(cpu_count, 4))
    })
}
```

- 기본값: `min(cpu_count, 4)` (I/O-bound 워크로드에 최적)
- 최소 2 worker 보장
- `AEROSPIKE_RUNTIME_WORKERS` 환경변수로 수동 오버라이드 유지 (하위 호환)

### RuntimeMetrics 노출

Tokio의 `RuntimeMetrics` API를 통해 runtime 상태를 Prometheus 메트릭으로 노출합니다:

- `aerospike_py_runtime_workers` (gauge): 현재 worker thread 수
- `aerospike_py_runtime_active_tasks` (gauge): 활성 task 수
- `aerospike_py_runtime_blocking_queue_depth` (gauge): blocking queue 깊이

이는 ADR-0010의 3-Layer Observability Stack의 Layer 2 (Metrics)에 자연스럽게 통합됩니다.

### 영향 범위

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 기본 worker 수 | 2 (고정) | `min(cpu_count, 4)` (자동) |
| 환경변수 | `AEROSPIKE_RUNTIME_WORKERS` | 동일 (하위 호환) |
| 메트릭 | 없음 | runtime_workers, active_tasks, queue_depth |
| 의존성 | 없음 | `num_cpus` crate, `tokio::runtime::RuntimeMetrics` |

## 대안 (Alternatives Considered)

### Option A: Heuristic 기반 자동 튜닝 + 프로파일링 메트릭 (채택)

**장점:**
- 단순한 heuristic으로 대부분의 배포 환경에서 합리적인 기본값 제공
- 환경변수 오버라이드로 하위 호환성 완전 보장
- Prometheus 메트릭으로 runtime 수준 진단 가능
- ADR-0010 관측성 스택과 자연스러운 통합

**단점:**
- Heuristic이 모든 워크로드에 최적은 아닐 수 있음
- `tokio_unstable` feature flag 의존성 (stable 전환 예정이나 시점 미확정)

### Option B: 워크로드 프로파일 기반 프리셋

```python
client = aerospike_py.AsyncClient(
    hosts=[("localhost", 3000)],
    runtime_profile="high_throughput"  # balanced, high_throughput, low_latency
)
```

**장점:**
- 사용자가 워크로드 특성에 맞는 프리셋 선택 가능
- 프리셋별 Tokio 내부 설정 일괄 조정

**단점:**
- API 표면 확대 (새로운 parameter 추가)
- 프리셋 간 경계가 모호하여 사용자 혼란 유발 가능
- 내부 구현 세부사항(Tokio 설정)이 Python API에 노출

### Option C: 현재 유지 + 문서화

**장점:**
- 코드 변경 없음, 위험도 최소

**단점:**
- 런타임 진단 도구 부재 문제 미해결
- 멀티워커/대규모 배포 환경에서 기본 성능 미달 가능성 존재
- Free-threaded Python 대응 준비 미흡

## 결과 (Consequences)

### 긍정적

- Gunicorn 멀티워커, 대규모 batch 등 다양한 배포 환경에서 기본 성능 향상
- RuntimeMetrics로 Tokio runtime 수준의 병목 진단 가능
- ADR-0010 관측성 스택 확장으로 운영 가시성 향상
- 환경변수 오버라이드 유지로 기존 사용자 영향 없음
- Free-threaded Python (3.14t) 대응을 위한 기반 마련

### 부정적

- `num_cpus` crate 의존성 추가 (최소한의 추가)
- `tokio_unstable` feature flag 의존이 빌드 복잡성 소폭 증가
- CPU 코어 수가 1인 환경(컨테이너 제한)에서 heuristic 동작 검증 필요
- 벤치마크 수치가 추정값 기반이므로 구현 전 실측 데이터 확보 필요

## 관련 ADR

- [ADR-0001: CFFI 대신 Rust/PyO3 선택](/docs/architecture/adr/2026-01-15-pyo3-over-cffi) — Tokio runtime이 핵심 실행 레이어로 확립된 기반 결정
- [ADR-0006: Semaphore 기반 Backpressure](/docs/architecture/adr/2026-03-05-backpressure-semaphore) — tunable parameter 패턴(`max_concurrent_ops`)의 선례, worker thread 튜닝과 상호 보완적
- [ADR-0010: 3-Layer Observability Stack](/docs/architecture/adr/2026-02-05-observability-stack) — Prometheus 메트릭 패턴이 이미 확립, RuntimeMetrics가 Layer 2에 통합
- [ADR-0017: Batch Retry Jitter Backoff](/docs/architecture/adr/2026-03-30-batch-retry-jitter-backoff) — 성능 관련 보완적 결정, worker thread 수와 retry 패턴의 상호작용 고려 필요
