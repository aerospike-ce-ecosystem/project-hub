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

롤링 재시작, 스케일 다운, ACL 동기화 과정의 안정성을 보완했다. 마이그레이션이 진행 중일 때 Pod 재시작을 차단하고, reconciliation 중 기존 status 필드를 보존하며, ACL 동기화의 race condition을 수정했다.

## 주요 변경 사항

- 데이터 손실 방지: 스케일다운 시 마이그레이션 완료 확인 필수화
- Status 필드 보존: reconcile 중 기존 상태 정보 유실 방지
- 마이그레이션 인식 재시작: 활성 마이그레이션 중 Pod 재시작 차단
- ACL 동기화 안정성: 동시 접근 시 레이스 컨디션 수정
- 롤링 재시작 순서 최적화

## 영향 범위

스케일 다운이나 롤링 업그레이드를 수행하는 ACKO 클러스터에 적용된다. 오퍼레이터는 마이그레이션 완료를 확인한 뒤 다음 Pod를 재시작하고, 스케일 다운 전에도 같은 조건을 확인한다. 이 PR은 PR #160(오퍼레이터 복원력)과 PR #164(데이터 안전성)의 후속 작업이다.
