---
title: "PR #195: E2E Monitoring Sample and Test Improvements"
description: E2E 테스트용 모니터링 샘플 설정 추가 및 테스트 안정성 개선
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [test, e2e, monitoring]
last_updated: 2026-03-29
---

# PR #195: E2E Monitoring Sample and Test Improvements

| 항목 | 내용 |
|------|------|
| **PR** | [#195](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/195) |
| **날짜** | 2026-03-25 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

E2E 테스트에 모니터링 샘플 설정을 추가하고, flaky 테스트의 timeout 및 retry를 개선했다. Podman 환경에서의 이미지 로딩 문제도 함께 수정했다.

## 주요 변경 사항

- E2E 테스트용 모니터링 샘플 설정 추가
- Flaky E2E 테스트의 timeout 및 retry 로직 개선
- Podman 환경에서의 이미지 로딩 문제 수정

## 영향 범위

ACKO E2E 테스트 인프라에 영향. 모니터링 관련 테스트 커버리지가 확대되고, Podman 호환성이 개선되어 CI 파이프라인의 안정성이 향상된다.
