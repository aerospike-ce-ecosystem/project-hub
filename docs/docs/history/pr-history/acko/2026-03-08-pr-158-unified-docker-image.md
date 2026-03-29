---
title: "PR #158: Unified Podman Image"
description: Unified cluster-manager into single container image for simplified deployment
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [refactor, podman, deployment, cluster-manager]
last_updated: 2026-03-29
---

# PR #158: Unified Podman Image

| 항목 | 내용 |
|------|------|
| **PR** | [#158](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/158) |
| **날짜** | 2026-03-08 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

Cluster Manager를 단일 컨테이너 이미지로 통합하여 배포를 단순화했다. 이전에는 프론트엔드와 백엔드가 별도 컨테이너로 분리되어 있었으나, 하나의 이미지로 합쳐서 Kubernetes 배포 시의 복잡성을 줄였다.

## 주요 변경 사항

- Cluster Manager 프론트엔드/백엔드를 단일 컨테이너 이미지로 통합
- Containerfile(Podman) 최적화: 멀티스테이지 빌드
- 배포 매니페스트 간소화: 단일 Deployment로 변경
- 이미지 크기 최적화

## 영향 범위

ACKO와 Cluster Manager를 함께 배포하는 모든 환경에 영향. 배포 구성이 단순해져서 초기 설정과 유지보수가 쉬워진다. 기존 분리 배포 방식에서 마이그레이션이 필요하다.
