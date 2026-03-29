---
title: "PR #218: aerospike-core alpha.10 업그레이드 및 노드 검색 리팩토링"
description: aerospike-client-rust v2 alpha.10으로 업그레이드하고 노드 검색 로직을 리팩토링
scope: single-repo
repos: [aerospike-py]
tags: [chore, upgrade, aerospike-core, refactor]
last_updated: 2026-03-29
---

# PR #218: chore: upgrade aerospike-core alpha.9 → alpha.10 + sync node lookup refactor

| 항목 | 내용 |
|------|------|
| **PR** | [#218](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/218) |
| **날짜** | 2026-03-17 |
| **작성자** | ksr |
| **카테고리** | chore |

## 변경 요약

aerospike-client-rust(aerospike-core) 의존성을 alpha.9에서 alpha.10으로 업그레이드하고, 동기(sync) 클라이언트의 노드 검색 로직을 리팩토링했다. alpha.10에서 변경된 내부 API에 맞춰 노드 검색 경로를 정리하여 코드 가독성과 유지보수성을 개선했다.

## 주요 변경 사항

- aerospike-client-rust v2 alpha.9 → alpha.10 의존성 업그레이드
- sync 클라이언트의 노드 검색(node lookup) 로직 리팩토링
- alpha.10의 변경된 내부 API에 맞춘 호출 경로 업데이트
- 불필요한 중간 추상화 제거로 코드 단순화

## 영향 범위

사용자 대면 API에는 변경이 없는 내부 리팩토링이다. aerospike-core alpha.10의 버그 수정 및 성능 개선 사항이 aerospike-py에 반영된다. 동기 클라이언트의 노드 검색 경로가 단순화되어 향후 유지보수가 용이해졌다.
