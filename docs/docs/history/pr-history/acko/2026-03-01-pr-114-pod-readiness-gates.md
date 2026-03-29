---
title: "PR #114: Pod Readiness Gates"
description: "커스텀 readiness gate(acko.io/aerospike-ready)를 구현하여 Pod가 클러스터 메시에 조인한 후에만 ready로 표시"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feature, readiness, pod, cluster-mesh]
last_updated: 2026-03-29
---

# PR #114: Pod Readiness Gates

| 항목 | 내용 |
|------|------|
| **PR** | [#114](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/114) |
| **날짜** | 2026-03-01 |
| **작성자** | ksr |
| **카테고리** | feature |

## 변경 요약

커스텀 Pod readiness gate `acko.io/aerospike-ready`를 구현했다. Aerospike Pod가 단순히 컨테이너 시작 상태가 아닌, 실제로 클러스터 메시에 조인하여 데이터 서비스가 가능한 상태일 때만 ready로 표시된다. 이를 통해 Service 엔드포인트에 아직 준비되지 않은 노드가 포함되는 것을 방지한다.

## 주요 변경 사항

- `acko.io/aerospike-ready` 커스텀 readiness gate 조건 추가
- 오퍼레이터가 클러스터 메시 조인 상태를 확인 후 조건 업데이트
- StatefulSet PodTemplate에 readinessGates 필드 자동 주입
- 클러스터 사이즈 기반 메시 조인 확인 로직 구현

## 영향 범위

신규 배포 및 기존 클러스터의 롤링 업데이트 시 적용된다. Service 뒤에 있는 Pod가 실제 서비스 가능 상태에서만 트래픽을 수신하므로, 롤링 업데이트 중 클라이언트 요청 실패를 크게 줄일 수 있다.
