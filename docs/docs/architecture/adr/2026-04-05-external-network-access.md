---
title: "ADR-0038: ACKO 외부 네트워크 접근 — Per-pod LoadBalancer/NodePort 서비스"
description: Kubernetes 외부 클라이언트가 ACKO로 배포된 Aerospike 클러스터에 접근할 수 있도록 per-pod LoadBalancer/NodePort 서비스, Seeds Finder LB, init container 기반 자동 LB IP 주입을 도입하는 아키텍처 결정.
sidebar_position: 38
scope: single-repo
repos: [acko]
tags: [adr, acko, kubernetes, networking, loadbalancer, external-access, service]
last_updated: 2026-04-05
---

# ADR-0038: ACKO 외부 네트워크 접근 — Per-pod LoadBalancer/NodePort 서비스

## 상태

**Accepted**

- 제안일: 2026-04-03
- 승인일: 2026-04-05

## 맥락 (Context)

ACKO로 배포한 Aerospike cluster는 기본적으로 Pod IP만 사용하므로 Kubernetes cluster 안에서만 접근할 수 있었습니다. 다른 VPC나 on-premise 애플리케이션에서 접속하려면 운영자가 Service를 직접 만들고 `aerospike.conf`를 수정해야 했습니다.

### 핵심 제약: Aerospike Smart Client 프로토콜

Aerospike client는 seed node 하나에 접속한 뒤 server에서 **전체 cluster topology**, 즉 모든 node의 `access-address`와 `alternate-access-address`를 받습니다. 이후 각 node에 **직접 연결**하므로 다음 조건을 충족해야 합니다.

- LoadBalancer 하나만 cluster 앞에 두는 방식으로는 충분하지 않습니다.
- **모든 node**가 외부에서 접근할 수 있는 주소를 각각 advertise해야 합니다.
- Node마다 다른 외부 IP와 port를 `aerospike.conf`에 넣어야 합니다.

### 기존 상태의 한계

| 구성 요소 | 상태 | 문제 |
|-----------|------|------|
| `AerospikeNetworkPolicy` (accessType 등) | 구현됨 | IP만 처리, 포트 미지원 |
| `SeedsFinderServices` (LB CRD) | CRD만 정의됨 | **reconciler 미구현** |
| Per-pod Service | ClusterIP 전용 | 외부 접근 불가 |
| Init container | IP 치환만 | LB IP/NodePort 주입 불가 |

## 결정 (Decision)

> **Per-pod LoadBalancer/NodePort 서비스를 생성하고, init container가 기동 시 Kubernetes API를 조회하여 자신의 외부 주소를 `aerospike.conf`에 자동 주입한다.**

### 구현 구성 요소

#### 1. Per-pod Service 타입 확장

`AerospikeServiceSpec`에 `serviceType` field를 추가해 ClusterIP, NodePort, LoadBalancer를 선택할 수 있게 합니다. LoadBalancer나 NodePort를 사용하면 service, fabric, heartbeat port를 모두 노출합니다.

```yaml
spec:
  podService:
    serviceType: LoadBalancer
```

#### 2. Seeds Finder LoadBalancer

`spec.seedsFinderServices.loadBalancer` 설정 시 단일 LoadBalancer 서비스 생성.
외부 클라이언트의 초기 seed 접속점 역할.

#### 3. Init Container 자동 LB IP 주입

Config generation 시 `MY_EXTERNAL_ADDRESS` / `MY_EXTERNAL_PORT` 플레이스홀더 주입.
Init container가 기동 시:
1. Kubernetes API로 자기 pod의 Service 조회
2. LoadBalancer `.status.loadBalancer.ingress[].ip` 또는 NodePort 추출
3. `sed`로 플레이스홀더를 실제 값으로 치환

#### 4. 자동 RBAC 프로비저닝

Operator가 `Role/RoleBinding`을 자동 생성하여 pod의 service account가 Service를 조회할 수 있도록 함.
`automountServiceAccountToken: true`도 자동 설정.

#### 5. Status에 Endpoint 노출

`status.seedsEndpoint`와 `status.endpoints` 필드로 외부 엔드포인트를 CR 상태에 기록.
`kubectl get asc`에서 Seed 컬럼, `-o wide`에서 Endpoints 컬럼으로 표시.

## 대안 검토 (Alternatives Considered)

### 대안 1: hostNetwork 모드

- **설명**: `podSpec.hostNetwork: true`로 Pod가 노드 IP:3000에 직접 바인딩
- **장점**: 네트워크 오버헤드 0, 구현 단순
- **단점**: 노드당 1 pod 제한, 포트 충돌 위험, 스케줄링 제약
- **미선택 사유**: 운영 유연성이 크게 떨어짐

### 대안 2: Per-pod ConfigMap

- **설명**: Rack 단위 공유 ConfigMap 대신 pod마다 개별 ConfigMap 생성, 외부 IP를 빌드 시점에 bake-in
- **장점**: init container에서 K8s API 조회 불필요
- **단점**: Rack-per-StatefulSet 아키텍처와 충돌, ConfigMap 수 폭증, chicken-and-egg 문제 (Service → IP → ConfigMap → Pod → Service)
- **미선택 사유**: 현재 아키텍처 변경 범위가 너무 큼

### 대안 3: Operator가 직접 LB IP를 ConfigMap에 주입

- **설명**: Operator가 Service 생성 → LB IP 확인 → ConfigMap 업데이트 → Pod 재시작
- **장점**: Init container가 K8s API 접근 불필요
- **단점**: 2-phase reconcile 필요, 초기 배포 시 추가 rolling restart 발생
- **미선택 사유**: Init container 방식이 더 단순하고 기존 IP 치환 패턴과 일관됨

## 결과 (Consequences)

### 긍정적 결과

- K8s 외부 클라이언트가 Aerospike에 접근 가능
- `kubectl get asc`로 접속 엔드포인트 즉시 확인 가능
- Seeds LB 하나만 알면 smart client가 전체 토폴로지 자동 발견
- Operator가 RBAC, SA token, LB Service를 모두 자동 관리

### 부정적 결과 / 트레이드오프

- Pod 시작 시 LB IP 할당 대기로 init container 실행 시간 증가 (최대 120초)
- Pod의 service account에 Service 조회 권한이 부여됨 (최소 권한)
- LoadBalancer 비용 증가 (pod 수 × LB 비용)
- Init container에서 grep 기반 JSON 파싱 사용 (jq 미설치 환경 제약)

### 리스크

- n3r-lb 등 특정 LB 구현에서 `externalTrafficPolicy: Local` 미지원 시 `Cluster` 사용 필요
- LB IP 할당 120초 초과 시 pod CrashLoopBackOff
- Service account token 미마운트 시 init container 실패 (operator가 자동 설정하므로 정상 경로에서는 발생하지 않음)

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `acko` | CRD ServiceType 필드, per-pod LB/NodePort reconciler, seeds finder reconciler, init container LB IP 주입, RBAC 자동 생성, status endpoints |
| `plugins` | `acko-deploy` skill에 외부 접근 CR 예제 추가 필요 (후속 작업) |
| `cluster-manager` | Seeds Finder topology UI에서 외부 엔드포인트 표시 필요 (후속 작업) |

## 참고 자료

- [GitHub Issue #218](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/issues/218) — alternate-access-port 누락 문제
- [Aerospike Smart Client Protocol](https://aerospike.com/docs/connect/client/) — 클라이언트 토폴로지 디스커버리
- [ACKO v0.4.0 Release](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/releases/tag/v0.4.0) — 구현 릴리스
- [ACKO v0.4.1 Release](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/releases/tag/v0.4.1) — kubectl endpoint 표시 추가
