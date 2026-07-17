---
title: "PR #137: Rack Config & Node Blocklist"
description: Rack config editing and node blocklist picker in edit dialog
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, rack, blocklist, node, edit-dialog]
last_updated: 2026-03-29
---

# PR #137: Rack Config & Node Blocklist

| 항목 | 내용 |
|------|------|
| **PR** | [#137](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/137) |
| **날짜** | 2026-03-22 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Rack 설정 편집과 노드 blocklist picker를 edit dialog에 추가했다. Aerospike의 rack-aware 설정을 UI에서 편집할 수 있으며, 특정 노드를 blocklist에 추가하여 데이터 분산을 제어할 수 있다.

## 주요 변경 사항

- Rack 설정 편집 UI 추가 (rack ID, namespace 매핑)
- 노드 blocklist picker 컴포넌트 구현
- Edit dialog에 rack config 섹션 통합
- Blocklist 변경 시 영향 범위 사전 표시

## 영향 범위

Rack-aware data distribution과 node 관리를 담당하는 운영자가 영향을 받는다. Rack 설정으로 replica를 서로 다른 rack에 분산하고, node blocklist로 유지보수 중이거나 문제가 있는 node를 대상에서 제외할 수 있다.
