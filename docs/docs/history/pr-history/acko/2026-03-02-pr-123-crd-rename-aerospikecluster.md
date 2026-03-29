---
title: "PR #123: CRD Rename to AerospikeCluster"
description: "BREAKING: CRD 이름을 AerospikeCECluster에서 AerospikeCluster로 변경하여 중복 CE 접두사 제거"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [refactor, breaking-change, crd, naming]
last_updated: 2026-03-29
---

# PR #123: CRD Rename to AerospikeCluster

| 항목 | 내용 |
|------|------|
| **PR** | [#123](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/123) |
| **날짜** | 2026-03-02 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

**BREAKING CHANGE**: CRD 이름을 `AerospikeCECluster`에서 `AerospikeCluster`로 변경했다. CE(Community Edition)는 이미 오퍼레이터 이름(ACKO)에 포함되어 있으므로 CRD 이름에서 중복되는 CE 접두사를 제거하여 리소스 이름을 간결하게 정리했다.

## 주요 변경 사항

- CRD 이름 `AerospikeCECluster` → `AerospikeCluster`로 변경
- API 그룹 및 버전 내 모든 참조 업데이트
- Webhook validation 및 defaulting 로직 업데이트
- 컨트롤러 내 GVK(Group/Version/Kind) 참조 전체 수정
- Helm chart의 CRD 템플릿 및 RBAC 규칙 업데이트
- 기존 CR 마이그레이션 가이드 제공

## 영향 범위

ACKO를 사용하는 모든 환경에 **BREAKING CHANGE**. 기존 `AerospikeCECluster` 리소스는 새 `AerospikeCluster` CRD로 마이그레이션해야 한다. Cluster Manager UI와 모든 예제 매니페스트도 새 이름에 맞게 업데이트가 필요하다.
