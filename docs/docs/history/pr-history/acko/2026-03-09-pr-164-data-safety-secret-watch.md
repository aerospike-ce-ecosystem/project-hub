---
title: "PR #164: Data Safety and Secret Watch"
description: "Critical improvements: Secret watch for ACL, dynamic config rollback, scale-down safety, and documentation"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [improve, data-safety, secret, acl, config-rollback]
last_updated: 2026-03-29
---

# PR #164: Data Safety and Secret Watch

| 항목 | 내용 |
|------|------|
| **PR** | [#164](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/164) |
| **날짜** | 2026-03-09 |
| **작성자** | ksr |
| **카테고리** | improve |

## 변경 요약

데이터 안전성에 관련된 핵심 개선사항을 포함한다. Kubernetes Secret 변경을 감시하여 ACL(Access Control List) 설정을 자동 동기화하고, 동적 설정 변경 실패 시 자동 롤백 메커니즘을 구현했으며, 스케일다운 시의 데이터 안전성을 강화했다.

## 주요 변경 사항

- Secret Watch: Kubernetes Secret 변경 감지 및 ACL 자동 동기화
- 동적 설정 롤백: asinfo 기반 설정 변경 실패 시 이전 값으로 자동 복원
- 스케일다운 안전성: 최소 replication-factor 이상의 노드 수 유지 검증
- 문서 업데이트: ACL 설정 가이드 및 운영 절차 추가

## 영향 범위

ACKO로 운영되는 모든 Aerospike 클러스터에 영향. 특히 ACL을 사용하는 보안 설정 환경에서 Secret 변경이 자동으로 반영되어 수동 작업이 줄어든다. Cluster Manager와의 연동을 통해 설정 변경 이력 추적이 가능하다.
