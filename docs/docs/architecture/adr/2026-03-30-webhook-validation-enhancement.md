---
title: "ADR-0036: ACKO Webhook Validation 강화 — replication-factor, port overlap, batch size 사전 검증"
description: ACKO webhook에 replication-factor, 포트 충돌, batch size 검증을 추가하여 런타임 오류를 admission 단계에서 차단하는 아키텍처 결정
sidebar_position: 36
scope: single-repo
repos: [acko]
tags: [adr, acko, webhook, validation, stabilization]
last_updated: 2026-03-30
---

# ADR-0036: ACKO Webhook Validation 강화 — replication-factor, port overlap, batch size 사전 검증

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#28
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

ACKO webhook은 현재 Aerospike CE 제약인 최대 8개 node, 최대 2개 namespace, XDR/TLS 금지를 검증합니다. 그러나 세 가지 configuration error는 **runtime에서만 발견됩니다**. 이 error는 `kubectl apply` 뒤 Pod의 `CrashLoopBackOff`이나 불안정한 cluster 상태로 나타나 원인을 찾기 어렵습니다.

### 문제 1: replication-factor vs cluster size 불일치

3-node cluster에 `replication-factor: 5`를 설정해도 webhook을 통과합니다. Aerospike server는 시작한 뒤 error를 발생시키고 cluster 전체가 unhealthy 상태가 되어 자동 복구할 수 없습니다.

### 문제 2: Service/Heartbeat/Fabric 포트 충돌

`spec.aerospikeConfig.network`에서 `service.port`와 `heartbeat.port`가 같으면 mesh를 만들지 못합니다. Node 간 통신이 끊겨 split-brain 위험이 생기고 ADR-0012(Pod Readiness Gates)의 readiness gate도 통과하지 못합니다.

### 문제 3: Rolling update batch size 0

`maxUnavailable: "10%"`이면 1~9-node cluster에서 batch size가 0으로 계산될 수 있습니다. Rolling restart가 계속 대기하고 ADR-0013(Reconciliation Circuit Breaker)의 circuit breaker가 열릴 때까지 최대 50분 동안 불필요하게 재시도합니다.

### ADR-0019와의 관계

ADR-0019 (ValidationError Circuit Breaker)는 "Webhook Validation Enhancement — Prevent as many ValidationErrors as possible at admission stage"를 명시적으로 권장하고 있다. 위 3가지 오류는 모두 런타임에서 `ValidationError`로 분류될 영구 오류이며, admission 단계에서 차단하면 circuit breaker 활성화 자체를 불필요하게 만든다.

## 결정 (Decision)

> **ValidateCreate/ValidateUpdate webhook에 replication-factor 검증, 포트 고유성 검증, batch size 최소값 검증 3가지를 추가한다.**

### 1. replication-factor ≤ cluster size 검증

```go
if rf > cluster.Spec.Size {
    return fmt.Errorf("replication-factor %d exceeds cluster size %d", rf, cluster.Spec.Size)
}
```

ValidateUpdate에서는 `newObj.Spec.Size` 기준으로 검증하여, scale-up과 replication-factor 변경을 동시에 적용하는 경우도 올바르게 처리한다.

### 2. 포트 고유성 검증

```go
ports := collectPorts(cluster.Spec.AerospikeConfig.Network) // service, heartbeat, fabric
if hasDuplicate(ports) {
    return fmt.Errorf("duplicate port detected: %v", duplicates)
}
```

service, heartbeat, fabric 포트가 모두 고유한지 확인한다.

### 3. Batch size 최소값 검증

```go
batchSize := computeBatchSize(cluster)
if batchSize < 1 {
    return fmt.Errorf("computed batch size is 0 for %d nodes with maxUnavailable %s", ...)
}
```

`maxUnavailable` 퍼센티지 적용 시 batch size가 최소 1이 되도록 보장한다.

## 대안 (Alternatives Considered)

### Option A: Webhook 검증 (채택)

- **장점**: 가장 빠른 피드백 (kubectl apply 시점), 구현 단순 (순수 데이터 검증), 기존 webhook 인프라 활용
- **단점**: webhook이 비활성화된 환경에서는 보호 불가

### Option B: Controller-level 검증만

- **장점**: webhook 없이도 동작
- **단점**: Pod 생성 후에야 오류 발견, CrashLoopBackOff 발생 후 디버깅 필요, ADR-0019의 circuit breaker에 의존해야 함

### Option C: Defaulting webhook으로 자동 보정

- **장점**: 사용자 개입 없이 자동 수정
- **단점**: 사용자 의도와 다른 값으로 변경될 위험, 디버깅 어려움, "silent fix"는 설계 철학에 맞지 않음

## 결과 (Consequences)

### 긍정적

- **즉각적 피드백**: `kubectl apply` 시점에 명확한 에러 메시지로 구성 오류 차단
- **운영 안정성 향상**: CrashLoopBackOff, split-brain, 영구 대기 상태를 원천 방지
- **ADR-0019 시너지**: admission 단계에서 영구 오류를 차단하여 reconciliation circuit breaker 불필요 활성화 감소
- **Goal 3-5 직접 지원**: CE 제약 Webhook 검증 신뢰성 목표에 부합
- **Goal 3-4 지원**: E2E 테스트 시나리오 확장 (검증 실패 케이스)
- **낮은 위험**: 기존 유효한 CR에 영향 없음, 추가 검증만 도입

### 부정적

- **Webhook 비활성화 환경**: webhook이 비활성화된 클러스터에서는 보호 불가 (controller-level fallback 검토 가능)
- **유지보수 범위 증가**: Aerospike 설정 항목 변경 시 webhook 검증도 함께 업데이트 필요
- **Scale-up 시나리오 주의**: ValidateUpdate에서 현재 cluster size가 아닌 새로운 spec의 size 기준으로 검증해야 함

## 관련 ADR

- **ADR-0019**: ValidationError Circuit Breaker — webhook validation 강화를 명시적으로 권장
- **ADR-0013**: Reconciliation Circuit Breaker — admission 단계 검증으로 불필요한 reconciliation 실패 방지
- **ADR-0012**: Pod Readiness Gates — 포트 충돌 방지로 readiness gate 정상 동작 보장
- **ADR-0002**: Kubebuilder v4 — webhook scaffolding 인프라 기반
