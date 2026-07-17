---
title: "PR #180: Migration Status Tracking"
description: Added migrationStatus CRD field with per-pod tracking to AerospikeCluster status
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feat, migration, crd, status, monitoring]
last_updated: 2026-03-29
---

# PR #180: Migration Status Tracking

| 항목 | 내용 |
|------|------|
| **PR** | [#180](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/180) |
| **날짜** | 2026-03-16 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

AerospikeCluster CRD의 status에 `migrationStatus` 필드를 추가하여 클러스터의 데이터 마이그레이션 상태를 Pod 단위로 추적할 수 있게 했다. 클러스터 변경 작업 시 마이그레이션 진행 상황을 실시간으로 모니터링할 수 있다.

## 주요 변경 사항

- `status.migrationStatus` CRD 필드 신규 추가
- Pod별 마이그레이션 상태 추적 (incoming/outgoing 파티션 수)
- 마이그레이션 완료 여부 자동 판단 로직
- kubectl을 통한 마이그레이션 상태 조회 지원

## 영향 범위

운영자는 `kubectl`에서 Pod별 incoming/outgoing 파티션 수와 마이그레이션 완료 여부를 확인할 수 있다. 같은 status 정보는 Cluster Manager UI(PR #114)의 마이그레이션 모니터링과 PR #183의 마이그레이션 인식 재시작에서도 사용된다.
