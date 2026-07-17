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

Kubernetes Secret 변경을 감시해 ACL(Access Control List) 설정을 자동으로 동기화하도록 했다. 동적 설정 변경이 실패하면 이전 값으로 롤백하고, 스케일 다운 전에는 노드 수가 최소 replication factor를 충족하는지 확인한다.

## 주요 변경 사항

- Secret Watch: Kubernetes Secret 변경 감지 및 ACL 자동 동기화
- 동적 설정 롤백: asinfo 기반 설정 변경 실패 시 이전 값으로 자동 복원
- 스케일다운 안전성: 최소 replication-factor 이상의 노드 수 유지 검증
- 문서 업데이트: ACL 설정 가이드 및 운영 절차 추가

## 영향 범위

ACL을 사용하는 ACKO 클러스터에서 Secret을 변경하면 수동 동기화 없이 새 설정이 반영된다. 동적 설정 실패 시의 롤백과 스케일 다운 전 노드 수 검증도 같은 운영 경로에 적용된다. 설정 변경 이력은 Cluster Manager 연동을 통해 추적할 수 있다.
