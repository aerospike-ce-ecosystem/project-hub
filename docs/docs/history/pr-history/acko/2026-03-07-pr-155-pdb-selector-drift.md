---
title: "PR #155: PDB Selector Drift Fix"
description: Fixed PodDisruptionBudget selector and label drift during reconciliation
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

ACKO로 관리되는 Aerospike 클러스터에서 reconciliation 후에도 PDB selector가 Pod label과 일치한다. 따라서 Kubernetes 노드 유지보수, 롤링 업데이트, 노드 drain 중에도 PDB 정책이 적용되어 여러 Pod가 동시에 중단될 위험을 낮춘다.
