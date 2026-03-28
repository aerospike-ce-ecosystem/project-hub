---
title: "PR #193: conn_pools_per_node 설정 공개 및 에러 핸들링 문서 확장"
description: 노드당 커넥션 풀 수를 설정 가능하도록 공개하고 에러 핸들링 문서를 확장
sidebar_position: 21
scope: single-repo
repos: [aerospike-py]
tags: [feat, config, connection-pool, error-handling, docs]
last_updated: 2026-03-29
---

# PR #193: feat: expose conn_pools_per_node config and expand error handling docs

| 항목 | 내용 |
|------|------|
| **PR** | [#193](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/193) |
| **날짜** | 2026-03-09 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

노드당 커넥션 풀 수(`conn_pools_per_node`)를 사용자가 직접 설정할 수 있도록 공개하고, 에러 핸들링에 대한 문서를 확장했다. 고부하 환경에서 커넥션 풀 튜닝이 가능해지고, 다양한 에러 시나리오에 대한 가이드를 제공한다.

## 주요 변경 사항

- `conn_pools_per_node` 설정을 ClientPolicy에 노출하여 사용자 설정 가능
- 에러 핸들링 문서 확장: 주요 exception 타입별 대응 가이드
- 커넥션 풀 관련 설정의 기본값 및 권장값 문서화

## 영향 범위

고성능 워크로드에서 커넥션 풀 수를 조정하여 처리량을 최적화할 수 있다. 기본값은 기존과 동일하므로 하위 호환성에는 영향이 없다. 에러 핸들링 문서 확장으로 사용자가 RecordNotFound, BackpressureError 등의 exception을 적절히 처리하는 데 도움이 된다.
