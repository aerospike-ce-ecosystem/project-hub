---
title: "ADR-0018: ACKO Pause/Resume 상태 전환 시 Status Condition 정합성 보장"
description: ACKO operator의 Pause/Resume 상태 전환 시 Status Condition 불일치 문제를 해결하기 위해 원자적 업데이트와 Resume condition 리셋을 도입하는 아키텍처 결정.
sidebar_position: 18
scope: single-repo
repos: [acko]
tags: [adr, acko, kubernetes, pause, resume, status-condition, reconciliation]
last_updated: 2026-03-30
---

# ADR-0018: ACKO Pause/Resume 상태 전환 시 Status Condition 정합성 보장

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#13
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

ACKO operator는 `spec.paused: true` 설정 시 reconciliation을 중단하는 Pause 기능을 제공한다. 현재 구현(`internal/controller/reconciler.go`, lines 149-162)은 `cluster.Spec.Paused`를 확인하여 true이면 `status.Phase = "Paused"`를 설정하고 reconciliation을 스킵한다.

이 구현에는 세 가지 문제가 존재한다:

1. **Status 업데이트 실패 시 불일치**: `r.Status().Update()` 호출이 실패하면 클러스터는 실질적으로 paused 상태이지만, `status.Phase`는 이전 상태(예: "Running")를 유지한다. 사용자가 `kubectl get aerospikecluster`로 확인 시 "Running"으로 표시되지만 실제로는 관리되지 않는 상태가 된다. Cluster Manager UI에서도 잘못된 상태를 표시하게 된다.

2. **Resume 시 Condition 클린업 부재**: Paused → Running 전환 시 이전 에러 condition들이 클리어되지 않는다. Pause 전 발생한 `ReconcileFailed` condition이 Resume 후에도 남아있어 운영자가 과거 에러와 현재 에러를 구분할 수 없다.

3. **Pause 중 외부 변경 감지 불가**: Pause 상태에서 Pod가 삭제되거나 PVC가 변경되어도 operator가 인지하지 못한다. Resume 시 예상치 못한 상태 divergence가 발생할 수 있다.

이 문제는 ADR-0013(Reconciliation Circuit Breaker)에서 도입한 condition 기반 상태 노출 패턴의 확장선에 있으며, ADR-0012(Pod Readiness Gates)에서 확립한 "정확한 상태 반영" 원칙과 직결된다.

## 결정 (Decision)

> **Pause Status 원자적 업데이트 + Resume Condition 리셋 방식을 도입한다 (Option A).**

### 핵심 변경 사항

1. **`retry.RetryOnConflict` 기반 Status 업데이트**: Pause 처리 시 Status 업데이트를 conflict resolution과 함께 재시도한다. 실패 시 10초 후 requeue하여 최종적 일관성을 보장한다.

2. **`Paused` Condition 타입 도입**: `meta.SetStatusCondition`을 활용하여 `Paused` condition을 CR status에 추가한다. 이는 ADR-0013의 `CircuitBreakerOpen` condition과 동일한 패턴이다.

3. **Resume 시 Stale Condition 정리**: Resume 시 `Paused`와 `ReconcileFailed` condition을 제거하고, `status.Phase`를 `Reconciling`으로 전환한다.

```go
func (r *AerospikeClusterReconciler) handlePause(ctx context.Context, cluster *v1alpha1.AerospikeCluster) (ctrl.Result, error) {
    err := retry.RetryOnConflict(retry.DefaultRetry, func() error {
        latest := &v1alpha1.AerospikeCluster{}
        if err := r.Get(ctx, client.ObjectKeyFromObject(cluster), latest); err != nil {
            return err
        }
        latest.Status.Phase = "Paused"
        meta.SetStatusCondition(&latest.Status.Conditions, metav1.Condition{
            Type:    "Paused",
            Status:  metav1.ConditionTrue,
            Reason:  "UserRequested",
            Message: "Cluster paused by user",
        })
        return r.Status().Update(ctx, latest)
    })
    if err != nil {
        return ctrl.Result{RequeueAfter: 10 * time.Second}, err
    }
    return ctrl.Result{}, nil
}

func (r *AerospikeClusterReconciler) handleResume(ctx context.Context, cluster *v1alpha1.AerospikeCluster) {
    meta.RemoveStatusCondition(&cluster.Status.Conditions, "Paused")
    meta.RemoveStatusCondition(&cluster.Status.Conditions, "ReconcileFailed")
    cluster.Status.Phase = "Reconciling"
}
```

### 메트릭

- `acko_cluster_paused_duration_seconds`: Pause 지속 시간 추적을 위한 Prometheus 메트릭 추가

### CRD 변경

- `status.conditions[]`에 `Paused` 타입 추가 (하위 호환)

## 대안 (Alternatives Considered)

### Option B: Pause 중 Light-Weight Watch 유지

Pause 중에도 Pod/PVC 상태를 60초 간격으로 체크하고, 변경 감지 시 Event를 생성하는 방식.

- **장점**: Pause 중 drift를 감지할 수 있어 Resume 시 예상치 못한 상태 divergence 방지
- **단점**:
  - Pause의 목적(reconciliation 완전 중단)과 의미적으로 모순
  - 60초 requeue는 불필요한 API server 부하 유발
  - Option A와 독립적으로 논의 가능한 별도 범위의 기능
- **결론**: Option A의 범위를 넘는 별도 기능. 필요 시 별도 ADR로 제안 가능

### Option C: 현재 유지 + 문서화

Pause 시 Status 불일치 가능성을 문서에 명시하고, `kubectl annotate` 기반 수동 리셋 가이드를 제공하는 방식.

- **장점**: 코드 변경 없음, 즉시 적용 가능
- **단점**:
  - 문서화만으로는 운영 중 실수를 방지할 수 없음
  - 근본적 해결이 아닌 회피 전략
  - "Quality over speed" 프로젝트 원칙에 반함
- **결론**: 임시 조치로는 가능하나 장기적 해결책이 될 수 없음

## 결과 (Consequences)

### 긍정적

- **Status 정합성 보장**: `retry.RetryOnConflict`로 Status 업데이트 실패 시나리오를 안정적으로 처리
- **운영 가시성 향상**: `Paused` condition으로 클러스터 상태를 명확하게 구분 가능
- **Cluster Manager UI 정확성**: ACKO status를 읽는 Cluster Manager가 정확한 상태를 표시
- **기존 패턴과 일관성**: ADR-0013의 condition 패턴을 재사용하여 코드베이스 일관성 유지
- **하위 호환**: CRD condition 추가는 breaking change가 아님
- **메트릭을 통한 관찰성**: Pause 지속 시간 추적으로 운영 인사이트 제공

### 부정적

- **코드 복잡도 증가**: `pause_handler.go` 파일 추가 및 retry 로직 도입
- **Circuit Breaker와의 상호작용**: Circuit breaker open 상태에서 pause가 설정되는 경우의 condition 우선순위를 명확히 정의해야 함
- **Option B 미포함**: Pause 중 drift 감지 기능은 이 ADR 범위에 포함되지 않음. 필요 시 별도 ADR로 논의

## 관련 ADR

- [ADR-0013: Reconciliation Circuit Breaker 도입](/architecture/adr/2026-03-01-reconciliation-circuit-breaker) — `CircuitBreakerOpen` condition 패턴의 선례. Pause condition과의 상호작용 정의 필요
- [ADR-0012: Pod Readiness Gates 도입](/architecture/adr/2026-02-20-pod-readiness-gates) — 정확한 상태 반영 원칙의 선례
- [ADR-0002: Kubebuilder v4 + controller-runtime 선택](/architecture/adr/2026-01-18-kubebuilder-v4) — controller-runtime의 `meta.SetStatusCondition` 유틸리티 활용 근거
- [ADR-0011: CRD 이름 AerospikeCluster로 변경](/architecture/adr/2026-03-10-crd-rename-aerospikecluster) — CRD status subresource 구조 참조
