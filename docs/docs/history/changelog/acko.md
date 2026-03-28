---
title: ACKO Changelog
description: Aerospike CE Kubernetes Operator (ACKO) 릴리스 변경 이력
sidebar_position: 2
scope: single-repo
repos:
  - acko
tags:
  - changelog
  - acko
  - kubernetes
  - operator
  - helm
last_updated: 2026-03-29
---

# ACKO Changelog

## Unreleased (after v0.1.7)

### Features
- **Metric labels fix**: Fixed Prometheus metric label inconsistencies (PR #202)
- **Priority class name**: Added PriorityClassName support for Aerospike pods (PR #193)
- **Helm RBAC fix**: Fixed RBAC permissions in Helm chart (PR #194)

### Testing
- **E2E monitoring sample**: Added monitoring configuration for E2E tests (PR #195)
- **E2E deploy sync**: Fixed deployment synchronization in E2E tests (PR #197)
- **E2E test improvements**: Added timeout and retry for flaky E2E tests

### Bug Fixes
- **Operator stability**: Multiple stability improvements for reconciliation loops (PR #183)
- **Migration status**: Improved migration status tracking (PR #180)

---

Aerospike CE Kubernetes Operator (ACKO) 릴리스별 변경 사항을 기록합니다.

---

## v0.1.7 (2026-03-19)

### Features
- **Migration status tracking**: AerospikeCluster status에 migration 상태 추적 추가 (PR #180)
- **Helm UI config**: DB pool, timeouts, logging, metrics 포함 Helm chart UI 설정 개선 (PR #176)
- **UI Service template**: 누락된 UI Service template 추가 및 image tag 고정 (PR #181)

### Bug Fixes
- **Operator stability**: Rolling restart, scale-down, ACL sync 안정성 강화 (PR #183)

---

## v0.1.6 (2026-03-10)

### Documentation
- Monitoring guide 및 UI docs 업데이트 (PR #173)
- Template management, operations guide, local storage docs 추가 (PR #174)

---

## v0.1.5 (2026-03-10)

### Features
- **Unified Docker image**: Cluster Manager를 단일 Docker 이미지로 통합 (PR #158)
- **Cross-namespace template**: 네임스페이스 간 템플릿 참조 지원 (PR #159)
- **Cluster-scoped template**: AerospikeClusterTemplate을 cluster-scoped로 전환 (PR #163)
- **Rack-specific node selection**: Template 모드에서 rack별 k8s 노드 선택 기능 (PR #168)
- **Helm RBAC**: Template RBAC, HPA RBAC 권한 추가 (PR #171, #172)

### Improvements
- **Operator resilience**: Observability 및 테스트 커버리지 강화 (PR #160)
- **Data safety**: Secret watch, dynamic config rollback 수정 (PR #164)
- **Frontend UI**: Disconnected state, event timestamps, K8s cluster overview (PR #161)

### Bug Fixes
- **Exporter image tag**: aerospike-prometheus-exporter 이미지 태그 수정 (PR #167)
- **bin_double 500 error**: 필터 오류 수정 및 위저드 개선 (PR #170)

---

## v0.1.4 (2026-03-07)

### Bug Fixes
- **Status stabilization**: No-op/drift reconciles 스킵하여 status 안정화 (PR #154)
- **PDB selector drift**: PDB selector와 label drift 수정 (PR #155)
- **Cross-namespace template**: 크로스 네임스페이스 template resolution 지원 (PR #157)

### Improvements
- **Wizard compression**: 위저드 5단계로 압축, template 모드 3단계로 단순화 (PR #156)

---

## v0.1.2 (2026-03-02)

### Features
- **Cluster Manager UI docs**: UI 문서 및 template RBAC 추가 (PR #142)
- **Nodes RBAC**: UI image tag 기본값 및 rack config docs (PR #143)
- **Template CRUD RBAC**: Template CRUD 권한 추가 (PR #144)

### Bug Fixes
- **UI ClusterRole**: apiGroup 도메인 오류 수정 (PR #141)

---

## v0.1.0

> Initial release

### 주요 변경 사항

- **AerospikeCluster CRD**: Aerospike CE 클러스터를 선언적으로 정의하는 Custom Resource Definition
- **Declarative Deployment**: CRD 기반 선언적 클러스터 배포 및 관리
- **Rack-aware Scaling**: 랙 인식 기반 클러스터 스케일링 지원
- **Rolling Updates**: 무중단 롤링 업데이트
- **Persistent Volumes**: PVC 기반 데이터 영속성 관리
- **ACL 통합**: Access Control List 연동 지원
- **Mesh Heartbeat 자동 설정**: 클러스터 노드 간 mesh heartbeat 자동 구성
- **Helm Chart**: `charts/aerospike-ce-kubernetes-operator/` Helm chart 제공
- **CE 제약 Webhooks**: Community Edition 제약 조건 검증
  - 최대 8개 노드
  - 최대 2개 네임스페이스
  - XDR/TLS 등 Enterprise 전용 기능 차단
