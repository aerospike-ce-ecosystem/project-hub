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

E2E 테스트가 배포 상태를 확인하기 전에 검증을 시작해 간헐적으로 실패하던 동기화 문제를 수정했다. Podman에서도 같은 테스트 흐름이 일관되게 동작하도록 호환성을 보완했다.

## 주요 변경 사항

- E2E 테스트 배포 동기화 문제 수정
- Podman 호환성을 위한 테스트 안정성 개선
- E2E 테스트의 상태 race condition 해결

## 영향 범위

변경 범위는 ACKO E2E 테스트 인프라다. CI와 Podman 기반 로컬 환경에서 배포 완료 전 검증으로 발생하던 간헐적 실패를 줄인다.
