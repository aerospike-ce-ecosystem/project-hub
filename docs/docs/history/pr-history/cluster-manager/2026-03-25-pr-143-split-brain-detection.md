---
title: "PR #143: Split-Brain Detection"
description: Added split-brain detection, circuit breaker reset, and CE validation to cluster management
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, split-brain, circuit-breaker, validation]
last_updated: 2026-03-29
---

# PR #143: Split-Brain Detection

| 항목 | 내용 |
|------|------|
| **PR** | [#143](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/143) |
| **날짜** | 2026-03-25 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

클러스터 스플릿 브레인(split-brain) 상태를 자동으로 감지하는 기능과 서킷 브레이커 수동 리셋 기능, CE(Community Edition) 유효성 검증을 추가했다. 네트워크 파티션으로 인한 클러스터 분할 상태를 조기에 발견하고 대응할 수 있다.

## 주요 변경 사항

- 스플릿 브레인 감지: 클러스터 노드 간 cluster_key 불일치 탐지
- 스플릿 브레인 경고 UI: 시각적 알림 및 상세 정보 표시
- 서킷 브레이커 수동 리셋 UI (ACKO PR #160 연동)
- CE 에디션 유효성 검증: Enterprise 전용 설정 사용 시 경고

## 영향 범위

모든 Cluster Manager 사용자에게 영향. 네트워크 파티션 상황에서의 조기 감지 능력이 향상되어 데이터 불일치를 방지할 수 있다. ACKO의 서킷 브레이커 기능과 직접 연동된다.
