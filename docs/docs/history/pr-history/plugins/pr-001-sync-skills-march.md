---
title: "PR #1: Sync Skills (March 2026)"
description: Updated all 5 skills with latest project changes and added BatchRecords documentation
sidebar_position: 1
scope: single-repo
repos: [aerospike-ce-ecosystem-plugins]
tags: [feat, skills, documentation, sync]
last_updated: 2026-03-29
---

# PR #1: Sync Skills (March 2026)

| 항목 | 내용 |
|------|------|
| **PR** | [#1](https://github.com/aerospike-ce-ecosystem/aerospike-ce-ecosystem-plugins/pull/1) |
| **날짜** | 2026-03-26 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

에코시스템 플러그인의 모든 5개 스킬을 최신 프로젝트 변경 사항에 맞춰 동기화했다. aerospike-py의 BatchRecords API 통합, ACKO의 새로운 CRD 필드, Cluster Manager의 UI 변경 등을 반영한 문서와 예제를 업데이트했다.

## 주요 변경 사항

- aerospike-py-api 스킬: BatchRecords 통합 API, NamedTuple 패턴, backpressure 문서 추가
- aerospike-py-fastapi 스킬: BackpressureError 처리, 글로벌 예외 핸들러 패턴 업데이트
- acko-deploy 스킬: priorityClassName, migrationStatus 필드 반영
- acko-operations 스킬: 마이그레이션 인식 재시작, Secret watch 절차 추가
- acko-config-reference 스킬: CE 8.1 최신 파라미터 동기화

## 영향 범위

Claude Code에서 Aerospike CE 에코시스템 관련 작업을 수행하는 모든 사용자에게 영향. 스킬이 최신 API와 운영 절차를 반영하므로, 더 정확한 코드 생성과 가이드를 받을 수 있다. 모든 에코시스템 리포지토리의 최근 변경을 반영한 크로스레포 동기화이다.
