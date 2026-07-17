---
title: "PR #114: Migration Status UI"
description: Added migration status monitoring UI for real-time data migration tracking
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, migration, monitoring, ui]
last_updated: 2026-03-29
---

# PR #114: Migration Status UI

| 항목 | 내용 |
|------|------|
| **PR** | [#114](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/114) |
| **날짜** | 2026-03-16 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

데이터 마이그레이션 상태를 실시간으로 모니터링하는 UI를 추가했다. ACKO PR #180에서 도입된 migrationStatus CRD 필드를 시각적으로 표현하여, 클러스터 변경 작업 시 데이터 이동 진행 상황을 직관적으로 확인할 수 있다.

## 주요 변경 사항

- 마이그레이션 상태 대시보드: Pod별 incoming/outgoing 파티션 시각화
- 실시간 진행률 표시 바
- 마이그레이션 완료 예상 시간 추정
- 마이그레이션 이력 타임라인

## 영향 범위

ACKO cluster를 scale하거나 configuration을 변경하는 모든 사용자가 영향을 받는다. UI는 ACKO PR #180의 `migrationStatus` field를 표시하며, PR #183의 migration-aware restart 진행 상태도 확인할 수 있다.
