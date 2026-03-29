---
title: "PR #163: Cluster-Scoped Template"
description: "BREAKING: Convert AerospikeClusterTemplate CRD from namespace-scoped to cluster-scoped"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [refactor, breaking-change, crd, template]
last_updated: 2026-03-29
---

# PR #163: Cluster-Scoped Template

| 항목 | 내용 |
|------|------|
| **PR** | [#163](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/163) |
| **날짜** | 2026-03-08 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

**BREAKING CHANGE**: AerospikeClusterTemplate CRD의 스코프를 namespace에서 cluster로 변경했다. 이를 통해 하나의 템플릿을 여러 네임스페이스에서 공유할 수 있게 되어 멀티테넌트 환경에서의 관리 편의성이 크게 향상된다.

## 주요 변경 사항

- AerospikeClusterTemplate CRD를 cluster-scoped로 전환
- 기존 namespace-scoped 템플릿에서의 마이그레이션 경로 제공
- RBAC 규칙 업데이트: ClusterRole 기반 접근 제어
- Webhook validation 업데이트
- Cluster Manager UI에서의 템플릿 목록 조회 방식 변경

## 영향 범위

ACKO를 사용하는 모든 환경에 **BREAKING CHANGE**. 기존 namespace-scoped 템플릿은 cluster-scoped로 마이그레이션해야 한다. Cluster Manager의 템플릿 관련 UI(PR #086)도 이 변경에 맞게 업데이트가 필요하다.
