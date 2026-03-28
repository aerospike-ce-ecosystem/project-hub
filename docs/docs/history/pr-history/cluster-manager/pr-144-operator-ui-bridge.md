---
title: "PR #144: Operator UI Bridge Enhancements"
description: Added exporter env vars, PVC pod binding, and pod volume status to operator integration
sidebar_position: 13
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, operator, pvc, monitoring]
last_updated: 2026-03-29
---

# PR #144: Operator UI Bridge Enhancements

| 항목 | 내용 |
|------|------|
| **PR** | [#144](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/144) |
| **날짜** | 2026-03-25 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

ACKO 오퍼레이터와 Cluster Manager UI 간의 연동을 강화했다. Prometheus exporter의 환경변수 설정, PVC-Pod 바인딩 표시, Pod 볼륨 상태 모니터링 기능을 추가했다.

## 주요 변경 사항

- Prometheus exporter 환경변수 설정 UI 추가
- PVC-Pod 바인딩 상태 시각화
- Pod별 볼륨 마운트 상태 표시
- ACKO CR에서 exporter 설정 관리

## 영향 범위

ACKO와 Cluster Manager를 함께 사용하는 환경에 영향. 특히 Prometheus 모니터링과 PVC 기반 스토리지를 사용하는 클러스터에서 운영 가시성이 향상된다. ACKO PR #202의 METRIC_LABELS 수정과 연관된다.
