---
title: "PR #159: Cross-Namespace Template References"
description: AerospikeClusterTemplate이 다른 namespace에서 참조 가능하도록 확장
sidebar_position: 12
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feat, acko, template, namespace, crd]
last_updated: 2026-03-29
---

# PR #159: Cross-Namespace Template References

| 항목 | 내용 |
|------|------|
| **PR** | [#159](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/159) |
| **날짜** | 2026-03-08 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

AerospikeClusterTemplate을 다른 namespace에서도 참조할 수 있도록 cross-namespace template reference 기능을 추가했다. 중앙 관리 namespace에 템플릿을 정의하고 여러 namespace의 클러스터에서 공유할 수 있다.

## 주요 변경 사항

- AerospikeCluster CRD의 `templateRef`에 `namespace` 필드 추가
- Cross-namespace 참조 시 RBAC 권한 검증 로직 구현
- 템플릿이 존재하지 않거나 접근 불가 시 명확한 에러 메시지 제공
- 기존 동일 namespace 참조 방식과의 하위 호환성 유지

## 영향 범위

멀티 테넌트 환경에서 템플릿 관리가 크게 개선된다. 중앙 namespace에 표준 템플릿을 정의하고 각 팀의 namespace에서 참조하는 패턴이 가능해져 설정 일관성과 관리 효율성이 향상된다.
