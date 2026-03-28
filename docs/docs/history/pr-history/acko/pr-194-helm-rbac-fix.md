---
title: "PR #194: Helm RBAC and Deployment Fixes"
description: Helm chart RBAC 권한 개선, deployment strategy/probes/metrics 경로 수정
sidebar_position: 14
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [fix, acko, helm, rbac, deployment]
last_updated: 2026-03-29
---

# PR #194: Helm RBAC and Deployment Fixes

| 항목 | 내용 |
|------|------|
| **PR** | [#194](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/194) |
| **날짜** | 2026-03-24 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

Helm chart의 UI 컴포넌트에 대한 RBAC 권한을 개선하고, deployment strategy, liveness/readiness probes, metrics 경로를 수정했다. 보안과 운영 안정성을 동시에 강화하는 변경이다.

## 주요 변경 사항

- UI 컴포넌트용 RBAC ClusterRole/ClusterRoleBinding 권한을 최소 권한 원칙에 맞게 조정
- Deployment strategy를 RollingUpdate로 변경하고 maxSurge/maxUnavailable 설정 추가
- Liveness/readiness probe 경로 및 설정 수정
- Metrics endpoint 경로를 표준 `/metrics`로 통일

## 영향 범위

Helm chart로 배포된 ACKO UI 컴포넌트에 영향. RBAC 권한이 축소되므로 기존에 과도한 권한에 의존하던 환경에서는 업그레이드 시 확인이 필요하다. Probe 및 metrics 경로 변경으로 모니터링 설정 업데이트가 필요할 수 있다.
