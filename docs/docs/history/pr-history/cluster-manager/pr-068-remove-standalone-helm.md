---
title: "PR #068: Remove Standalone Helm Chart"
description: 독립 Helm 차트를 제거하고 오퍼레이터 차트로 통합
sidebar_position: 5
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [refactor, helm, kubernetes, cleanup]
last_updated: 2026-03-29
---

# PR #068: Remove Standalone Helm Chart

| 항목 | 내용 |
|------|------|
| **PR** | [#068](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/68) |
| **날짜** | 2026-03-02 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

Cluster Manager 전용으로 유지하던 독립 Helm 차트를 제거하고, ACKO(Aerospike CE Kubernetes Operator) 차트의 서브차트로 통합했다. 배포 경로를 단일화하여 운영 복잡도를 낮췄다.

## 주요 변경 사항

- 독립 Helm 차트 디렉터리 및 템플릿 제거
- 오퍼레이터 차트 내 서브차트로 통합
- 배포 문서 업데이트
- 불필요한 values.yaml 중복 제거

## 영향 범위

Helm 기반 독립 배포 경로가 제거되었다. 이후 Cluster Manager는 ACKO 오퍼레이터 차트를 통해서만 Kubernetes에 배포되며, 배포 및 업그레이드 관리가 단순화되었다.
