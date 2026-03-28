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

Aerospike CE Kubernetes Operator (ACKO) 릴리스별 변경 사항을 기록합니다.

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
