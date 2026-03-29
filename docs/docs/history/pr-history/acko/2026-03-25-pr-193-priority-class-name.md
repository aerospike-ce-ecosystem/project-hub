---
title: "PR #193: priorityClassName CRD Field"
description: Added priorityClassName to AerospikeCluster CRD and fixed topologySpreadConstraints
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feat, crd, scheduling, kubernetes]
last_updated: 2026-03-29
---

# PR #193: priorityClassName CRD Field

| 항목 | 내용 |
|------|------|
| **PR** | [#193](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/193) |
| **날짜** | 2026-03-25 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

AerospikeCluster CRD에 `priorityClassName` 필드를 추가하여 Pod 스케줄링 우선순위를 설정할 수 있게 했다. 동시에 `topologySpreadConstraints` 필드의 동작 문제도 수정하여 Kubernetes 스케줄링 관련 기능을 강화했다.

## 주요 변경 사항

- AerospikeCluster CRD에 `spec.podSpec.priorityClassName` 필드 추가
- PriorityClass를 통한 Pod 스케줄링 우선순위 제어
- topologySpreadConstraints 필드 동작 수정
- CRD validation 및 webhook 업데이트

## 영향 범위

Kubernetes 클러스터에서 리소스 경합 시 Aerospike Pod의 스케줄링 우선순위를 보장해야 하는 환경에 영향. 프로덕션 환경에서 Aerospike Pod가 다른 워크로드보다 높은 우선순위로 스케줄링되도록 설정할 수 있다.
