---
title: "ADR-0002: Kubebuilder v4 + controller-runtime 선택"
description: ACKO에서 Kubernetes Operator 프레임워크로 Kubebuilder v4와 controller-runtime을 선택한 아키텍처 결정 기록.
sidebar_position: 2
scope: single-repo
repos: [acko]
tags: [adr, kubebuilder, controller-runtime, kubernetes, operator, acko]
last_updated: 2026-03-29
---

# ADR-0002: Kubebuilder v4 + controller-runtime 선택

## 상태

**Accepted**

- 제안일: 2026-01-18
- 승인일: 2026-01-25

## 맥락 (Context)

ACKO(Aerospike CE Kubernetes Operator)는 Kubernetes 위에서 Aerospike CE 클러스터를 선언적으로 관리하는 Operator입니다. Operator를 구축하기 위한 프레임워크를 선택해야 했습니다.

고려 사항:

- **CRD 정의 및 코드 생성**: AerospikeCluster CRD를 효율적으로 정의하고 Go 타입을 자동 생성
- **Reconcile 루프**: 안정적인 Controller 패턴 구현
- **Admission Webhook**: CE 제약 사항(최대 8노드, 2 Namespace 등) 검증
- **테스트**: envtest 등을 활용한 통합 테스트 지원
- **커뮤니티**: 장기적 유지보수를 위한 활발한 커뮤니티

## 결정 (Decision)

> **ACKO는 Kubebuilder v4와 controller-runtime을 기반으로 구축한다.**

Kubebuilder v4의 프로젝트 스캐폴딩과 코드 생성을 활용하고, controller-runtime의 Reconciler 패턴으로 Controller를 구현합니다.

### 구현 구조

```
kubebuilder init + create api
    ↓
api/v1alpha1/aerospikecluster_types.go  (CRD 정의)
    ↓ controller-gen
config/crd/                              (CRD YAML 자동 생성)
    ↓
internal/controller/                     (Reconcile 로직)
    ↓ controller-runtime
Kubernetes API Server                    (Watch + Reconcile)
```

## 대안 검토 (Alternatives Considered)

### 대안 1: Operator SDK

- **설명**: Red Hat이 관리하는 Operator 프레임워크로, 내부적으로 Kubebuilder를 사용
- **장점**: OLM(Operator Lifecycle Manager) 통합, Scorecard 테스트, Ansible/Helm Operator 지원
- **단점**: OLM 의존성 추가, Kubebuilder 위에 추상화 레이어 추가로 복잡성 증가
- **미선택 사유**: OLM은 CE 프로젝트에 과도한 복잡성. Kubebuilder 직접 사용이 더 가볍고 유연

### 대안 2: client-go 직접 사용

- **설명**: Kubernetes client-go 라이브러리로 처음부터 직접 구현
- **장점**: 최대한의 유연성, 프레임워크 의존성 없음
- **단점**: 보일러플레이트 코드 대량 필요, CRD 코드 생성 직접 구현, 검증된 패턴 부재
- **미선택 사유**: 개발 속도와 유지보수 부담을 고려하면 프레임워크 사용이 합리적

### 대안 3: Kopf (Python Operator Framework)

- **설명**: Python 기반 Kubernetes Operator 프레임워크
- **장점**: Python 사용 가능, 빠른 프로토타이핑
- **단점**: Go 대비 성능 저하, Kubernetes 생태계(CRD codegen, envtest 등)와의 통합 부족
- **미선택 사유**: Kubernetes Operator는 Go가 사실상 표준이며, 생태계 도구 지원이 압도적

## 결과 (Consequences)

### 긍정적 결과

- **사실상 표준**: Kubebuilder는 Kubernetes SIG에서 관리하는 공식 프로젝트로, 커뮤니티가 크고 문서가 풍부
- **CRD 코드 생성**: Go struct에 마커 주석을 달면 CRD YAML, DeepCopy 메서드, 클라이언트 코드가 자동 생성
- **Webhook 내장**: Admission Webhook을 간단한 인터페이스로 구현 가능 (CE 제약 검증에 필수)
- **envtest 지원**: 실제 K8s API Server 없이 Controller 로직을 테스트 가능
- **성숙한 Reconcile 패턴**: controller-runtime의 Reconciler 인터페이스로 안정적인 상태 관리

### 부정적 결과 / 트레이드오프

- **Go 언어 제약**: Ecosystem의 다른 컴포넌트(Rust, Python, TypeScript)와 다른 언어 스택
- **Kubebuilder 버전 의존**: v4의 프로젝트 구조에 종속 (향후 v5 마이그레이션 가능성)
- **학습 곡선**: controller-runtime의 캐시, 인덱서, 이벤트 핸들링 등 개념 이해 필요

### 리스크

- Kubebuilder v5 출시 시 마이그레이션 작업 필요 (중간 확률)
- controller-runtime의 breaking change가 Reconcile 로직에 영향 (낮은 확률)

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `acko` | 전체 Operator를 Kubebuilder v4 + controller-runtime으로 구현 |
| `plugins` | acko-deploy, acko-operations Skill이 Kubebuilder 기반 CRD 구조를 반영 |

## 참고 자료

- [Kubebuilder 공식 문서](https://book.kubebuilder.io/)
- [controller-runtime](https://github.com/kubernetes-sigs/controller-runtime)
- [Kubernetes Operator Pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
