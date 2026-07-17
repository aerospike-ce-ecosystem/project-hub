---
title: "PR #194: Helm RBAC and Deployment Fixes"
description: Helm chart RBAC 권한 개선, deployment strategy/probes/metrics 경로 수정
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

Helm chart의 UI 컴포넌트에 대한 RBAC 권한을 조정했다. Deployment strategy와 liveness/readiness probe 설정을 수정하고 metrics 경로를 `/metrics`로 통일했다.

## 주요 변경 사항

- UI 컴포넌트용 RBAC ClusterRole/ClusterRoleBinding 권한을 최소 권한 원칙에 맞게 조정
- Deployment strategy를 RollingUpdate로 변경하고 maxSurge/maxUnavailable 설정 추가
- Liveness/readiness probe 경로 및 설정 수정
- Metrics endpoint 경로를 표준 `/metrics`로 통일

## 영향 범위

Helm chart로 ACKO UI를 배포한 환경에 적용된다. 기존 구성이 축소 전 RBAC 권한이나 기존 probe·metrics 경로에 의존한다면 업그레이드 전에 권한과 모니터링 설정을 확인해야 한다.
