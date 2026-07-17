---
title: "PR #150: Template Description Field"
description: Added description field to AerospikeClusterTemplate CRD for better documentation
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feat, crd, template, ux]
last_updated: 2026-03-29
---

# PR #150: Template Description Field

| 항목 | 내용 |
|------|------|
| **PR** | [#150](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/150) |
| **날짜** | 2026-03-03 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

AerospikeClusterTemplate CRD에 `description` 필드를 추가하여 템플릿의 용도와 설정 의도를 문서화할 수 있게 했다. 여러 템플릿을 관리할 때 각 템플릿의 목적을 명확히 구분할 수 있다.

## 주요 변경 사항

- AerospikeClusterTemplate에 `spec.description` 필드 추가
- kubectl describe 출력에 설명 표시
- CRD validation에 최대 길이 제한 추가
- Cluster Manager UI의 템플릿 목록에서 설명 표시 지원

## 영향 범위

AerospikeClusterTemplate을 사용하는 환경에 적용된다. 운영자는 `kubectl describe`와 Cluster Manager 템플릿 목록에서 설명을 확인해, 여러 템플릿의 용도를 설정 본문을 열지 않고도 구분할 수 있다.
