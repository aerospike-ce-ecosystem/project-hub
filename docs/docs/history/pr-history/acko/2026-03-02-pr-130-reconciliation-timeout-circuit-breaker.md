---
title: "PR #130: Reconciliation Timeout and Circuit Breaker"
description: "Reconciliation에 5분 타임아웃과 지수 백오프 기반 서킷 브레이커를 추가하여 무한 재시도 방지"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feature, reconciliation, timeout, circuit-breaker, reliability]
last_updated: 2026-03-29
---

# PR #130: Reconciliation Timeout and Circuit Breaker

| 항목 | 내용 |
|------|------|
| **PR** | [#130](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/130) |
| **날짜** | 2026-03-02 |
| **작성자** | ksr |
| **카테고리** | feature |

## 변경 요약

Reconciliation 루프에 5분 타임아웃과 지수 백오프(exponential backoff) 기반 서킷 브레이커를 도입했다. 오류가 반복되는 상황에서 무한 재시도를 방지하고, 연속 실패 시 재시도 간격을 점진적으로 늘려 시스템 부하를 줄인다.

## 주요 변경 사항

- 단일 reconciliation 사이클에 5분 타임아웃 적용
- 연속 실패 시 지수 백오프: 초기 1초 → 최대 5분 간격
- 연속 실패 횟수 기반 서킷 브레이커 상태 관리
- 서킷 브레이커 상태를 CR status에 반영
- 수동 리셋을 위한 어노테이션 지원

## 영향 범위

잘못된 설정이나 외부 종속성 장애로 인한 reconciliation 무한 루프가 방지된다. 오퍼레이터의 리소스 소비가 안정화되며, 운영자는 CR status를 통해 서킷 브레이커 상태를 모니터링할 수 있다.
