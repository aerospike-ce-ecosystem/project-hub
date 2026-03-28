---
title: Architecture Decision Records
description: Aerospike CE Ecosystem의 주요 아키텍처 결정 기록(ADR) 목록과 작성 가이드.
sidebar_position: 1
scope: ecosystem
repos: [aerospike-py, acko, cluster-manager, plugins]
tags: [adr, architecture, decision-record]
last_updated: 2026-03-29
---

# Architecture Decision Records (ADR)

## ADR이란?

Architecture Decision Record(ADR)는 프로젝트의 중요한 아키텍처 결정을 문서화한 기록입니다. 각 ADR은 **결정의 맥락, 선택한 방안, 대안, 그리고 결과**를 명확히 기술하여 팀원들이 "왜 이런 결정을 했는지"를 이해할 수 있게 합니다.

## ADR 목록

| 번호 | 제목 | 상태 | 영향받는 레포 |
|------|------|------|-------------|
| [ADR-0001](./pyo3-over-cffi.md) | CFFI 대신 Rust/PyO3 선택 | **Accepted** | aerospike-py |
| [ADR-0002](./kubebuilder-v4.md) | Kubebuilder v4 + controller-runtime 선택 | **Accepted** | acko |
| [ADR-0003](./podman-over-docker.md) | Docker 대신 Podman 선택 | **Accepted** | cluster-manager, acko |
| [ADR-0004](./namedtuple-over-dict.md) | Dict 대신 NamedTuple 반환 선택 | **Accepted** | aerospike-py |
| [ADR-0005](./daisyui-removal.md) | DaisyUI 제거 및 Pure Tailwind CSS 4 전환 | **Accepted** | cluster-manager |
| [ADR-0006](./backpressure-semaphore.md) | Semaphore 기반 Backpressure 메커니즘 | **Accepted** | aerospike-py |
| [ADR-0007](./cluster-scoped-template.md) | Cluster-scoped AerospikeClusterTemplate | **Accepted** | acko |
| [ADR-0008](./issueops-ci-workflow.md) | IssueOps 기반 CI 워크플로우 | **Accepted** | aerospike-py, acko, cluster-manager |
| [ADR-0009](./unified-batch-records-api.md) | Unified BatchRecords API | **Accepted** | aerospike-py |
| [ADR-0010](./observability-stack.md) | 3-Layer Observability Stack | **Accepted** | aerospike-py |
| [ADR-0011](./crd-rename-aerospikecluster.md) | CRD Rename: AerospikeCluster | **Accepted** | acko |
| [ADR-0012](./pod-readiness-gates.md) | Pod Readiness Gates | **Accepted** | acko |
| [ADR-0013](./reconciliation-circuit-breaker.md) | Reconciliation Circuit Breaker | **Accepted** | acko |
| [ADR-0014](./postgresql-migration.md) | SQLite → PostgreSQL Migration | **Accepted** | cluster-manager |
| [ADR-0015](./asinfo-health-checks.md) | asinfo 기반 Health Check | **Accepted** | acko |

## 상태 정의

| 상태 | 설명 |
|------|------|
| **Proposed** | 제안됨 -- 검토 대기 중 |
| **Accepted** | 승인됨 -- 구현 완료 또는 진행 중 |
| **Deprecated** | 폐기됨 -- 더 나은 결정으로 대체됨 |
| **Superseded** | 대체됨 -- 새 ADR로 교체됨 (링크 포함) |

## 새 ADR 제안 방법

### 1. GitHub Issue 생성

[project-hub 레포지토리](https://github.com/aerospike-ce-ecosystem/project-hub/issues/new/choose)에서 `ADR Proposal` 이슈 템플릿(`adr_proposal.yml`)을 사용하여 제안합니다.

### 2. 이슈 템플릿에 포함할 내용

- **제목**: 간결한 결정 요약
- **맥락(Context)**: 결정이 필요한 배경 설명
- **제안(Proposal)**: 선택하려는 방안
- **대안(Alternatives)**: 고려한 다른 방안들
- **영향(Impact)**: 영향받는 레포지토리 목록

### 3. 검토 및 승인 프로세스

1. 이슈에 `adr` 라벨 자동 부여
2. 관련 레포 maintainer 리뷰
3. 합의 후 ADR 문서 작성 및 PR 제출
4. PR 머지 시 상태를 `Accepted`로 변경

### 4. ADR 번호 부여

- 4자리 0-패딩 순번 사용 (예: `0001`, `0002`)
- 번호는 절대 재사용하지 않음
- 폐기된 ADR도 번호를 유지하고 상태만 변경

## ADR 작성 가이드

ADR 작성 시 [템플릿](./template.md)을 참고하세요. 핵심 원칙:

- **간결하게**: 1-2페이지를 넘기지 않을 것
- **맥락 중심**: "왜" 이 결정을 했는지에 집중
- **대안 기록**: 선택하지 않은 방안도 반드시 기록
- **영향 명시**: 어떤 레포가 영향받는지 명확히 기술
