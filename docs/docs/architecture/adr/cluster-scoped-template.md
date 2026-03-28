---
title: "ADR-0007: Cluster-scoped AerospikeClusterTemplate"
description: ACKO에서 AerospikeClusterTemplate을 namespace-scoped에서 cluster-scoped로 변경한 아키텍처 결정 기록.
sidebar_position: 9
scope: single-repo
repos: [acko]
tags: [adr, kubernetes, crd, template, acko, cluster-scoped]
last_updated: 2026-03-29
---

# ADR-0007: Cluster-scoped AerospikeClusterTemplate

## 상태

**Accepted**

- 제안일: 2026-03-06
- 승인일: 2026-03-08

## 맥락 (Context)

ACKO는 AerospikeClusterTemplate CRD를 통해 클러스터 생성 시 사전 정의된 템플릿(minimal, soft-rack, hard-rack)을 제공합니다. 초기에는 namespace-scoped 리소스로 설계되었으나, 운영 환경에서 다음과 같은 문제가 발생했습니다:

- **템플릿 중복**: 여러 namespace에서 동일한 템플릿을 사용하려면 각 namespace마다 복제가 필요
- **관리 부담**: 템플릿 업데이트 시 모든 namespace의 복사본을 동기화해야 함
- **일관성 위험**: namespace 간 템플릿 버전 불일치로 인한 설정 오류 가능성
- **Cross-namespace 참조 불가**: namespace-scoped 리소스는 다른 namespace에서 참조할 수 없음

## 결정 (Decision)

> **AerospikeClusterTemplate을 cluster-scoped CRD로 변환한다.**

템플릿은 cluster-wide 리소스로 관리되어 모든 namespace의 AerospikeCluster가 동일한 템플릿을 참조할 수 있습니다.

### 구현 구조

```
AerospikeClusterTemplate (cluster-scoped)
    ↓ spec.templateRef
AerospikeCluster (namespace: dev)
AerospikeCluster (namespace: staging)
AerospikeCluster (namespace: prod)
```

## 대안 검토 (Alternatives Considered)

### 대안 1: Namespace-scoped 유지 + 자동 복제

- **설명**: 컨트롤러가 특정 namespace의 템플릿을 다른 namespace에 자동 복제
- **장점**: CRD 변경 없이 구현 가능
- **단점**: 복제 로직의 복잡성, 동기화 지연, 충돌 해결 필요
- **미선택 사유**: Kubernetes의 선언적 패턴에 위배, 불필요한 복잡성 추가

### 대안 2: ConfigMap 기반 템플릿

- **설명**: 템플릿을 ConfigMap에 JSON/YAML로 저장하고 Controller가 파싱
- **장점**: CRD 없이 구현 가능, 기존 K8s 도구로 관리
- **단점**: 타입 안전성 부재, 스키마 검증 불가, IDE 지원 없음
- **미선택 사유**: CRD의 타입 시스템과 Webhook 검증 이점을 포기해야 함

### 대안 3: Helm values 기반 템플릿

- **설명**: Helm chart의 values.yaml에 템플릿을 정의하고 배포 시 적용
- **장점**: Helm 생태계 활용, GitOps 친화적
- **단점**: 런타임에 템플릿 변경 불가, Helm 의존성 강제
- **미선택 사유**: 동적 템플릿 관리가 불가능하여 운영 유연성 저하

## 결과 (Consequences)

### 긍정적 결과

- **중앙 집중 관리**: 하나의 템플릿을 모든 namespace에서 공유, 업데이트 시 즉시 반영
- **일관성 보장**: 동일 템플릿 참조로 환경 간 설정 불일치 방지
- **운영 단순화**: 템플릿 생명주기를 한 곳에서 관리
- **Cluster Manager 연동 개선**: UI에서 전체 템플릿 목록을 한 번에 조회 가능

### 부정적 결과 / 트레이드오프

- **RBAC 복잡성 증가**: cluster-scoped 리소스에 대한 RBAC 정책 별도 설정 필요
- **CRD 마이그레이션**: 기존 namespace-scoped 템플릿에서 cluster-scoped로 마이그레이션 필요
- **권한 범위 확대**: 템플릿 관리자에게 cluster-wide 권한 부여 필요

### 리스크

- 기존 배포 환경에서 CRD 마이그레이션 시 다운타임 발생 가능 (낮은 확률 — Helm upgrade로 처리)
- 멀티테넌트 환경에서 템플릿 격리가 필요한 경우 추가 설계 필요 (중간 확률)

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `acko` | CRD 정의 변경, Controller에서 cluster-scoped 리소스 watch, RBAC 업데이트 |
| `cluster-manager` | 프론트엔드에서 전체 namespace 템플릿 대신 cluster-wide 템플릿 목록 조회 |
| `plugins` | acko-deploy Skill의 템플릿 관련 가이드 업데이트 |

## 참고 자료

- [PR #163: refactor: convert AerospikeClusterTemplate to cluster-scoped](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/163)
- [PR #159: feat: support cross-namespace template references](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/159)
- [Kubernetes API Conventions: Scope](https://kubernetes.io/docs/reference/using-api/api-concepts/)
