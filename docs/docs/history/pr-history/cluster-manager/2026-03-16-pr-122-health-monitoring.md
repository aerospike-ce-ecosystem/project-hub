---
title: "PR #122: Health Monitoring"
description: Added reconciliation health monitoring, config drift detection, and circuit breaker controls
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, health, monitoring, config-drift, circuit-breaker]
last_updated: 2026-03-29
---

# PR #122: Health Monitoring

| 항목 | 내용 |
|------|------|
| **PR** | [#122](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/122) |
| **날짜** | 2026-03-16 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Reconciliation 헬스 모니터링, 설정 드리프트(config drift) 감지, 서킷 브레이커 제어 UI를 추가했다. ACKO 오퍼레이터의 상태를 실시간으로 모니터링하고, 기대 설정과 실제 설정 간의 불일치를 자동으로 탐지한다.

## 주요 변경 사항

- Reconciliation 헬스 대시보드: 성공/실패/재시도 상태 시각화
- Config drift 감지: CR 스펙과 실제 Aerospike 설정 비교
- 서킷 브레이커 상태 표시 및 제어 UI
- 헬스 이벤트 타임라인 통합

## 영향 범위

ACKO가 관리하는 클러스터의 운영 가시성이 달라진다. ACKO PR #160의 circuit breaker와 연동하고 PR #086의 event timeline에 상태를 표시해, 장애와 configuration drift를 같은 UI에서 확인할 수 있다.
