---
title: "PR #197: E2E Deploy and Test Synchronization"
description: E2E 테스트 배포 동기화 문제 수정 및 Podman 호환성 개선
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [test, e2e, ci]
last_updated: 2026-03-29
---

# PR #197: E2E Deploy and Test Synchronization

| 항목 | 내용 |
|------|------|
| **PR** | [#197](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/197) |
| **날짜** | 2026-03-25 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

E2E 테스트에서 배포 동기화 문제를 수정하고, Podman 호환성을 위한 테스트 안정성을 개선했다. 상태 race condition으로 인한 간헐적 테스트 실패를 해결했다.

## 주요 변경 사항

- E2E 테스트 배포 동기화 문제 수정
- Podman 호환성을 위한 테스트 안정성 개선
- E2E 테스트의 상태 race condition 해결

## 영향 범위

ACKO E2E 테스트 인프라에 영향. 배포-테스트 간 동기화가 안정화되어 CI 파이프라인에서의 간헐적 실패가 감소한다. Podman 기반 환경에서의 테스트 신뢰성이 향상된다.
