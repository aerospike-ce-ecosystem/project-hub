---
title: "PR #070: Add Rack Configuration Wizard and Cluster Health Dashboard"
description: 랙 구성 마법사와 실시간 클러스터 헬스 대시보드 추가
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, ui, rack, health, dashboard, kubernetes]
last_updated: 2026-03-29
---

# PR #070: Add Rack Configuration Wizard and Cluster Health Dashboard

| 항목 | 내용 |
|------|------|
| **PR** | [#070](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/70) |
| **날짜** | 2026-03-02 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

랙(Rack) 구성 마법사와 실시간 클러스터 헬스 대시보드를 추가했다. 랙 마법사를 통해 Aerospike의 랙 인식(rack-aware) 복제 설정을 시각적으로 구성할 수 있으며, 헬스 대시보드에서 노드별 상태를 실시간으로 모니터링할 수 있다.

## 주요 변경 사항

- 랙 구성 마법사 UI (노드-랙 매핑, 복제 팩터 설정)
- 실시간 클러스터 헬스 대시보드
- 노드별 메모리/디스크 사용량 시각화
- 클러스터 상태 요약 위젯
- 랙별 파티션 분배 현황 표시

## 영향 범위

PR #069의 CRD 지원과 함께 Kubernetes 클러스터 관리 기능을 완성하는 핵심 UI 추가. 랙 구성의 복잡성을 마법사로 추상화하고, 운영 중 클러스터 상태를 한눈에 파악할 수 있게 되었다.
