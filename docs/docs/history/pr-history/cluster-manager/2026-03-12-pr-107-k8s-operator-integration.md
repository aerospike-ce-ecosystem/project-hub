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

Kubernetes 오퍼레이터(ACKO)와의 통합을 대폭 강화했다. 멀티 볼륨 스토리지 설정 지원과 듀얼 모드 위저드(직접 연결 + ACKO 관리)를 추가하여, Kubernetes 환경에서의 클러스터 생성 및 관리 경험을 개선했다.

## 주요 변경 사항

- 멀티 볼륨 스토리지: 여러 PVC를 가진 스토리지 설정 UI
- 듀얼 모드 위저드: 직접 연결 모드와 ACKO 관리 모드 선택
- ACKO CRD 기반 클러스터 생성 폼
- 스토리지 타입별 설정 가이드 (로컬, EBS, NFS 등)

## 영향 범위

Kubernetes 환경에서 Cluster Manager를 사용하는 모든 사용자에게 영향. PR #079의 5단계 위저드가 ACKO 모드를 지원하게 되어, GUI를 통한 Kubernetes Aerospike 클러스터 배포가 가능해졌다.
