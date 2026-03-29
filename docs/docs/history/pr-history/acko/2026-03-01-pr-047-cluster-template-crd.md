---
title: "PR #047: AerospikeClusterTemplate CRD"
description: "재사용 가능한 클러스터 설정 프로파일을 정의하는 AerospikeClusterTemplate CRD 추가"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feature, crd, template, reusability]
last_updated: 2026-03-29
---

# PR #047: AerospikeClusterTemplate CRD

| 항목 | 내용 |
|------|------|
| **PR** | [#047](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/47) |
| **날짜** | 2026-03-01 |
| **작성자** | ksr |
| **카테고리** | feature |

## 변경 요약

재사용 가능한 클러스터 설정 프로파일을 정의하는 `AerospikeClusterTemplate` CRD를 추가했다. 공통 Aerospike 설정(네트워크, 스토리지, 네임스페이스 등)을 템플릿으로 정의하고, 여러 `AerospikeCluster` CR에서 참조하여 설정 중복을 제거할 수 있다.

## 주요 변경 사항

- `AerospikeClusterTemplate` CRD 스키마 정의
- AerospikeCluster CR에서 `templateRef` 필드로 템플릿 참조 지원
- 템플릿 설정과 인라인 설정 간 머지 로직 구현
- 템플릿 변경 시 참조 클러스터 자동 reconciliation
- Webhook 기반 템플릿 유효성 검증

## 영향 범위

동일한 설정의 클러스터를 여러 네임스페이스에 배포하는 환경에서 설정 관리가 크게 간소화된다. 템플릿 하나를 수정하면 참조하는 모든 클러스터에 변경이 전파되므로 일관된 설정 유지가 가능하다. 이후 PR #163에서 cluster-scoped로 전환된다.
