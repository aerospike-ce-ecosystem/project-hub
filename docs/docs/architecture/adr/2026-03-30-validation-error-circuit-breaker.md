---
title: "ADR-0019: ACKO ValidationError 기반 영구/일시적 오류 분류로 Circuit Breaker 불필요 재시도 방지"
description: ACKO의 기존 ValidationError 타입을 활용하여 영구적 오류를 즉시 식별하고 Circuit Breaker를 즉시 활성화함으로써 불필요한 재시도를 방지하는 아키텍처 결정.
sidebar_position: 28
scope: single-repo
repos: [acko, plugins]
tags: [adr, acko, kubernetes, reconciliation, circuit-breaker, validation, error-handling]
last_updated: 2026-03-30
---

# ADR-0019: ACKO ValidationError 기반 영구/일시적 오류 분류로 Circuit Breaker 불필요 재시도 방지

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#20
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

ADR-0013에서 도입된 Reconciliation Circuit Breaker는 `maxFailedReconciles = 10`회 연속 실패 시 활성화되어 exponential backoff을 적용한다. 이 메커니즘은 무한 reconciliation 루프를 효과적으로 방지하지만, **영구적 오류(Permanent Error)**와 **일시적 오류(Transient Error)**를 구분하지 않는 한계가 있다.

### 현재 상태

- `internal/errors/errors.go`에 `ValidationError` 타입이 정의되어 있으나, controller 코드에서 거의 활용되지 않음
- `reconciler.go:390-403`의 `calculateBackoff()`에서 모든 오류를 동일하게 취급
- Webhook 유효성 검사를 통과한 후에도 런타임에서 발견되는 설정 오류가 존재 (예: Aerospike CE가 지원하지 않는 XDR 설정, 잘못된 namespace 설정)

### 문제점

1. **불필요한 재시도 비용**: 영구 오류에 대해 10회 × 5분 backoff = 최대 50분의 무의미한 대기
2. **오퍼레이터 리소스 낭비**: 실패할 reconcile 루프가 API server, Aerospike 클라이언트 커넥션을 불필요하게 소비
3. **운영자 혼란**: Circuit Breaker 활성화까지 의미 없는 재시도 이벤트가 K8s Event에 누적되어 실제 문제 진단을 방해

### ADR-0017과의 관계

ADR-0017은 에러 유형별 차등 임계값(Transient/Infrastructure/Configuration 3단계 분류)을 제안했으나, 에러 분류 기준 미검증과 복잡성으로 보류되었다. 본 제안은 ADR-0017의 전체 에러 분류 체계가 아닌, **이미 코드에 존재하는 `ValidationError` 타입**을 활용한 단순 이진 분류(영구/일시적)로, ADR-0017의 보류 사유에 해당하지 않는 최소 침습적 접근이다.

## 결정 (Decision)

> **`IsValidation(err)` 체크를 Circuit Breaker 로직에 통합하여, ValidationError는 즉시 Circuit Breaker를 활성화하고 재시도를 스킵한다.**

### 핵심 변경 사항

1. **ValidationError 즉시 Circuit Break**: `reconciler.go`의 실패 카운터 증가 로직에 `errors.IsValidation(err)` 분기를 추가하여, ValidationError인 경우 `failedReconciles`를 `maxFailedReconciles`로 즉시 설정
2. **Status Condition 기록**: `reason: PermanentError`, `message: <validation 상세>` 형태로 Status Condition에 기록 (ADR-0013의 `CircuitBreakerOpen` 및 ADR-0018의 `Paused` condition과 동일한 패턴)
3. **K8s Event 기록**: "영구 오류로 자동 재시도 중단됨" 메시지를 K8s Event에 기록하여 운영자에게 즉시 알림
4. **Webhook Validation 강화**: 가능한 한 많은 ValidationError를 admission 단계에서 사전 차단
5. **수동 재시도 지원**: `kubectl annotate ... force-reconcile=true` annotation으로 오판 시 수동 재시도 가능

### 영향받는 코드

| 파일 | 변경 내용 |
|------|----------|
| `internal/controller/reconciler.go` | 실패 분류 분기 추가, ValidationError 시 즉시 circuit break |
| `internal/errors/errors.go` | ValidationError 활용 패턴 문서화 |
| `api/v1alpha1/aerospikecluster_webhook.go` | Webhook validation 강화 |

## 대안 (Alternatives Considered)

### 대안 1: maxFailedReconciles 값 축소 (10 → 3)

- **장점**: 코드 변경 최소화 (설정값 하나만 수정)
- **단점**: 일시적 오류(네트워크 지연, DNS 실패 등)에 대한 복원력 약화. 3회 만에 circuit break이 발생하면 자동 복구 가능한 상황에서도 운영자 개입이 필요해짐
- **평가**: 근본 원인 해결이 아닌 임시 방편. 영구/일시적 오류의 특성 차이를 무시함

### 대안 2: 별도 PermanentError 전용 Circuit Breaker

- **장점**: 일시적/영구적 오류 각각에 독립 임계값 설정 가능, 세밀한 제어
- **단점**: 복잡도 증가, 두 breaker 간 상호작용 관리 필요, 테스트 매트릭스 확대
- **평가**: 현재 ACKO v0.1.x 규모에서 과도한 설계. ADR-0017 보류 사유와 유사한 복잡성 문제

## 결과 (Consequences)

### 긍정적

- 영구 오류 발생 시 즉시 운영자에게 명확한 피드백 제공 (50분 → 즉시)
- 불필요한 API server/Aerospike 클라이언트 커넥션 리소스 소비 제거
- K8s Event 노이즈 감소로 운영 가시성 향상
- 기존 `ValidationError` 타입 활용으로 새로운 타입 시스템 도입 불필요
- Goal 3-5 "CE 제약 Webhook 검증 신뢰성" 목표와 직접 부합
- Q2 E2E 테스트 확장 목표(Goal 3-4)와 연계 — ValidationError 시나리오 테스트 추가 가능

### 부정적

- ValidationError 분류가 부정확할 경우, 정상 복구 가능한 오류를 영구로 오판하여 자동 복구 기회를 상실할 수 있음
  - **Mitigation**: Status Condition에 `force-reconcile=true` annotation 사용법 안내 포함
- `ValidationError`를 반환하는 코드 경로에 대한 검증 필요 — 현재 controller에서 `ValidationError`를 적절히 생성하는 코드가 부족할 수 있음
  - **Mitigation**: 구현 시 `ValidationError` 생성 경로를 명확히 정의하고 E2E 테스트로 검증

## 관련 ADR

- **ADR-0013 (Reconciliation Circuit Breaker 도입)**: 본 제안의 기반. 10회 고정 임계값과 `CircuitBreakerOpen` condition 패턴을 확립
- **ADR-0017 (Circuit Breaker 임계값 자동 조정)**: 보류됨. 전체 에러 분류 체계의 복잡성 문제를 지적. 본 제안은 이진 분류로 복잡성을 회피
- **ADR-0018 (Pause/Resume Status Condition)**: Status Condition 기반 상태 노출 패턴을 공유. `PermanentError` reason 추가는 동일한 설계 철학
