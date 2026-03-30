---
title: "ADR-0017: Batch Retry에 Jitter 기반 Exponential Backoff 도입"
description: aerospike-py의 batch 작업 retry에 Full Jitter 패턴을 도입하여 thundering herd 문제를 방지하고 서버 부하를 분산하는 아키텍처 결정.
sidebar_position: 17
scope: single-repo
repos: [aerospike-py]
tags: [adr, retry, jitter, backoff, performance, aerospike-py]
last_updated: 2026-03-30
---

# ADR-0017: Batch Retry에 Jitter 기반 Exponential Backoff 도입

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#4
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

aerospike-py의 batch 작업(`batch_write`, `batch_operate` 등)은 per-record 단위 retry를 지원하며, `rust/src/client_ops.rs`(lines 265-409)에서 `is_retryable_result_code()`를 통해 Timeout, DeviceOverload, KeyBusy, ServerMemError, PartitionUnavailable 에러에 대해 재시도합니다.

### 현재 구현의 문제점

현재 고정 exponential backoff(`10ms * 2^attempt`, 최대 500ms cap)을 사용하고 있으며, 다음과 같은 한계가 있습니다:

1. **Thundering Herd**: 여러 클라이언트가 동시에 동일한 backoff 타이밍으로 retry하면 서버에 burst 부하가 발생합니다. 특히 ADR-0006의 Semaphore backpressure가 동시 요청을 제한하더라도, 동일 시점에 retry가 집중되면 burst가 발생할 수 있습니다.

2. **에러 유형별 미분화**: DeviceOverload(디스크 I/O 과부하)와 Timeout(네트워크 지연)은 recovery 패턴이 다르지만 동일한 backoff을 사용합니다. Jitter를 통해 자연스럽게 retry 타이밍을 분산할 수 있습니다.

3. **업계 표준 미적용**: AWS, Google 등 주요 SDK에서 권장하는 decorrelated jitter 패턴이 적용되지 않았습니다.

### 기술적 배경

ADR-0009(Unified BatchRecords API)에서 도입된 per-record `result_code` 기반으로, 실패한 레코드만 선별적으로 retry하는 구조가 이미 갖추어져 있습니다. 이 제안은 그 retry의 타이밍 전략을 개선하는 것입니다.

## 결정 (Decision)

> **aerospike-py의 batch retry backoff에 Full Jitter 패턴을 도입한다.**

### Full Jitter 알고리즘

```
sleep = random_between(0, min(cap, base * 2^attempt))
```

- `base`: 10ms (현재와 동일)
- `cap`: 500ms (현재와 동일)
- `random_between`: 균일 분포 난수

### 구현 방향

1. `rust/src/client_ops.rs`의 기존 고정 backoff 로직을 Full Jitter로 교체
2. 선택적으로 `RetryPolicy`에 `jitter_mode` 옵션 추가 (Full Jitter를 기본값으로)
3. 기존 API 호환성 유지 — jitter는 내부 동작 변경이며 외부 API breaking change 없음

### 적용 예시

| Attempt | 고정 Backoff | Full Jitter 범위 |
|---------|-------------|-----------------|
| 1 | 20ms | 0-20ms |
| 2 | 40ms | 0-40ms |
| 3 | 80ms | 0-80ms |
| 4 | 160ms | 0-160ms |
| 5 | 320ms | 0-320ms |
| 6+ | 500ms | 0-500ms |

## 대안 (Alternatives Considered)

### Option A: Full Jitter (권장 — 선택됨)

```
sleep = random_between(0, min(cap, base * 2^attempt))
```

- **장점**: 가장 넓은 분산으로 thundering herd 방지에 최적. AWS Architecture Blog 권장 패턴.
- **단점**: 최소 대기 시간이 0까지 내려갈 수 있음.
- **평가**: per-record retry 특성상 즉시 재시도해도 다른 record의 retry와 겹칠 확률이 낮으므로 단점의 영향이 미미합니다.

### Option B: Equal Jitter

```
half = min(cap, base * 2^attempt) / 2
sleep = half + random_between(0, half)
```

- **장점**: 최소 대기 시간 보장 (절반), retry 간격 편차 적음.
- **단점**: 분산 범위가 Full Jitter의 절반으로 thundering herd 방지 효과 감소.
- **미선택 사유**: batch 시나리오에서는 최소 대기 시간 보장보다 분산이 더 중요합니다.

### Option C: Decorrelated Jitter

```
sleep = min(cap, random_between(base, previous_sleep * 3))
```

- **장점**: 이전 sleep 기반 자기 조절, 장기 retry에 적합.
- **단점**: 이전 sleep 상태를 per-record로 추적해야 하므로 구현 복잡도 증가. batch에서 수천 개 record의 이전 sleep을 관리하는 오버헤드.
- **미선택 사유**: per-record retry에서 record별 상태 추적이 불필요한 복잡성을 추가합니다.

### Option D: 현재 유지 (고정 Exponential Backoff)

- **장점**: 변경 없음, 예측 가능한 타이밍.
- **단점**: thundering herd 문제 해결 불가.
- **미선택 사유**: 프로젝트 목표 1-5(batch retry 품질 개선)에 부합하지 않습니다.

## 결과 (Consequences)

### 긍정적

- **Thundering herd 방지**: retry 타이밍이 균일 분포로 분산되어 서버에 burst 부하 감소
- **ADR-0006과 시너지**: Semaphore backpressure(입구 제어)와 jitter backoff(재시도 분산)가 상호 보완하여 서버 보호 강화
- **업계 표준 적용**: AWS, Google 등 주요 SDK와 동일한 패턴으로 운영 예측 가능성 향상
- **낮은 구현 복잡도**: `rust/src/client_ops.rs` 단일 파일 수정, `rand` crate 활용
- **API 호환성 유지**: 외부 API 변경 없이 내부 동작만 개선

### 부정적

- **비결정적 동작**: 테스트에서 정확한 sleep 시간 검증이 어려움 (seed 기반 테스트 또는 범위 검증으로 완화)
- **평균 대기 시간 감소**: Full Jitter의 평균 대기 시간은 고정 backoff의 절반으로, 일부 retry가 너무 빨리 발생할 수 있음 (서버 recovery가 불완전한 상태에서 재시도). 그러나 per-record retry 특성상 실질적 영향은 미미
- **`rand` crate 의존성 추가**: Rust 빌드에 `rand` crate 의존성이 추가될 수 있음 (이미 사용 중이라면 영향 없음)

## 관련 ADR

- [ADR-0006: Semaphore 기반 Backpressure](/docs/architecture/adr/2026-03-05-backpressure-semaphore) — 동시 요청 제한(입구 제어)과 상호 보완적
- [ADR-0009: Unified BatchRecords API](/docs/architecture/adr/2026-03-20-unified-batch-records-api) — per-record result_code 기반 retry의 기반 인프라
- [ADR-0013: Reconciliation Circuit Breaker](/docs/architecture/adr/2026-03-01-reconciliation-circuit-breaker) — ACKO에서 이미 지수 백오프 패턴 사용, 에코시스템 패턴 일관성

## 참고 자료

- [AWS Architecture Blog: Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [aerospike-py batch retry 구현: `rust/src/client_ops.rs` (lines 265-409)](https://github.com/aerospike-ce-ecosystem/aerospike-py)
- [Project Goal 1-5: batch_write retry 개선](../../goals/project-goals)
