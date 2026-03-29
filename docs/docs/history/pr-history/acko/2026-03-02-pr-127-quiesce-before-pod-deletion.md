---
title: "PR #127: Quiesce Before Pod Deletion"
description: "Pod 삭제 전 Aerospike 노드를 quiesce하여 진행 중인 트랜잭션의 정상 완료를 보장"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feature, quiesce, graceful-shutdown, pod-lifecycle]
last_updated: 2026-03-29
---

# PR #127: Quiesce Before Pod Deletion

| 항목 | 내용 |
|------|------|
| **PR** | [#127](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/127) |
| **날짜** | 2026-03-02 |
| **작성자** | ksr |
| **카테고리** | feature |

## 변경 요약

Pod 삭제(스케일 다운, 롤링 업데이트 등) 전에 Aerospike 노드를 quiesce 상태로 전환하는 기능을 추가했다. Quiesce된 노드는 새로운 트랜잭션을 거부하고 진행 중인 트랜잭션만 완료한 후 안전하게 종료되므로, 클라이언트 요청 실패를 최소화한다.

## 주요 변경 사항

- Pod 삭제 전 `asinfo -v quiesce` 명령 실행
- Quiesce 완료 대기 및 타임아웃 처리
- PreStop hook을 통한 graceful shutdown 시퀀스 구현
- Quiesce 실패 시 폴백 전략(강제 종료 허용 어노테이션)
- 클라이언트 재연결을 위한 충분한 drain 시간 확보

## 영향 범위

롤링 업데이트 및 스케일 다운 시 클라이언트 측 트랜잭션 실패가 크게 감소한다. 특히 장시간 실행되는 스캔/쿼리 작업이 있는 환경에서 유용하며, 무중단 운영에 가까운 클러스터 관리가 가능해진다.
