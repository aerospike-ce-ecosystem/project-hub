---
title: "PR #108: Topology Constraints & Pod Security"
description: Topology spread constraints UI and pod security context configuration
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, topology, security, pod, kubernetes]
last_updated: 2026-03-29
---

# PR #108: Topology Constraints & Pod Security

| 항목 | 내용 |
|------|------|
| **PR** | [#108](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/108) |
| **날짜** | 2026-03-13 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Topology spread constraints 설정 UI와 Pod security context 설정 기능을 추가했다. Kubernetes의 토폴로지 분산 제약 조건을 UI에서 직접 설정할 수 있으며, Pod 수준의 보안 컨텍스트를 편집할 수 있다.

## 주요 변경 사항

- Topology spread constraints 설정 UI 추가
- Pod security context 편집 기능 구현
- maxSkew, topologyKey, whenUnsatisfiable 등 주요 필드 지원
- runAsUser, runAsGroup, fsGroup 등 보안 컨텍스트 필드 편집

## 영향 범위

Kubernetes 클러스터에서 Aerospike Pod의 분산 배치와 보안 설정을 관리하는 운영자에게 영향. 노드 장애 시 가용성을 높이기 위한 토폴로지 분산 전략을 UI에서 직관적으로 설정할 수 있다. Pod security context를 통해 컨테이너 보안 정책을 준수할 수 있다.
