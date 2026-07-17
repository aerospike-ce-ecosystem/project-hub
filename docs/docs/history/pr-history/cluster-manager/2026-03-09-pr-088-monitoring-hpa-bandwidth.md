---
title: "PR #088: Monitoring, HPA, Bandwidth, Node Block List"
description: HPA CRUD, Prometheus exporter 설정, 대역폭 모니터링, 노드 블록 리스트 기능 추가
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, monitoring, hpa, prometheus, kubernetes]
last_updated: 2026-03-29
---

# PR #088: Monitoring, HPA, Bandwidth, Node Block List

| 항목 | 내용 |
|------|------|
| **PR** | [#088](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/88) |
| **날짜** | 2026-03-09 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

Kubernetes 운영에 필요한 HPA CRUD, Prometheus exporter configuration, bandwidth monitoring, node blocklist 관리 기능을 추가했다.

## 주요 변경 사항

- HPA CRUD (생성/조회/수정/삭제) 전체 구현
- Prometheus exporter 설정 UI 및 백엔드
- 네트워크 대역폭 모니터링 위젯
- 노드 블록 리스트(block list) 관리 기능
- 오토스케일링 정책 시각화

## 영향 범위

Kubernetes 운영자는 HPA로 workload를 자동 scale하고, exporter metric과 bandwidth를 확인하며, blocklist로 특정 node를 관리할 수 있다.
