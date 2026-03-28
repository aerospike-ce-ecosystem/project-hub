---
title: "PR #176: Helm Chart UI Config Improvements"
description: Helm chart에 UI 관련 세부 설정 추가 (DB pool, timeout, logging, metrics)
sidebar_position: 13
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

Helm chart의 UI 관련 설정을 대폭 개선하여 DB connection pool, timeout, logging, metrics 등 세부 항목을 values.yaml에서 직접 구성할 수 있게 했다. 운영 환경에서 UI 컴포넌트의 튜닝이 용이해진다.

## 주요 변경 사항

- DB connection pool 설정 추가 (max connections, idle timeout, max lifetime)
- HTTP/gRPC timeout 설정을 values.yaml에서 구성 가능하도록 변경
- Logging level 및 format 설정 추가
- Metrics endpoint 설정 및 Prometheus scrape annotation 지원
- 기존 설정과의 하위 호환성 유지

## 영향 범위

Helm chart로 ACKO를 배포하는 환경에서 UI 컴포넌트의 세부 튜닝이 가능해진다. 특히 프로덕션 환경에서 DB pool 크기 조정, timeout 최적화, 로그 레벨 변경을 Helm values만으로 처리할 수 있다.
