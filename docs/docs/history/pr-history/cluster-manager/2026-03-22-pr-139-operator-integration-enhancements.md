---
title: "PR #139: Operator Integration Enhancements"
description: Operator integration enhancements with revision management, container securityContext, and affinity settings
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, operator, revision, security-context, affinity]
last_updated: 2026-03-29
---

# PR #139: Operator Integration Enhancements

| 항목 | 내용 |
|------|------|
| **PR** | [#139](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/139) |
| **날짜** | 2026-03-22 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Operator 연동을 강화하여 revision 관리, 컨테이너 securityContext, affinity 설정 기능을 추가했다. ACKO와의 통합을 심화하여 운영에 필요한 고급 Kubernetes 설정을 UI에서 관리할 수 있다.

## 주요 변경 사항

- Revision 관리 기능 추가 (배포 이력 추적)
- 컨테이너 수준 securityContext 설정 UI
- Node affinity / pod affinity / pod anti-affinity 설정
- Operator CR 스펙과의 양방향 동기화 개선

## 영향 범위

ACKO를 통해 Aerospike 클러스터를 운영하는 모든 사용자에게 영향. Revision 관리로 배포 변경 이력을 추적하고 롤백할 수 있다. 컨테이너 securityContext로 세밀한 보안 정책을 적용할 수 있으며, affinity 설정으로 Pod 스케줄링 전략을 최적화할 수 있다.
