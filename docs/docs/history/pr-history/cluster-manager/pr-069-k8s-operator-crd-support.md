---
title: "PR #069: Enhance K8s Cluster Management with Full Operator CRD Support"
description: AerospikeCluster CRD 완전 지원과 10단계 상태 추적 기능 추가
sidebar_position: 6
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, kubernetes, crd, operator, status]
last_updated: 2026-03-29
---

# PR #069: Enhance K8s Cluster Management with Full Operator CRD Support

| 항목 | 내용 |
|------|------|
| **PR** | [#069](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/69) |
| **날짜** | 2026-03-02 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Kubernetes 클러스터 관리 기능을 확장하여 AerospikeCluster CRD(Custom Resource Definition)를 완전히 지원하도록 했다. 클러스터의 배포 상태를 10단계로 세분화하여 추적하고, CRD 스펙의 생성/수정/삭제를 UI에서 직접 수행할 수 있게 되었다.

## 주요 변경 사항

- AerospikeCluster CRD CRUD 기능 구현
- 10단계 클러스터 상태(Phase) 추적 시스템
- CRD 스펙 편집기 UI
- 오퍼레이터 이벤트 실시간 표시
- 클러스터 생성 마법사의 CRD 기반 재구현

## 영향 범위

Kubernetes 관리 기능의 핵심 확장으로, Cluster Manager가 ACKO 오퍼레이터와 완전히 통합되는 기반을 마련했다. CRD 기반 워크플로우를 통해 선언적 클러스터 관리가 가능해졌다.
