---
title: "PR #202: METRIC_LABELS TOML Fix"
description: Fixed CrashLoopBackOff in Prometheus exporter due to unquoted TOML values in METRIC_LABELS
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [fix, prometheus, toml, monitoring]
last_updated: 2026-03-29
---

# PR #202: METRIC_LABELS TOML Fix

| 항목 | 내용 |
|------|------|
| **PR** | [#202](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/202) |
| **날짜** | 2026-03-25 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

Prometheus exporter가 CrashLoopBackOff에 빠지던 문제를 수정했다. 원인은 METRIC_LABELS 설정의 TOML 형식에서 값이 따옴표로 감싸지지 않아 파싱에 실패한 것이었다. 모니터링 샘플 YAML도 함께 수정했다.

## 주요 변경 사항

- METRIC_LABELS의 TOML 값에 올바른 따옴표 처리 적용
- Prometheus exporter의 설정 파싱 안정성 개선
- 모니터링 샘플 YAML 파일 수정
- exporter 컨테이너의 CrashLoopBackOff 문제 해결

## 영향 범위

ACKO로 배포된 Aerospike 클러스터에서 Prometheus 모니터링을 사용하는 모든 환경에 영향. 특히 커스텀 METRIC_LABELS를 설정한 경우 exporter가 정상적으로 시작되지 않던 문제가 해결된다.
