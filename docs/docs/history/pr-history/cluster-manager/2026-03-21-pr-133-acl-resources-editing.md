---
title: "PR #133: ACL/Resources Editing"
description: ACL and resources editing with improved cluster list visibility
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, acl, resources, cluster-list, ux]
last_updated: 2026-03-29
---

# PR #133: ACL/Resources Editing

| 항목 | 내용 |
|------|------|
| **PR** | [#133](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/133) |
| **날짜** | 2026-03-21 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

ACL(접근 제어)과 리소스 편집 기능을 추가하고, 클러스터 목록의 가시성을 향상시켰다. 클러스터의 접근 제어 설정과 CPU/메모리 리소스 제한을 UI에서 직접 편집할 수 있다.

## 주요 변경 사항

- ACL(접근 제어) 설정 편집 UI 추가
- CPU/메모리 리소스 requests/limits 편집 기능
- 클러스터 목록 가시성 개선 (상태 표시, 필터링)
- 편집 내용의 유효성 검증

## 영향 범위

클러스터 보안과 리소스 관리를 담당하는 운영자에게 영향. ACL 편집을 통해 클러스터 접근 권한을 세밀하게 제어할 수 있다. 리소스 편집으로 Kubernetes 리소스 할당을 최적화할 수 있으며, 개선된 클러스터 목록은 다수의 클러스터를 관리할 때 운영 효율을 높인다.
