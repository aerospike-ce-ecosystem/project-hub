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

커스텀 Pod readiness gate `acko.io/aerospike-ready`를 구현했다. Aerospike Pod는 컨테이너 실행 여부만으로 ready 상태가 되지 않고, 클러스터 메시 조인을 마쳐 데이터를 서비스할 수 있어야 ready로 표시된다. 따라서 준비되지 않은 노드가 Service 엔드포인트에 포함되지 않는다.

## 주요 변경 사항

- `acko.io/aerospike-ready` 커스텀 readiness gate 조건 추가
- 오퍼레이터가 클러스터 메시 조인 상태를 확인 후 조건 업데이트
- StatefulSet PodTemplate에 readinessGates 필드 자동 주입
- 클러스터 사이즈 기반 메시 조인 확인 로직 구현

## 영향 범위

신규 배포와 기존 클러스터의 롤링 업데이트에 적용된다. 메시 조인을 마친 Pod만 Service 트래픽을 받으므로, 롤링 업데이트 중 준비 전 노드로 요청이 전달되는 상황을 줄일 수 있다.
