---
title: "ADR-0017: ACKO Reconciliation Circuit Breaker 임계값 자동 조정 메커니즘"
description: ACKO의 reconciliation circuit breaker 고정 임계값을 에러 유형별 차등 임계값으로 개선하는 제안에 대한 검토 결과. 운영 데이터 부재로 보류.
sidebar_position: 18
scope: single-repo
repos: [acko]
tags: [adr, acko, kubernetes, reconciliation, circuit-breaker, adaptive-threshold]
last_updated: 2026-03-30
---

# ADR-0017: ACKO Reconciliation Circuit Breaker 임계값 자동 조정 메커니즘

## 상태

**Deferred**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#5
- 검토 결과: DEFER
- 보류 사유: ACKO 안정화 단계에서 운영 데이터 없이 복잡성을 도입하는 것은 시기상조. Option C(메트릭 기반 수동 조정)를 먼저 도입하여 데이터를 확보한 후 재검토 필요.

## 맥락 (Context)

ADR-0013에서 도입된 reconciliation circuit breaker는 `maxFailedReconciles = 10` 고정 임계값과 `2^n` 초 지수 백오프(최대 300초)를 사용합니다. 이 구현은 무한 retry 방지라는 핵심 목표를 달성하지만, 다음과 같은 운영상 한계가 식별되었습니다:

### 고정 임계값의 한계

| 시나리오 | 10회 임계값 영향 |
|----------|------------------|
| 1-node 클러스터 | 약 30분 대기 — 과도한 복구 지연 |
| 8-node 클러스터 (네트워크 파티션) | 너무 빠르게 circuit open — 자동 복구 기회 상실 |

### 단일 backoff 공식의 한계

모든 에러 유형에 동일한 `2^n` 백오프가 적용되어, 에러 특성에 맞지 않는 재시도 간격이 사용됩니다:

- **DNS resolution 실패**: 매우 짧은 retry가 유리하나 지수 백오프로 불필요하게 대기
- **Storage full**: 긴 backoff이 적절하나 초기 retry가 빠르게 소진
- **Pod CrashLoopBackOff**: 짧은 retry가 유리

### Reset 조건

현재 성공 1회로 전체 카운터가 리셋되어, 부분적 성공/실패 상태가 반영되지 않습니다.

## 결정 (Decision)

> **보류됨 — 운영 메트릭 데이터 확보 후 재검토**

에러 유형별 차등 임계값(Option A)은 기술적으로 타당하나, 현재 ACKO v0.1.7 안정화 단계에서 다음 이유로 보류합니다:

1. **운영 데이터 부재**: 현재 고정 임계값 10회가 실제 운영 환경에서 어떤 빈도로 circuit breaker를 트리거하는지 데이터가 없음
2. **에러 분류 기준 미검증**: Transient/Infrastructure/Configuration 분류가 실제 환경에서 명확히 구분 가능한지 확인되지 않음
3. **복잡성 대비 이점 불명확**: 에러 카테고리별 독립 카운터와 임계값 조합은 테스트 매트릭스를 크게 증가시킴
4. **프로젝트 목표 충돌**: Goal 3-1 "심플한 CRD 구조 유지"와 Goal 3-4 "E2E 테스트 커버리지 확장"에 부담

**권장 순서**: Option C(메트릭 기반 수동 조정)를 먼저 구현하여 `acko_circuit_breaker_state` 메트릭으로 운영 데이터를 축적한 후, 해당 데이터를 기반으로 Option A의 에러 분류 기준과 임계값을 설계하는 것이 "Quality over speed" 원칙에 부합합니다.

## 대안 (Alternatives Considered)

### Option A: 에러 유형별 차등 임계값 (제안 권장안)

```go
type circuitBreakerConfig struct {
    TransientThreshold  int           // DNS, timeout → 20회
    InfraThreshold      int           // storage, OOM → 5회
    ConfigThreshold     int           // validation, webhook → 3회
    DefaultThreshold    int           // 기타 → 10회
}
```

- **장점**: 에러 특성에 맞는 세밀한 제어, 불필요한 circuit break 방지
- **단점**: 에러 분류 로직 추가, 분류 오류 시 동작 악화, 테스트 복잡성 증가
- **평가**: 기술적으로 우수하나 분류 기준의 실효성 검증 필요

### Option B: 적응형 임계값 (Adaptive)

```go
threshold = baseThreshold * clusterSize / expectedRecoveryFactor
```

- **장점**: 클러스터 크기에 자동 적응
- **단점**: 복잡도 증가, 테스트 어려움, `expectedRecoveryFactor` 결정 기준 모호
- **평가**: 제안 본문에서도 복잡도 문제를 인정. 현 단계에서 과도함

### Option C: 현재 유지 + 메트릭 기반 수동 조정

- **장점**: 가장 낮은 리스크, ADR-0013의 기존 메트릭(`acko_circuit_breaker_state`) 활용, 운영 데이터 축적 가능
- **단점**: 수동 개입 필요, 즉각적 자동 최적화 불가
- **평가**: 안정화 단계에 가장 적합. CRD 오버라이드 필드 추가 시 운영자에게 즉각적 가치 제공

## 결과 (Consequences)

### 긍정적

- 보류 결정으로 안정화 단계의 복잡성 증가를 방지
- Option C 선행 구현 시 운영 데이터 기반의 정보화된 결정 가능
- ADR-0013의 안정성을 유지하면서 점진적 개선 경로 확보

### 부정적

- 고정 임계값의 한계(1-node 과대기, 8-node 조기 트리거)가 당분간 유지
- 에러 유형별 최적화가 지연되어 일부 시나리오에서 비효율적 retry 패턴 지속
- Option C의 CRD 필드 추가가 Goal 3-1과 충돌할 가능성

## 관련 ADR

- [ADR-0013: Reconciliation Circuit Breaker 도입](/docs/architecture/adr/2026-03-01-reconciliation-circuit-breaker) — 본 제안의 기반. 고정 임계값 10회와 지수 백오프를 정의
- [ADR-0010: 3-Layer Observability Stack](/docs/architecture/adr/2026-02-05-observability-stack) — Prometheus 메트릭 패턴. Option C에서 활용
- [ADR-0015: asinfo 기반 Health Check](/docs/architecture/adr/2026-03-05-asinfo-health-checks) — Pod readiness polling과의 상호작용 고려 필요
- [ADR-0012: Pod Readiness Gates](/docs/architecture/adr/2026-02-20-pod-readiness-gates) — `podReadyPollInterval`과 circuit breaker backoff의 상호작용
