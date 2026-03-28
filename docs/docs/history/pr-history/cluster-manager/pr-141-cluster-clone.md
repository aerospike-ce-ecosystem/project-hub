---
title: "PR #141: Cluster Clone"
description: Added cluster clone functionality for duplicating cluster configurations
sidebar_position: 11
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, cluster, clone, operations]
last_updated: 2026-03-29
---

# PR #141: Cluster Clone

| 항목 | 내용 |
|------|------|
| **PR** | [#141](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/141) |
| **날짜** | 2026-03-22 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

기존 Aerospike 클러스터의 설정을 복제하여 새로운 클러스터를 생성하는 클론(clone) 기능을 추가했다. 테스트 환경 구축이나 동일 설정의 클러스터를 여러 개 배포할 때 유용하다.

## 주요 변경 사항

- 클러스터 클론 UI: 기존 클러스터 선택 후 원클릭 복제
- 클론 시 수정 가능한 필드 (이름, 네임스페이스, 레플리카 수 등)
- AerospikeCluster CR 기반의 클론 생성
- 클론 생성 전 설정 검증

## 영향 범위

ACKO 기반 클러스터를 관리하는 환경에서 운영 편의성 향상. 스테이징/테스트 환경 구축 시간을 단축하고, 동일 설정의 멀티 클러스터 배포를 간소화한다.
