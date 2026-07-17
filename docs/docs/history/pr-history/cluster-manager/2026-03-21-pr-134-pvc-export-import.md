---
title: "PR #134: PVC Status and CR Export/Import"
description: Added PVC status monitoring, CR export/import, and force reconcile functionality
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, pvc, cr, export, import, reconcile]
last_updated: 2026-03-29
---

# PR #134: PVC Status and CR Export/Import

| 항목 | 내용 |
|------|------|
| **PR** | [#134](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/134) |
| **날짜** | 2026-03-21 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

PVC(PersistentVolumeClaim) 상태 모니터링, AerospikeCluster CR의 내보내기/가져오기, 강제 reconcile 기능을 추가했다. 클러스터 스토리지 상태를 실시간으로 확인하고, CR을 파일로 백업하거나 다른 환경에 이식할 수 있다.

## 주요 변경 사항

- PVC 상태 대시보드: 바운드/펜딩/로스트 상태 시각화
- CR 내보내기: AerospikeCluster YAML 다운로드
- CR 가져오기: YAML 파일에서 클러스터 생성
- 강제 reconcile 트리거: 수동으로 reconciliation 실행

## 영향 범위

ACKO cluster 운영 flow가 영향을 받는다. PVC status로 storage 문제를 확인하고, CR export/import로 configuration을 다른 환경에 옮길 수 있다. Force reconcile은 Operator가 drift된 상태를 즉시 다시 조정해야 할 때 사용한다.
