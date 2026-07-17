---
title: "PR #176: Helm Chart UI Config Improvements"
description: Helm chart에 UI 관련 세부 설정 추가 (DB pool, timeout, logging, metrics)
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feat, acko, helm, ui, config]
last_updated: 2026-03-29
---

# PR #176: Helm Chart UI Config Improvements

| 항목 | 내용 |
|------|------|
| **PR** | [#176](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/176) |
| **날짜** | 2026-03-13 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Helm chart에 UI의 DB connection pool, timeout, logging, metrics 설정을 추가했다. 배포 매니페스트를 직접 수정하지 않고 `values.yaml`에서 각 항목을 조정할 수 있다.

## 주요 변경 사항

- DB connection pool 설정 추가 (max connections, idle timeout, max lifetime)
- HTTP/gRPC timeout 설정을 values.yaml에서 구성 가능하도록 변경
- Logging level 및 format 설정 추가
- Metrics endpoint 설정 및 Prometheus scrape annotation 지원
- 기존 설정과의 하위 호환성 유지

## 영향 범위

Helm chart로 ACKO를 배포하는 환경에 적용된다. 운영자는 Helm values만으로 DB pool 크기와 timeout, 로그 레벨과 형식, Prometheus scrape 설정을 환경별로 구성할 수 있다.
