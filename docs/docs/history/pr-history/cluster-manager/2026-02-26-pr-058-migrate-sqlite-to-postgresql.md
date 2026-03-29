---
title: "PR #058: Migrate SQLite to PostgreSQL (asyncpg)"
description: SQLite에서 PostgreSQL로 전면 마이그레이션, asyncpg 커넥션 풀 기반 비동기 데이터베이스 레이어 구축
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

기존 SQLite 기반의 데이터 저장소를 PostgreSQL로 전면 마이그레이션했다. asyncpg를 사용한 비동기 커넥션 풀을 도입하여 동시 접속 처리 능력을 크게 향상시켰다.

## 주요 변경 사항

- SQLite 의존성 제거 및 PostgreSQL(asyncpg) 도입
- asyncpg 커넥션 풀 설정 및 수명 주기 관리
- 전체 데이터 모델의 PostgreSQL 스키마 마이그레이션
- 쿼리문을 PostgreSQL 문법으로 변환
- 데이터베이스 초기화 및 마이그레이션 스크립트 추가
- 환경 변수 기반 DB 접속 설정

## 영향 범위

데이터 레이어의 근본적인 변경으로, 이후 모든 백엔드 기능이 PostgreSQL 위에서 동작한다. 운영 환경에서 PostgreSQL 인스턴스가 필수 요구사항이 되었으며, 동시성과 확장성이 크게 개선되었다.
