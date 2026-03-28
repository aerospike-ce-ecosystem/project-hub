---
title: "PR #114: info_all() and info_random_node()"
description: Added admin info commands info_all() and info_random_node() to Client and AsyncClient
sidebar_position: 8
scope: single-repo
repos: [aerospike-py]
tags: [feat, admin, info, api]
last_updated: 2026-03-29
---

# PR #114: info_all() and info_random_node()

| 항목 | 내용 |
|------|------|
| **PR** | [#114](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/114) |
| **날짜** | 2026-02-15 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Client와 AsyncClient에 `info_all()`과 `info_random_node()` 관리 명령을 추가하여 Aerospike 서버의 상태 정보를 조회할 수 있게 했다. 클러스터의 모든 노드 또는 임의의 단일 노드에 info 명령을 실행할 수 있다.

## 주요 변경 사항

- `info_all(command)`: 클러스터 내 모든 노드에 info 명령 실행
- `info_random_node(command)`: 임의의 노드 하나에 info 명령 실행
- Client와 AsyncClient 양쪽 모두 지원
- 반환 타입에 NamedTuple 패턴 적용

## 영향 범위

Aerospike 클러스터 관리 도구 개발에 영향. Cluster Manager 등의 관리 UI에서 클러스터 상태 모니터링에 활용 가능. 기존에 별도 info 클라이언트가 필요했던 관리 작업을 aerospike-py 내에서 직접 수행할 수 있게 된다.
