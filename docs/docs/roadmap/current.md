---
title: 현재 분기 목표 (2026-Q2)
description: Aerospike CE Ecosystem 2026년 2분기 개발 목표 및 우선순위
sidebar_position: 1
scope: ecosystem
repos:
  - aerospike-py
  - acko
  - cluster-manager
  - plugins
tags:
  - roadmap
  - q2-2026
  - goals
  - planning
last_updated: 2026-03-29
---

# 2026-Q2 목표

2026년 2분기(4월~6월) Aerospike CE Ecosystem 각 프로젝트별 개발 목표입니다.

---

## aerospike-py

| 목표 | 설명 |
|------|------|
| batch_write retry 구현 | `batch_write(..., retry=N)` 옵션으로 client side에서 실패 제어 |
| NumPy batch 연산 안정화 | `batch_read_numpy`, `batch_write_numpy` 스펙 안정화 및 엣지 케이스 해결 |
| OpenTelemetry tracing 통합 | Distributed tracing 연동으로 Observability 강화 |

---

## ACKO

| 목표 | 설명 |
|------|------|
| E2E 테스트 확장 | Scale, rolling update, ACL 등 운영 시나리오 Kind 기반 E2E 테스트 추가 |
| Helm chart 버전 관리 체계화 | 릴리스 프로세스 정립 및 chart 버전 관리 자동화 |

---

## cluster-manager

| 목표 | 설명 |
|------|------|
| Record 브라우저 대용량 데이터 성능 최적화 | Scan/query 시 limit, pagination, timeout 제어로 대용량 데이터셋 안정성 확보 |
| ACKO 클러스터 생성 Wizard UX 개선 | Wizard 기반 생성 흐름의 편의성 및 UX 개선 |

---

## plugins

| 목표 | 설명 |
|------|------|
| Skills 최신 API 반영 | aerospike-py API 변경, ACKO CRD 변경 등 최신 사항 반영 |
| acko-cluster-debugger 정확도 개선 | 실제 트러블슈팅 시나리오에서의 디버깅 정확도 향상 |
