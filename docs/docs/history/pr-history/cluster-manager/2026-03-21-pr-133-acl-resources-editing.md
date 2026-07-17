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

클러스터 security와 resource를 관리하는 운영자가 영향을 받는다. UI에서 ACL과 Kubernetes resource request/limit을 조정할 수 있고, 개선된 클러스터 목록으로 여러 클러스터의 상태를 더 쉽게 확인할 수 있다.
