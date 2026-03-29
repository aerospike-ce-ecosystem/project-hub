---
title: "PR #183: Operator Stability Hardening"
description: "CRITICAL: Data loss prevention, status field preservation, migration-aware restarts during rolling restart, scale-down, and ACL sync"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [fix, stability, data-safety, rolling-restart, acl]
last_updated: 2026-03-29
---

# PR #183: Operator Stability Hardening

| 항목 | 내용 |
|------|------|
| **PR** | [#183](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/183) |
| **날짜** | 2026-03-18 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

ACKO 운영 안정성을 대폭 강화한 핵심 패치. 롤링 재시작, 스케일다운, ACL 동기화 과정에서 발생할 수 있던 데이터 손실 위험을 제거하고, status 필드 보존 및 마이그레이션 인식 재시작 메커니즘을 구현했다. 프로덕션 환경에서의 안전한 클러스터 운영을 보장하는 중요한 변경이다.

## 주요 변경 사항

- 데이터 손실 방지: 스케일다운 시 마이그레이션 완료 확인 필수화
- Status 필드 보존: reconcile 중 기존 상태 정보 유실 방지
- 마이그레이션 인식 재시작: 활성 마이그레이션 중 Pod 재시작 차단
- ACL 동기화 안정성: 동시 접근 시 레이스 컨디션 수정
- 롤링 재시작 순서 최적화

## 영향 범위

ACKO를 사용하는 모든 프로덕션 환경에 직접적 영향. 특히 스케일다운이나 롤링 업그레이드를 수행하는 클러스터에서 데이터 안전성이 크게 향상된다. 이 PR은 PR #160 (오퍼레이터 복원력)과 PR #164 (데이터 안전성)의 후속 강화 작업이다.
