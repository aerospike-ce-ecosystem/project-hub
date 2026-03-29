---
title: "ADR-0013: Reconciliation Circuit Breaker 도입"
description: 무한 reconciliation 루프 방지를 위해 5분 context timeout, 지수 백오프, 10회 연속 실패 시 circuit breaker를 도입한 아키텍처 결정 기록.
scope: single-repo
repos: [acko]
tags: [adr, acko, kubernetes, reconciliation, circuit-breaker, reliability]
last_updated: 2026-03-29
---

# ADR-0013: Reconciliation Circuit Breaker 도입

## 상태

**Accepted**

- 제안일: 2026-03-01
- 승인일: 2026-03-08

## 맥락 (Context)

Kubernetes Operator의 reconciliation loop는 desired state와 actual state의 차이를 해소하기 위해 반복 실행됩니다. 그러나 특정 상황에서 무한 루프가 발생할 수 있었습니다:

- **잘못된 CR spec**: 유효하지 않은 설정값이 매 reconcile마다 동일한 에러 유발
- **외부 의존성 장애**: Aerospike 노드 응답 없음 시 지속적인 재시도
- **API server 과부하**: 빠른 재시도로 인해 kube-apiserver에 과도한 요청 발생
- **로그 폭증**: 동일 에러의 반복 로깅으로 모니터링 시스템 부하

운영 환경에서 단일 잘못된 CR이 전체 Operator의 처리 능력을 소진시키는 사례가 보고되었습니다.

## 결정 (Decision)

> **Reconciliation에 5분 context timeout, 지수 백오프(exponential backoff), 10회 연속 실패 시 circuit breaker를 적용한다.**

### 구현 세부사항

- **Context timeout**: 각 reconcile 호출에 5분 `context.WithTimeout` 적용
- **지수 백오프**: 실패 시 재시도 간격을 1s, 2s, 4s, ... 최대 5분까지 증가
- **Circuit breaker**: 동일 CR에 대해 10회 연속 실패 시 reconciliation 일시 중단
  - 상태를 CR의 `.status.conditions`에 `CircuitBreakerOpen`으로 기록
  - 30분 후 자동으로 half-open 상태로 전환하여 1회 재시도
  - 성공 시 circuit 닫힘, 실패 시 다시 open
- **메트릭 노출**: `acko_reconcile_failures_total`, `acko_circuit_breaker_state` Prometheus 메트릭 추가

## 대안 검토 (Alternatives Considered)

### 대안 1: 고정 간격 재시도만 적용

- **설명**: 실패 시 일정 간격(예: 30초)으로 재시도
- **장점**: 구현 단순
- **단점**: API server 부하 경감 효과 제한적, 일시적 장애와 영구적 장애 구분 불가
- **미선택 사유**: 영구적 오류 상황에서 무의미한 재시도가 지속됨

### 대안 2: 수동 개입 요구

- **설명**: N회 실패 시 reconciliation을 완전 중단하고 운영자 개입 대기
- **장점**: 불필요한 리소스 소비 완전 차단
- **단점**: 일시적 장애가 해소되어도 자동 복구 불가, 운영 부담 증가
- **미선택 사유**: Self-healing 원칙에 위배

## 결과 (Consequences)

### 긍정적 결과

- **Operator 자기 보호**: 단일 불량 CR이 전체 Operator 성능에 영향을 주지 않음
- **API server 부하 경감**: 지수 백오프로 실패 시 요청 빈도 자연 감소
- **가시성 향상**: Circuit breaker 상태가 CR status에 명확히 표시되어 문제 진단 용이
- **자동 복구**: Half-open 메커니즘으로 일시적 장애 해소 후 자동으로 정상 운영 재개

### 부정적 결과 / 트레이드오프

- **복구 지연**: Circuit breaker open 상태에서 30분간 reconciliation 중단
- **상태 관리 복잡성**: CR별 실패 카운터와 circuit breaker 상태 추적 필요
- **설정 튜닝**: timeout, 백오프 최대값, circuit breaker 임계값의 적정치 결정 필요

### 리스크

- Circuit breaker 임계값이 너무 낮으면 정상적인 일시적 실패에도 불필요하게 트리거
- Half-open 전환 타이밍이 부적절하면 복구가 지연될 수 있음

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `acko` | Reconciler에 timeout, backoff, circuit breaker 로직 구현 |
| `plugins` | ACKO 운영 Skill에 circuit breaker 상태 트러블슈팅 가이드 추가 |

## 참고 자료

- [Circuit Breaker Pattern (Microsoft)](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [controller-runtime Rate Limiting](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/ratelimiter)
