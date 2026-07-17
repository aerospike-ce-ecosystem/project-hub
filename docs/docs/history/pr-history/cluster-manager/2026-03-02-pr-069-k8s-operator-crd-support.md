---
title: "PR #069: Enhance K8s Cluster Management with Full Operator CRD Support"
description: AerospikeCluster CRD 완전 지원과 10단계 상태 추적 기능 추가
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

Cluster Manager에 `AerospikeCluster` CRD(Custom Resource Definition) 관리 기능을 추가했다. UI에서 CR을 생성·수정·삭제하고 deployment 상태를 10개 phase로 나눠 확인할 수 있다.

## 주요 변경 사항

- AerospikeCluster CRD CRUD 기능 구현
- 10단계 클러스터 상태(Phase) 추적 시스템
- CRD 스펙 편집기 UI
- 오퍼레이터 이벤트 실시간 표시
- 클러스터 생성 마법사의 CRD 기반 재구현

## 영향 범위

이 변경은 Cluster Manager가 ACKO CR을 직접 관리하는 기반을 마련한다. 사용자는 UI에서 원하는 cluster spec을 선언하고 Operator가 실제 상태를 조정하는 과정을 확인할 수 있다.
