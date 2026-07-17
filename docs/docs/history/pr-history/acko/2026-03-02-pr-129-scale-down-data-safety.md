---
title: "PR #129: Scale-Down Data Safety Verification"
description: "스케일 다운 전 마이그레이션 상태를 검증하여 데이터 유실 방지"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feature, scale-down, data-safety, migration]
last_updated: 2026-03-29
---

# PR #129: Scale-Down Data Safety Verification

| 항목 | 내용 |
|------|------|
| **PR** | [#129](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/129) |
| **날짜** | 2026-03-02 |
| **작성자** | ksr |
| **카테고리** | feature |

## 변경 요약

클러스터 스케일 다운 실행 전 데이터 안전성을 검증하는 프리플라이트 체크를 추가했다. 제거 대상 노드에서 다른 노드로의 데이터 마이그레이션이 완료되었는지 확인한 후에만 스케일 다운이 진행된다.

## 주요 변경 사항

- 스케일 다운 요청 시 마이그레이션 잔여 파티션 수 확인
- 마이그레이션 미완료 시 스케일 다운 차단 및 이벤트 기록
- `asinfo -v migrate-fill-delay` 기반 안전 대기 시간 적용
- 강제 스케일 다운을 위한 어노테이션 옵션 제공

## 영향 범위

스케일 다운 전에 마이그레이션 상태를 확인함으로써 데이터 유실 위험을 낮춘다. 마이그레이션이 끝나지 않은 상태에서는 오퍼레이터가 작업을 차단하고 이벤트를 기록하므로, 운영자가 중단 원인을 확인한 뒤 다시 진행할 수 있다.
