---
title: "PR #155: PDB Selector Drift Fix"
description: Fixed PodDisruptionBudget selector and label drift during reconciliation
sidebar_position: 2
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [fix, pdb, labels, reconciliation]
last_updated: 2026-03-29
---

# PR #155: PDB Selector Drift Fix

| 항목 | 내용 |
|------|------|
| **PR** | [#155](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/155) |
| **날짜** | 2026-03-07 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

PodDisruptionBudget(PDB)의 셀렉터와 레이블이 reconciliation 과정에서 드리프트(drift)하는 문제를 수정했다. PDB 셀렉터가 실제 Pod 레이블과 불일치하면 PDB가 무효화되어 의도치 않은 동시 Pod 중단이 발생할 수 있었다.

## 주요 변경 사항

- PDB 셀렉터와 Pod 레이블 간의 일관성 보장
- Reconciliation 루프에서 레이블 드리프트 감지 및 자동 수정
- PDB 상태 검증 로직 추가

## 영향 범위

ACKO로 관리되는 모든 Aerospike 클러스터의 가용성에 영향. PDB가 올바르게 동작해야 Kubernetes 노드 유지보수 시 Aerospike Pod가 동시에 중단되지 않는다. 이 수정이 없으면 롤링 업데이트나 노드 드레인 시 데이터 가용성 문제가 발생할 수 있었다.
