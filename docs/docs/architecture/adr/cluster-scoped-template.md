---
title: "ADR-0007: Cluster-scoped AerospikeClusterTemplate"
description: ACKO에서 AerospikeClusterTemplate을 namespace-scoped에서 cluster-scoped로 변경한 아키텍처 결정 기록.
sidebar_position: 9
scope: single-repo
repos: [acko]
tags: [adr, kubernetes, crd, template, acko]
last_updated: 2026-03-29
---

# ADR-0007: Cluster-scoped AerospikeClusterTemplate

## 상태

**Accepted**

- 제안일: 2026-03-12
- 승인일: 2026-03-18

## 맥락 (Context)

Aerospike CE Kubernetes Operator(ACKO)는 `AerospikeCluster` Custom Resource(CR)를 통해 Aerospike 클러스터를 선언적으로 관리합니다. 운영 규모가 확대되면서 여러 namespace에 걸쳐 동일한 구성의 Aerospike 클러스터를 배포하는 요구가 증가했습니다.

### 기존 구조의 문제

ACKO에는 `AerospikeClusterTemplate` CRD가 존재하여 클러스터 구성의 재사용 가능한 템플릿을 정의할 수 있었습니다. 이 CRD는 namespace-scoped로 설계되어 있었으며, 다음과 같은 문제가 발생했습니다:

- **템플릿 복제 필요**: `production`, `staging`, `dev` 등 여러 namespace에서 동일한 템플릿을 사용하려면 각 namespace에 동일한 `AerospikeClusterTemplate`을 복제해야 함
- **동기화 어려움**: 템플릿을 수정할 때 모든 namespace의 복사본을 개별적으로 업데이트해야 하며, 누락 시 namespace 간 구성 불일치(drift) 발생
- **GitOps 복잡성**: ArgoCD, Flux 등 GitOps 도구에서 동일 템플릿을 여러 namespace에 배포하려면 Kustomize overlay 또는 Helm values 파일의 중복 관리 필요
- **관리 오버헤드**: 대규모 환경 (10+ namespace)에서 템플릿 변경의 롤아웃이 수동적이고 에러 발생 가능성 높음

### 운영 시나리오

```yaml
# 기존 문제: 3개 namespace에 동일 템플릿 복제 필요
# namespace: production
apiVersion: acko.aerospike.com/v1
kind: AerospikeClusterTemplate
metadata:
  name: standard-3node
  namespace: production    # namespace-scoped
spec: { ... }  # 동일한 spec

# namespace: staging (동일한 내용 복제)
# namespace: dev (동일한 내용 복제)
```

### 요구사항

1. 단일 템플릿을 여러 namespace의 `AerospikeCluster` CR에서 참조 가능
2. 템플릿 수정 시 모든 참조 클러스터에 자동 반영
3. RBAC으로 템플릿 수정 권한을 세밀하게 제어 가능
4. 기존 namespace-scoped 템플릿에서의 마이그레이션 경로 제공

## 결정 (Decision)

> **`AerospikeClusterTemplate`을 cluster-scoped CRD로 변환하여 모든 namespace에서 단일 템플릿을 참조할 수 있도록 한다.**

### CRD 변경 사항

```yaml
# 변경 전: namespace-scoped
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: aerospikeclustertemplates.acko.aerospike.com
spec:
  scope: Namespaced  # 기존

# 변경 후: cluster-scoped
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: aerospikeclustertemplates.acko.aerospike.com
spec:
  scope: Cluster     # 변경
```

### 사용 패턴

```yaml
# 1. Cluster-scoped 템플릿 정의 (한 번만)
apiVersion: acko.aerospike.com/v1
kind: AerospikeClusterTemplate
metadata:
  name: standard-3node    # namespace 없음 (cluster-scoped)
spec:
  size: 3
  image: aerospike/aerospike-server-community:8.1.0.0
  aerospikeConfig:
    service:
      proto-fd-max: 15000
    network:
      service:
        port: 3000
    namespaces:
      - name: data
        replication-factor: 2
        storage-engine:
          type: memory
          data-size: 4G

---
# 2. 여러 namespace에서 참조
apiVersion: acko.aerospike.com/v1
kind: AerospikeCluster
metadata:
  name: my-cluster
  namespace: production
spec:
  templateRef:
    name: standard-3node    # cluster-scoped 템플릿 참조
  overrides:                # 필요 시 namespace별 오버라이드
    size: 5
```

### 템플릿 참조 해석 순서

1. `AerospikeCluster` CR의 `spec.templateRef.name`으로 cluster-scoped 템플릿 조회
2. 템플릿의 `spec`을 기본값으로 사용
3. `spec.overrides`에 명시된 필드로 선택적 오버라이드 적용
4. 최종 병합된 spec으로 Aerospike 클러스터 구성

### Operator Reconciliation 변경

기존에는 동일 namespace의 리소스만 watch했으나, cluster-scoped 템플릿 변경 시 해당 템플릿을 참조하는 모든 namespace의 `AerospikeCluster`에 대해 reconciliation을 트리거하도록 변경합니다.

```go
// 템플릿 변경 감지 -> 참조하는 모든 AerospikeCluster reconcile
ctrl.NewControllerManagedBy(mgr).
    For(&v1.AerospikeCluster{}).
    Watches(
        &v1.AerospikeClusterTemplate{},
        handler.EnqueueRequestsFromMapFunc(r.findClustersForTemplate),
    ).
    Complete(r)
```

## 대안 검토 (Alternatives Considered)

### 대안 1: Namespace-scoped 유지 + 자동 복사 Controller

- **설명**: 별도의 controller가 "마스터" namespace의 템플릿을 다른 namespace에 자동 복제
- **장점**: CRD scope 변경 불필요 (하위 호환성 유지), 기존 RBAC 정책 유지
- **단점**: 추가 controller 운영 복잡성, 복사 지연으로 인한 일시적 불일치, 순환 복사 방지 로직 필요, 마스터 namespace 결정 문제
- **미선택 사유**: 근본적으로 복사 기반 접근은 동기화 문제를 해결하지 못하며 운영 복잡성만 증가

### 대안 2: ConfigMap 기반 템플릿

- **설명**: Kubernetes 네이티브 ConfigMap에 Aerospike 클러스터 구성을 JSON/YAML로 저장하고 참조
- **장점**: 추가 CRD 불필요, Kubernetes 표준 리소스 활용, 기존 도구와의 호환성
- **단점**: ConfigMap은 타입 검증(schema validation) 불가, CRD의 OpenAPI 스키마 기반 검증 이점 상실, ConfigMap 크기 제한 (1MB)
- **미선택 사유**: CRD의 스키마 검증, 버전 관리, kubectl 통합 등의 이점을 포기하기에는 트레이드오프가 과다

### 대안 3: Helm Values 기반 공유

- **설명**: Helm chart의 values 파일을 공통 라이브러리로 관리하고 namespace별 릴리스에서 참조
- **장점**: Helm 생태계 활용, 기존 CI/CD 파이프라인 통합 용이
- **단점**: Helm에 강결합 (Helm을 사용하지 않는 환경에서 불가), 런타임 템플릿 변경 불가 (Helm 릴리스 필요), Operator의 선언적 관리 패러다임과 불일치
- **미선택 사유**: ACKO는 Operator 패턴을 따르므로 배포 도구에 의존하는 방식은 아키텍처적으로 부적합

## 결과 (Consequences)

### 긍정적 결과

- **중앙 집중 템플릿 관리**: 단일 `AerospikeClusterTemplate` 리소스로 모든 namespace의 클러스터 구성을 통일
- **구성 일관성**: 템플릿 수정이 참조하는 모든 클러스터에 자동 반영되어 drift 방지
- **GitOps 단순화**: Git 레포에서 템플릿 한 번만 정의하면 ArgoCD/Flux가 클러스터 전체에 적용
- **오버라이드 유연성**: `spec.overrides`를 통해 namespace별 커스터마이제이션을 허용하면서도 기본 구성은 통일
- **운영 효율성**: 대규모 환경에서 템플릿 변경의 롤아웃이 단일 kubectl 명령으로 완료

### 부정적 결과 / 트레이드오프

- **RBAC 설정 복잡도 증가**: cluster-scoped 리소스에 대한 RBAC은 namespace-scoped보다 설계가 복잡. 템플릿 수정 권한을 플랫폼 팀에만 제한하고, 개발 팀에는 읽기 전용 권한을 부여하는 등의 세밀한 정책 필요
- **CRD 마이그레이션 필요**: 기존 namespace-scoped 템플릿에서 cluster-scoped로의 마이그레이션 작업 필요 (마이그레이션 스크립트 제공)
- **Operator 권한 확대**: Operator의 ServiceAccount가 cluster-wide watch 권한을 가져야 하므로 보안 관점에서 최소 권한 원칙과의 균형 필요

### 리스크

- 기존 namespace-scoped 템플릿을 사용하는 환경에서 마이그레이션 중 일시적 서비스 중단 가능 (마이그레이션 가이드에서 rolling 전환 절차 제공)
- cluster-scoped 리소스는 이름 충돌 가능성이 높으므로 네이밍 컨벤션 (예: `{team}-{purpose}-{version}`) 정의 필요
- Operator의 cluster-wide watch가 대규모 환경에서 API server 부하를 증가시킬 수 있음 (label selector 기반 필터링으로 완화)

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `acko` | `AerospikeClusterTemplate` CRD scope 변경, Operator reconciliation 로직 수정, RBAC 템플릿 업데이트, 마이그레이션 스크립트 제공 |
| `cluster-manager` | 템플릿 관리 UI에서 namespace 선택 제거, cluster-scoped 리소스 목록/편집 화면 반영 |
| `plugins` | acko-deploy Skill에서 cluster-scoped 템플릿 YAML 예시 업데이트, acko-operations Skill에서 템플릿 관리 절차 반영 |

## 참고 자료

- [PR #163 - AerospikeClusterTemplate cluster-scoped 전환](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/163)
- [Kubernetes CRD Scope 문서](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#create-a-customresourcedefinition)
- [Operator Pattern - Kubernetes 공식 문서](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [RBAC Best Practices - Kubernetes](https://kubernetes.io/docs/concepts/security/rbac-good-practices/)
