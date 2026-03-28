---
title: "PR #086: Event Timeline and Config Drift"
description: 11-category event timeline, config drift detection, and cluster-scoped template support
sidebar_position: 3
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, events, config-drift, timeline, templates]
last_updated: 2026-03-29
---

# PR #086: Event Timeline and Config Drift

| 항목 | 내용 |
|------|------|
| **PR** | [#086](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/86) |
| **날짜** | 2026-03-09 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

11개 카테고리의 이벤트 타임라인, 설정 드리프트 감지, reconciliation 헬스 체크, cluster-scoped 템플릿 지원을 추가했다. 클러스터에서 발생하는 모든 중요 이벤트를 시간 순서로 추적하고, 설정 불일치를 자동으로 감지한다.

## 주요 변경 사항

- 11개 카테고리 이벤트 타임라인 (스케일, 설정 변경, 장애, 마이그레이션 등)
- Config drift 감지: 기대 설정 vs 실제 설정 자동 비교
- Reconciliation 헬스: 오퍼레이터 reconcile 상태 모니터링
- Cluster-scoped 템플릿 UI (ACKO PR #163 대응)

## 영향 범위

Cluster Manager의 모니터링 및 운영 기능 전반에 영향. 이벤트 타임라인은 장애 분석(RCA)에 핵심적이며, config drift 감지는 프로덕션 환경의 안정성을 보장한다. ACKO PR #163의 cluster-scoped 템플릿 전환에 대응하는 UI 변경을 포함한다.
