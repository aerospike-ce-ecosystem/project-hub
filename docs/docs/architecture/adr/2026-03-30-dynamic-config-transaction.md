---
title: "ADR-0020: ACKO Dynamic Config 부분 적용 방지를 위한 트랜잭션 보장 전략"
description: ACKO의 동적 설정 변경 시 부분 적용을 방지하기 위해 Two-Phase Commit 패턴과 ConfigDegraded 상태 전환을 도입하는 전략
sidebar_position: 29
scope: single-repo
repos: [acko]
tags: [adr, acko, dynamic-config, reconciliation, transaction, stabilization]
last_updated: 2026-03-30
---

# ADR-0020: ACKO Dynamic Config 부분 적용 방지를 위한 트랜잭션 보장 전략

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#32
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

ACKO의 `reconciler_dynamic_config.go`에서 동적 설정 변경 시, 여러 설정 항목을 Pod별로 순차 적용하는 과정에서 두 가지 심각한 문제가 존재한다.

### 문제 1: 롤백 실패 시 하이브리드 상태

동적 설정 적용 중 실패하면 `rollbackDynamicChanges()`를 호출하지만, 롤백 명령 자체가 실패할 경우 로그만 남기고 계속 진행한다. 이로 인해 Aerospike 노드가 **일부 변경은 적용, 일부는 롤백, 일부는 미시도**된 하이브리드 상태에 빠질 수 있다.

### 문제 2: Context Cancellation으로 인한 부분 적용

ADR-0013에서 도입한 5분 reconciliation timeout 내에서 동적 설정 변경이 Pod별로 순차 진행된다. 예를 들어 5개 Pod 중 3번째에서 context가 만료되면:
- Pod 1-3: 새 설정 적용됨
- Pod 4-5: 이전 설정 유지
- 클러스터 전체가 설정 불일치 상태에 놓인다

이는 운영 환경에서 예측 불가능한 동작을 초래하며, 특히 네트워크 관련 설정(heartbeat interval 등)의 불일치는 클러스터 분리(split)로 이어질 수 있다.

### 영향받는 코드
- `internal/controller/reconciler_dynamic_config.go` (lines 38, 72-91)
- `internal/controller/reconciler.go` (reconciliation timeout context)

## 결정 (Decision)

> **ACKO의 동적 설정 변경에 Two-Phase Commit 패턴을 도입하고, 롤백 실패 시 ConfigDegraded 상태로 전환하며, Per-Pod 타임아웃을 분리한다.**

### 1. Two-Phase Commit 패턴

모든 Pod에 대해 설정 변경을 두 단계로 수행한다:

- **Phase 1 (Validate/Dry-run)**: 모든 대상 Pod에 설정 검증 요청을 보내 적용 가능 여부를 사전 확인한다. 하나라도 실패하면 Phase 2로 진행하지 않는다.
- **Phase 2 (Apply)**: 모든 Pod에서 검증이 성공한 경우에만 실제 설정을 적용한다.

이 패턴은 "전체 성공 또는 전체 미적용"을 보장하여 부분 적용 상태를 원천적으로 방지한다.

### 2. Per-Pod 타임아웃 분리

전체 reconciliation timeout(5분)과 별도로, 개별 Pod에 대한 동적 설정 변경 타임아웃을 설정한다. 이를 통해:
- 개별 Pod의 느린 응답이 전체 context를 소진하지 않도록 방지
- Pod별 실패를 조기에 감지하여 Phase 1에서 중단 가능

### 3. 롤백 실패 시 ConfigDegraded 상태 전환

롤백이 실패하면 `ConfigDegraded` ClusterPhase로 전환하여 운영자에게 수동 개입이 필요함을 명시적으로 알린다. 이는 Kubernetes의 Condition/Phase 패턴을 따르며, 문제 상황의 가시성을 높인다.

### 4. Status Condition에 부분 적용 기록

어떤 Pod에 어떤 설정이 적용/미적용되었는지를 Status Condition에 기록하여, 운영자가 클러스터의 정확한 설정 상태를 파악할 수 있도록 한다.

## 대안 (Alternatives Considered)

### 대안 1: 설정 변경 시 전체 Rolling Restart

모든 동적 설정 변경을 rolling restart로 처리하는 방식. 안전하지만 가용성 비용이 매우 높다. 동적 설정 변경의 핵심 장점(무중단 적용)을 포기하게 되므로 부적절하다.

| 기준 | 평가 |
|------|------|
| 안전성 | ✅ 완전한 일관성 보장 |
| 가용성 | ❌ 노드별 재시작 필요 |
| 운영 편의성 | ❌ 단순 설정 변경에 과도한 비용 |

### 대안 2: Operator 레벨 Retry with Exponential Backoff

일시적 실패에 대해 지수 백오프로 재시도하는 방식. ADR-0013의 circuit breaker와 결합하면 일시적 장애에는 효과적이지만, 영구 실패(잘못된 설정값 등)에는 무한 루프 위험이 있다. 또한 부분 적용 상태 자체를 방지하지는 못한다.

| 기준 | 평가 |
|------|------|
| 일시적 장애 | ✅ 자동 복구 가능 |
| 영구 장애 | ❌ 무한 루프 위험 |
| 부분 적용 방지 | ❌ 근본 해결 아님 |

### 제안된 접근법 (Two-Phase Commit + ConfigDegraded + Per-Pod Timeout)

| 기준 | 평가 |
|------|------|
| 부분 적용 방지 | ✅ Phase 1에서 사전 차단 |
| 장애 가시성 | ✅ ConfigDegraded + Status Condition |
| 복구 시간 | ✅ 수동 개입 시점 명확 |
| 구현 복잡도 | ⚠️ 중간 (기존 reconciler에 phase 분리 필요) |

## 결과 (Consequences)

### 긍정적
- 클러스터 전체의 설정 일관성 보장 — "전체 적용 또는 전체 미적용" 원칙 확립
- 운영 가시성 대폭 향상 — 부분 적용 상태를 Status Condition에서 즉시 확인 가능
- 장애 복구 시간 단축 — ConfigDegraded 상태로 수동 개입 필요 시점이 명확
- ADR-0013 Circuit Breaker와 상호 보완 — timeout으로 인한 부분 적용을 방지하면서 circuit breaker의 과부하 방지 기능 유지

### 부정적
- 구현 복잡도 증가 — Two-Phase Commit 로직 추가로 reconciler 코드가 복잡해짐
- 설정 변경 시간 약간 증가 — dry-run 단계 추가로 전체 소요 시간이 늘어남
- Aerospike info 명령의 dry-run 지원 여부 확인 필요 — 실제 구현 시 Aerospike 서버 측 지원을 검증해야 함

## 관련 ADR

- [ADR-0013: Reconciliation Circuit Breaker](/docs/architecture/adr/2026-03-01-reconciliation-circuit-breaker) — 5분 context timeout과 circuit breaker 패턴. 이번 ADR은 해당 timeout 내에서 발생하는 부분 적용 문제를 보완
- [ADR-0012: Pod Readiness Gates](/docs/architecture/adr/2026-02-20-pod-readiness-gates) — Pod 상태 관리의 세밀한 제어 방향과 일치
- [ADR-0018: Pause/Resume Status Condition](/docs/architecture/adr/2026-03-30-pause-resume-status-condition) — Status Condition 정합성 보장 패턴의 선례
- [ADR-0002: Kubebuilder v4](/docs/architecture/adr/2026-01-18-kubebuilder-v4) — ACKO의 기반 프레임워크
