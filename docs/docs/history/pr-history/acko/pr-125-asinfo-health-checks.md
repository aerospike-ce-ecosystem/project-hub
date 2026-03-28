---
title: "PR #125: asinfo-Based Health Checks"
description: "TCP 프로브를 asinfo 기반 헬스 체크로 교체하여 liveness는 asinfo build, readiness는 cluster_size로 검증"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feature, health-check, asinfo, liveness, readiness]
last_updated: 2026-03-29
---

# PR #125: asinfo-Based Health Checks

| 항목 | 내용 |
|------|------|
| **PR** | [#125](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/125) |
| **날짜** | 2026-03-02 |
| **작성자** | ksr |
| **카테고리** | feature |

## 변경 요약

기존 단순 TCP 소켓 프로브를 Aerospike 네이티브 `asinfo` 명령 기반 헬스 체크로 교체했다. Liveness probe는 `asinfo -v build`로 프로세스 정상 동작을 확인하고, readiness probe는 `asinfo -v cluster-size`로 클러스터 메시 조인 상태를 검증한다.

## 주요 변경 사항

- Liveness probe: TCP 소켓 체크 → `asinfo -v build` exec 프로브로 변경
- Readiness probe: TCP 소켓 체크 → `asinfo -v cluster-size` 기반 검증으로 변경
- 예상 클러스터 사이즈와 실제 사이즈 비교 로직 구현
- asinfo 바이너리 경로 및 타임아웃 설정 가능

## 영향 범위

TCP 포트가 열려 있지만 Aerospike 프로세스가 비정상인 상태(좀비 프로세스 등)를 정확히 감지할 수 있다. Readiness에서 클러스터 사이즈를 확인하므로, 메시 조인이 완료되지 않은 노드로의 트래픽 전달이 방지된다.
