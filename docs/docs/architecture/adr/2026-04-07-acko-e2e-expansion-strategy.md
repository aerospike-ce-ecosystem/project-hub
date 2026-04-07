---
title: "ADR-0039: ACKO E2E 테스트 확장 전략 — Kind 기반 운영 시나리오 테스트 프레임워크"
description: ACKO의 E2E 테스트를 시나리오별 독립 테스트 스위트와 CI matrix 병렬 실행으로 확장하는 전략 결정.
sidebar_position: 39
scope: single-repo
repos: [acko]
tags: [adr, acko, e2e, testing, kind, kubernetes, ci]
last_updated: 2026-04-07
---

# ADR-0039: ACKO E2E 테스트 확장 전략 — Kind 기반 운영 시나리오 테스트 프레임워크

## 상태

**Proposed**

- 제안일: 2026-04-07
- 관련 이슈: aerospike-ce-ecosystem/project-hub#51
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Q2 2026 로드맵과 프로젝트 목표 3-4에서 ACKO의 E2E 테스트 커버리지 확장을 명시하고 있다. 현재 ACKO E2E 테스트는 Ginkgo v2 + Gomega 프레임워크를 사용하며, Kind 클러스터에서 7개 테스트 파일(cluster 생성, features, multirack, PVC, template, 기본 E2E)을 실행한다.

그러나 실제 운영 환경에서 발생하는 핵심 시나리오들이 E2E 레벨에서 검증되지 않고 있다:

| 시나리오 | 복잡도 | 위험도 | 관련 ADR |
|---------|:------:|:------:|---------|
| Scale up/down | 중 | 높음 | ADR-0013 (Circuit Breaker) |
| Rolling update | 높음 | 높음 | ADR-0012 (Pod Readiness Gates) |
| ACL 활성화/비활성화 | 중 | 중 | — |
| 모니터링 (ServiceMonitor) | 낮음 | 낮음 | — |
| 외부 네트워크 접근 | 높음 | 중 | ADR-0038 (External Network Access) |
| Dynamic config 변경 | 중 | 중 | ADR-0020 (Dynamic Config Transaction) |

이러한 시나리오는 기존 ADR에서 설계된 메커니즘(readiness gate, circuit breaker, webhook validation 등)이 실제로 동작하는지를 검증하는 데 필수적이다.

## 결정 (Decision)

> **시나리오별 독립 테스트 스위트(Option B)와 CI matrix 병렬 실행(Option C)을 조합하여 E2E 테스트를 확장한다.**

### 구체적 결정 사항

1. **시나리오별 독립 테스트 파일 분리**: 각 운영 시나리오를 독립된 `_test.go` 파일로 구현하여 테스트 간 격리를 보장하고 병렬 실행을 가능하게 한다.

2. **CI matrix strategy 도입**: GitHub Actions의 matrix strategy로 시나리오별 병렬 실행을 지원하되, 리소스 제약에 따라 순차 fallback이 가능하도록 설계한다.

3. **Kind 클러스터 시나리오 그룹별 공유**: 완전 격리(시나리오당 1개 Kind 클러스터)와 전체 공유(1개 Kind 클러스터) 사이의 절충안으로, 관련 시나리오를 그룹으로 묶어 Kind 클러스터를 공유한다.

### 구현 시 결정 필요 사항

- CI 실행 시간 예산 (현재 E2E 소요 시간 대비 허용 증가량)
- Kind에서 LoadBalancer 테스트 방법 (metallb 또는 cloud-provider-kind)
- 테스트 데이터 fixture 관리 (scale-down 시 데이터 검증 방법)

## 대안 (Alternatives Considered)

### Option A: 기존 E2E 파일에 시나리오 추가

기존 테스트 파일에 새로운 테스트 케이스를 추가하는 가장 단순한 접근법.

- **장점**: 빠른 구현, 구조 변경 불필요
- **단점**: 파일 비대화, 테스트 간 의존성 증가, 병렬 실행 불가, 실패 시 원인 격리 어려움
- **기각 이유**: 6개 이상의 운영 시나리오를 기존 파일에 추가하면 유지보수성이 급격히 저하됨

### Option B: 시나리오별 독립 테스트 스위트 (채택)

각 운영 시나리오를 독립된 테스트 파일로 분리.

- **장점**: 테스트 격리, 병렬 실행 가능, 실패 원인 즉시 파악
- **단점**: Kind 클러스터 lifecycle 관리 복잡

### Option C: CI matrix strategy (채택)

GitHub Actions matrix로 시나리오별 병렬 실행.

- **장점**: 전체 E2E 실행 시간 단축, GitHub Actions 네이티브 지원
- **단점**: CI 리소스 비용 증가, matrix 설정 복잡도

### 최종 선택: Option B + C 조합

독립 테스트 파일 분리와 CI matrix 병렬 실행을 조합하여, 테스트 격리와 실행 효율성을 동시에 확보한다.

## 결과 (Consequences)

### 긍정적

- **운영 시나리오 사전 검증**: scale, rolling update, ACL 등 핵심 운영 시나리오를 릴리스 전에 자동 검증하여 품질 향상
- **ADR 구현 회귀 방지**: ADR-0012(Readiness Gates), ADR-0013(Circuit Breaker), ADR-0038(External Network) 등의 구현이 E2E 레벨에서 지속적으로 검증됨
- **기여자 신뢰도 향상**: 변경 사항이 운영 시나리오를 깨뜨리지 않는다는 확신 제공
- **병렬 실행으로 CI 시간 최적화**: matrix strategy로 전체 E2E 시간을 선형 증가 없이 관리 가능
- 프로젝트 핵심 가치 "Quality over speed"에 부합

### 부정적

- **CI 실행 시간 증가**: Kind 클러스터 생성/삭제 overhead로 개별 시나리오당 추가 시간 소요
- **GitHub Actions 리소스 비용 증가**: 병렬 matrix 실행으로 동시 runner 수 증가
- **E2E 테스트 유지보수 부담**: 새로운 운영 시나리오 테스트 코드의 유지보수 필요
- **Kind 환경 한계**: Kind에서 LoadBalancer, 네트워크 정책 등 일부 시나리오의 완전한 시뮬레이션이 어려울 수 있음

## 관련 ADR

- [ADR-0002: Kubebuilder v4 + controller-runtime 선택](/docs/architecture/adr/2026-01-18-kubebuilder-v4) — ACKO의 기반 프레임워크, envtest 테스트 인프라
- [ADR-0012: Pod Readiness Gates 도입](/docs/architecture/adr/2026-02-20-pod-readiness-gates) — rolling update 시나리오 E2E 검증 대상
- [ADR-0013: Reconciliation Circuit Breaker 도입](/docs/architecture/adr/2026-03-01-reconciliation-circuit-breaker) — scale up/down 시나리오에서 circuit breaker 동작 검증
- [ADR-0015: asinfo 기반 Health Check 도입](/docs/architecture/adr/2026-03-05-asinfo-health-checks) — health check 기반 readiness 판단 E2E 검증
- [ADR-0020: Webhook Validation 강화](/docs/architecture/adr/2026-03-30-webhook-validation-enhancement) — CE 제약 검증의 E2E 레벨 회귀 방지
- [ADR-0038: ACKO 외부 네트워크 접근](/docs/architecture/adr/2026-04-05-external-network-access) — Kind에서 LB 시뮬레이션 테스트 필요성
