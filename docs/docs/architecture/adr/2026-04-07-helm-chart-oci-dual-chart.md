---
title: "ADR-0039: ACKO Helm Chart 버전 관리 체계 — OCI Registry 기반 CRD/Operator 이중 Chart 릴리스"
description: ACKO의 CRD와 Operator를 독립된 Helm chart로 분리하고 GHCR OCI Registry를 통해 배포하는 버전 관리 체계에 대한 아키텍처 결정.
sidebar_position: 39
scope: single-repo
repos: [acko]
tags: [adr, acko, helm, oci, crd, versioning, kubernetes]
last_updated: 2026-04-07
---

# ADR-0039: ACKO Helm Chart 버전 관리 체계 — OCI Registry 기반 CRD/Operator 이중 Chart 릴리스

## 상태

**Proposed**

- 제안일: 2026-04-07
- 관련 이슈: aerospike-ce-ecosystem/project-hub#49
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

ACKO는 `publish-chart.yml` 워크플로우를 통해 2개의 Helm chart를 GHCR OCI registry에 배포하고 있다:

1. **aerospike-ce-kubernetes-operator-crds** — CRD 정의만 포함
2. **aerospike-ce-kubernetes-operator** — Operator deployment, RBAC, crds chart 의존

배포 과정에서 CRD chart를 먼저 publish한 후, operator chart의 의존성 참조를 `file://` → `oci://`로 전환하는 패턴을 사용한다. Chart 버전은 git tag에서 자동 추출된다.

이 패턴은 Q2 로드맵 항목 "Helm chart 버전 관리 체계화"의 대상이며, 설계 근거가 ADR로 기록되어 있지 않았다.

### 기술적 배경

- Kubernetes에서 CRD는 cluster-scoped 리소스로 Operator보다 긴 lifecycle을 가진다. CRD 업그레이드와 Operator 업그레이드를 독립적으로 수행할 수 있어야 zero-downtime 운영이 가능하다.
- Helm 3.8+부터 OCI registry가 GA(General Availability)로 지원되며, `helm pull oci://` 명령으로 OCI 아티팩트를 직접 설치할 수 있다.
- ADR-0011에서 CRD 이름을 AerospikeCluster로 변경하면서 CRD 독립 관리의 중요성이 더 커졌다.

## 결정 (Decision)

> **CRD와 Operator를 독립된 Helm chart로 유지하고, GHCR OCI Registry를 통해 배포하는 이중 Chart 체계를 공식 채택한다.**

구체적으로:

1. **이중 Chart 구조 유지**: `aerospike-ce-kubernetes-operator-crds`와 `aerospike-ce-kubernetes-operator` 두 개의 chart를 독립적으로 관리한다.
2. **OCI Registry 배포**: GHCR(GitHub Container Registry)을 OCI registry로 사용하여 `oci://ghcr.io/` 경로로 chart를 배포한다.
3. **버전 정책**: Chart 버전은 git tag에서 자동 추출하며, 초기에는 CRD chart와 Operator chart의 버전을 동일하게 유지한다.
4. **설치 순서**: 사용자는 CRD chart를 먼저 설치한 후 Operator chart를 설치해야 한다.
5. **CI 전환 패턴**: `publish-chart.yml`에서 CRD chart publish 후 `file://` → `oci://` 의존성 전환을 수행한다.

## 대안 (Alternatives Considered)

### Option A: CRD/Operator 이중 Chart 유지 (현재 방식) — 채택

**장점:**
- CRD 독립 설치/업그레이드 가능
- Operator 업그레이드 시 CRD 충돌 방지
- Kubernetes CRD 관리 모범 사례에 부합
- ADR-0011 (CRD 리네이밍)에서 확립된 CRD 독립 관리 원칙과 일치

**단점:**
- 2개 chart 관리 복잡성
- 설치 순서를 사용자가 알아야 함

### Option B: 단일 Chart에 CRD 번들

**장점:**
- 설치 단순화 (`helm install` 1회)

**단점:**
- CRD lifecycle이 Operator에 종속
- Helm의 CRD 관리 한계 (`helm uninstall` 시 CRD 삭제 안 됨)
- CRD 독립 업그레이드 불가
- ADR-0011에서 확립된 CRD 독립 관리 원칙에 위배

### Option C: CRD는 kubectl apply, Operator만 Helm

**장점:**
- Helm CRD 관리 문제 회피
- CRD를 raw YAML/kustomize로 관리 가능

**단점:**
- 설치 절차 2단계 + 도구 혼용 (kubectl + helm)
- Helm의 버전 추적/rollback 장점 포기
- ADR-0008에서 확립된 자동화 CI 방향과 비일관적

## 결과 (Consequences)

### 긍정적
- CRD 독립 업그레이드로 zero-downtime 운영 가능
- OCI native distribution으로 `helm pull oci://` 지원, GHCR 에코시스템 활용
- git tag 기반 버전 추출로 버전 추적 단순화
- ADR-0003 (Podman over Docker)에서 설정한 OCI 표준 친화적 방향과 일치
- project-goals.md의 "Systematic Helm chart versioning management" 목표 달성

### 부정적
- 이중 chart 관리 overhead (2개 chart의 버전, 의존성, 호환성 관리)
- `file://` → `oci://` 전환 로직의 CI 복잡성
- 사용자가 2개 chart 설치 순서를 알아야 함 (문서화로 완화)
- CRD만 변경되는 경우의 독립 버전 정책은 향후 별도 결정 필요

## 관련 ADR

- [ADR-0002: Kubebuilder v4 + controller-runtime 선택](./2026-01-18-kubebuilder-v4.md) — ACKO의 Kubernetes Operator 기반 아키텍처
- [ADR-0003: Docker 대신 Podman 선택](./2026-02-01-podman-over-docker.md) — OCI 표준 친화적 에코시스템 방향
- [ADR-0008: IssueOps 기반 CI 워크플로우](./2026-03-10-issueops-ci-workflow.md) — 자동화 CI 워크플로우 체계
- [ADR-0011: CRD 이름 AerospikeCluster로 변경](./2026-03-10-crd-rename-aerospikecluster.md) — CRD 독립 관리 선례
