---
title: "PR #110: Seeds Finder & Template Topology"
description: Seeds finder services UI and template topology spread constraints
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, seeds-finder, topology, template, services]
last_updated: 2026-03-29
---

# PR #110: Seeds Finder & Template Topology

| 항목 | 내용 |
|------|------|
| **PR** | [#110](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/110) |
| **날짜** | 2026-03-13 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Seeds finder 서비스 UI와 템플릿 topology spread constraints 기능을 추가했다. Aerospike 클러스터의 seed 노드 탐색 서비스를 UI에서 관리할 수 있으며, 템플릿 수준에서 topology spread constraints를 설정할 수 있다.

## 주요 변경 사항

- Seeds finder 서비스 설정 UI 추가
- 템플릿 topology spread constraints 편집 기능
- 서비스 타입별 설정 지원 (LoadBalancer, NodePort 등)
- 템플릿에서 토폴로지 분산 전략 사전 정의

## 영향 범위

클러스터 discovery와 template 기반 topology를 관리하는 운영자가 영향을 받는다. Seeds Finder로 seed node discovery를 자동화하고, template의 `topologySpreadConstraints`를 여러 클러스터에 같은 방식으로 적용할 수 있다.
