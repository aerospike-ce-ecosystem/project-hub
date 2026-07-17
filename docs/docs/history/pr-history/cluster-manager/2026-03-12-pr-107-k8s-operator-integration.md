---
title: "PR #107: K8s Operator Integration"
description: Enhanced Kubernetes operator integration with multi-volume storage and dual-mode wizard
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, kubernetes, operator, storage, wizard]
last_updated: 2026-03-29
---

# PR #107: K8s Operator Integration

| 항목 | 내용 |
|------|------|
| **PR** | [#107](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/107) |
| **날짜** | 2026-03-12 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

ACKO integration에 multi-volume storage configuration과 두 가지 wizard mode를 추가했다. 사용자는 기존 cluster에 직접 연결하거나 ACKO가 관리하는 Kubernetes cluster를 만들 수 있다.

## 주요 변경 사항

- 멀티 볼륨 스토리지: 여러 PVC를 가진 스토리지 설정 UI
- 듀얼 모드 위저드: 직접 연결 모드와 ACKO 관리 모드 선택
- ACKO CRD 기반 클러스터 생성 폼
- 스토리지 타입별 설정 가이드 (로컬, EBS, NFS 등)

## 영향 범위

Kubernetes에서 Cluster Manager를 사용하는 모든 사용자가 영향을 받는다. PR #079의 5단계 wizard에 ACKO mode가 추가돼 GUI에서 Aerospike cluster를 배포할 수 있다.
