---
title: "ADR-0020: ACKO Pod Readiness Watch 전환 및 Status Enrichment 병렬화"
description: ACKO의 Pod readiness 확인을 10초 간격 polling에서 Kubernetes Informer watch로 전환하고, status enrichment의 Aerospike 노드 정보 수집을 병렬화하여 reconciliation 성능을 개선하는 아키텍처 결정.
sidebar_position: 35
scope: single-repo
repos: [acko]
tags: [adr, acko, kubernetes, performance, watch, informer, parallelization, reconciliation]
last_updated: 2026-03-30
---

# ADR-0020: ACKO Pod Readiness Watch 전환 및 Status Enrichment 병렬화

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#31
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

ACKO의 reconciliation 루프에서 두 가지 성능 병목이 확인되었다.

### 1. Pod Readiness Polling (10초 간격)

`internal/controller/reconciler.go:58`에 정의된 `podReadyPollInterval = 10 * time.Second`로 인해, Pod가 ready 상태가 되어도 최대 10초까지 감지가 지연된다. 8노드 클러스터의 rolling restart 시 이 지연이 누적되어 약 80초의 불필요한 대기 시간이 발생한다. 또한 여러 AerospikeCluster를 관리할 경우 polling에 의한 API 서버 호출이 누적된다.

현재 구조:
```
Reconcile → waitForPodReady() → 10s sleep → re-check → 10s sleep → ...
```

### 2. Status Enrichment 순차 수집

`internal/controller/reconciler_status.go:133`의 `collectAerospikeInfo`가 각 Pod에 대해 순차적으로 `aeroClient.InfoNode`를 호출한다. 8노드 기준 정상 시 400ms(노드당 50ms), 네트워크 지연 시 4초(노드당 500ms)까지 소요되어 reconcile 주기에 비해 과도한 시간을 소비한다.

이 문제는 ADR-0002에서 선택한 controller-runtime의 Informer cache를 충분히 활용하지 못하는 것에서 기인하며, ADR-0012(Pod Readiness Gates)에서 확립한 정확한 상태 감지 원칙을 시간 측면에서 개선하는 제안이다.

## 결정 (Decision)

> **Pod readiness 확인을 Kubernetes Informer watch로 전환하고, status enrichment의 노드 정보 수집을 goroutine 기반으로 병렬화한다.**

### 해결 1: Pod Informer Watch + Readiness Gate

기존 10초 간격 polling을 controller-runtime의 Informer 기반 watch로 전환한다. controller-runtime은 이미 Pod informer cache를 사용하므로, 기존 cache에 `ResourceEventHandlerFuncs`를 추가하여 구현한다.

```go
podInformer := informerFactory.Core().V1().Pods().Informer()
podInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
    UpdateFunc: func(old, new interface{}) {
        newPod := new.(*corev1.Pod)
        if isPodReady(newPod) && isOwnedByCluster(newPod, cluster) {
            r.enqueuePodReady(cluster)  // 즉시 reconcile trigger
        }
    },
})
```

Watch connection 끊김 시 fallback polling을 유지하여 안정성을 보장한다.

### 해결 2: Status Enrichment 병렬화

`collectAerospikeInfo`를 `sync.WaitGroup` 기반 goroutine 병렬 수집으로 전환한다.

```go
func (r *Reconciler) collectAerospikeInfo(ctx context.Context, pods []corev1.Pod) {
    var wg sync.WaitGroup
    results := make([]NodeInfo, len(pods))
    for i, pod := range pods {
        wg.Add(1)
        go func(idx int, p corev1.Pod) {
            defer wg.Done()
            info, err := r.aeroClient.InfoNode(p.Status.PodIP, ...)
            results[idx] = NodeInfo{Info: info, Err: err}
        }(i, pod)
    }
    wg.Wait()
}
```

CE 제약(최대 8노드)으로 goroutine 수가 자연스럽게 제한된다. Context cancellation을 전파하고, 에러 발생 시 부분 성공을 허용한다.

### 단계별 구현

1. **Phase 1**: Status enrichment 병렬화 (size/S, 위험 낮음)
2. **Phase 2**: Pod readiness watch 전환 (size/M, 기존 polling fallback 유지)
3. **Phase 3**: Polling 코드 제거 (Watch 안정화 확인 후)

## 대안 (Alternatives Considered)

### 대안 1: Polling 간격 단축 (10초 → 2초)

- **설명**: 기존 polling 구조를 유지하되 간격을 줄여 감지 지연을 개선
- **장점**: 구현 변경 최소, 기존 코드 구조 유지
- **단점**: API 서버 부하 5배 증가, 근본적 해결이 아닌 트레이드오프 조정에 불과
- **미선택 사유**: controller-runtime이 이미 제공하는 watch 메커니즘을 활용하지 않는 것은 비효율적

### 대안 2: Watch만 도입하고 병렬화는 미적용

- **설명**: Pod readiness watch만 전환하고 status enrichment는 현행 유지
- **장점**: 변경 범위 축소
- **단점**: 네트워크 지연 시 status enrichment 병목이 여전히 존재
- **미선택 사유**: 두 개선이 독립적이므로 함께 적용하는 것이 합리적

### 대안 3: 전체 status enrichment를 별도 goroutine으로 분리

- **설명**: reconcile loop와 status 수집을 완전히 비동기로 분리
- **장점**: reconcile loop가 status 수집에 블로킹되지 않음
- **단점**: 상태 일관성 보장이 복잡해지고 race condition 위험 증가
- **미선택 사유**: 현재 규모(최대 8노드)에서는 병렬 수집만으로 충분한 개선 달성 가능

## 결과 (Consequences)

### 긍정적

- Pod ready 감지 지연이 최대 10초에서 ~0초로 단축
- 8노드 rolling restart 총 시간에서 약 80초의 polling overhead 제거
- Status enrichment 8노드 기준 400ms → ~50ms (8x 개선)
- API 서버 부하가 N pods × polling/10s에서 watch stream 1 connection으로 감소
- controller-runtime의 설계 의도에 부합하는 Informer 활용

### 부정적

- Watch 전환 시 코드 복잡도 소폭 증가 (eventHandler 등록, fallback 로직)
- Phase 2~3 전환 기간 동안 watch와 polling 두 메커니즘 병행 운영 필요
- Informer cache로 인한 메모리 사용량 소폭 증가 (< 10MB)
- goroutine 병렬화로 인한 에러 처리 복잡도 증가 (부분 성공 허용 로직 필요)

## 관련 ADR

- [ADR-0002: Kubebuilder v4 + controller-runtime 선택](./2026-01-18-kubebuilder-v4.md) — controller-runtime의 Informer cache를 활용하는 기반
- [ADR-0012: Pod Readiness Gates 도입](./2026-02-20-pod-readiness-gates.md) — 커스텀 readiness gate와 결합하여 즉시 감지 효과 극대화
- [ADR-0013: Reconciliation Circuit Breaker 도입](./2026-03-01-reconciliation-circuit-breaker.md) — reconciliation 안정성 패턴과 공존
- [ADR-0015: asinfo 기반 Health Check 도입](./2026-03-05-asinfo-health-checks.md) — health check와 pod readiness watch의 역할 분리
- [ADR-0019: Info 배치 집계](./2026-03-30-info-batch-aggregation.md) — 유사한 성능 최적화 패턴 (Cluster Manager)
