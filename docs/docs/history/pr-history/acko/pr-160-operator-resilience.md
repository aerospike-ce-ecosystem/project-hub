---
title: "PR #160: Operator Resilience"
description: Enhanced operator resilience with client retry, ACL sync retry, and circuit breaker patterns
sidebar_position: 4
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [improve, resilience, retry, circuit-breaker, observability]
last_updated: 2026-03-29
---

# PR #160: Operator Resilience

| 항목 | 내용 |
|------|------|
| **PR** | [#160](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/160) |
| **날짜** | 2026-03-08 |
| **작성자** | ksr |
| **카테고리** | improve |

## 변경 요약

ACKO 오퍼레이터의 복원력(resilience)을 강화하기 위해 클라이언트 재시도, ACL 동기화 재시도, 서킷 브레이커 패턴을 도입했다. 일시적인 네트워크 장애나 서버 과부하 상황에서 오퍼레이터가 자동으로 복구할 수 있게 되었다.

## 주요 변경 사항

- Aerospike 클라이언트 연결 재시도 로직 추가
- ACL 동기화 작업의 재시도 메커니즘 구현
- 서킷 브레이커 패턴: 연속 실패 시 일시 중단 후 재시도
- 관측성(observability) 강화: 재시도 및 서킷 브레이커 상태 메트릭
- 테스트 커버리지 확대

## 영향 범위

ACKO 오퍼레이터의 전반적인 안정성에 영향. 불안정한 네트워크 환경이나 Aerospike 노드의 일시적 장애 상황에서 오퍼레이터의 자동 복구 능력이 향상된다. Cluster Manager의 서킷 브레이커 UI(PR #122, PR #143)와 연동된다.
