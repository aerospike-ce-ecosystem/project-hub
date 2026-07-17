---
title: "PR #058: Migrate SQLite to PostgreSQL (asyncpg)"
description: SQLite를 PostgreSQL로 교체하고 asyncpg connection pool 기반의 비동기 database layer를 도입한 변경
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [refactor, database, postgresql, asyncpg, migration]
last_updated: 2026-03-29
---

# PR #058: Migrate SQLite to PostgreSQL (asyncpg)

| 항목 | 내용 |
|------|------|
| **PR** | [#058](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/58) |
| **날짜** | 2026-02-26 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

기존 SQLite data store를 PostgreSQL로 옮겼다. `asyncpg` connection pool을 사용해 여러 request가 database connection을 효율적으로 공유하도록 했다.

## 주요 변경 사항

- SQLite 의존성 제거 및 PostgreSQL(asyncpg) 도입
- asyncpg 커넥션 풀 설정 및 수명 주기 관리
- 전체 데이터 모델의 PostgreSQL 스키마 마이그레이션
- 쿼리문을 PostgreSQL 문법으로 변환
- 데이터베이스 초기화 및 마이그레이션 스크립트 추가
- 환경 변수 기반 DB 접속 설정

## 영향 범위

이후 모든 Backend 기능은 PostgreSQL을 사용한다. 따라서 production deployment에는 PostgreSQL instance가 필요하며, 기존 SQLite data를 옮기는 migration 절차도 필요하다.
