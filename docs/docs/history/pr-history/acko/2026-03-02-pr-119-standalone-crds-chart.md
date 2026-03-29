---
title: "PR #119: Standalone CRDs Helm Chart"
description: "CRD를 독립 acko-crds Helm 차트로 분리하여 GitOps 워크플로우 및 CRD 라이프사이클 독립 관리 지원"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feature, helm, crd, gitops]
last_updated: 2026-03-29
---

# PR #119: Standalone CRDs Helm Chart

| 항목 | 내용 |
|------|------|
| **PR** | [#119](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/119) |
| **날짜** | 2026-03-02 |
| **작성자** | ksr |
| **카테고리** | feature |

## 변경 요약

CRD 정의를 오퍼레이터 Helm 차트에서 분리하여 독립적인 `acko-crds` 차트로 제공한다. GitOps 환경에서 CRD와 오퍼레이터의 라이프사이클을 별도로 관리할 수 있으며, Helm의 CRD 삭제 방지 정책과 무관하게 CRD 업그레이드를 제어할 수 있다.

## 주요 변경 사항

- `acko-crds` 독립 Helm 차트 생성
- 기존 오퍼레이터 차트에서 CRD를 crds/ 디렉토리 방식에서 제거
- CRD 버전 호환성 매트릭스 문서화
- ArgoCD/Flux 등 GitOps 도구와의 호환성 검증
- 차트 간 의존성 관계 정의

## 영향 범위

GitOps 워크플로우에서 CRD 업그레이드 타이밍을 오퍼레이터와 독립적으로 제어할 수 있다. 멀티 클러스터 환경에서 CRD를 중앙 관리하는 패턴도 지원된다. 기존 사용자는 오퍼레이터 차트 업그레이드 전 `acko-crds` 차트를 먼저 설치해야 한다.
