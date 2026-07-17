---
title: "ADR-0014: SQLite에서 PostgreSQL로 마이그레이션"
description: cluster-manager의 데이터베이스를 SQLite에서 PostgreSQL(asyncpg)로 마이그레이션하고, SQLite를 개발용 fallback으로 유지한 아키텍처 결정 기록.
sidebar_position: 14
scope: single-repo
repos: [cluster-manager]
tags: [adr, cluster-manager, postgresql, sqlite, database, asyncpg, scalability]
last_updated: 2026-03-29
---

# ADR-0014: SQLite에서 PostgreSQL로 마이그레이션

## 상태

**Accepted**

- 제안일: 2026-02-10
- 승인일: 2026-02-18

## 맥락 (Context)

Aerospike Cluster Manager는 cluster metadata, 사용자 설정, audit log를 SQLite에 저장해 왔습니다. 초기의 단일 사용자 환경에는 적합했지만, 사용 범위가 넓어지면서 다음 한계가 드러났습니다.

- **동시 쓰기 제한**: SQLite의 WAL mode에서도 writer lock이 경합하면 동시 쓰기 성능이 낮아집니다.
- **수평 확장 불가**: File 기반 DB이므로 여러 instance가 같은 DB를 공유할 수 없습니다.
- **비동기 지원 미흡**: Python의 `aiosqlite`는 내부에서 thread pool을 사용하므로 native async I/O를 제공하지 않습니다.
- **운영 기능 부족**: Production에 필요한 data integrity, backup, replication 기능이 제한적입니다.

다중 사용자가 동시에 클러스터를 관리하는 시나리오에서 SQLite의 한계가 사용자 경험에 직접적인 영향을 미치고 있었습니다.

## 결정 (Decision)

> **프로덕션 데이터베이스를 PostgreSQL(asyncpg)로 마이그레이션하되, SQLite를 개발 및 단일 사용자 fallback으로 유지한다.**

### 구현 세부사항

- **DB Backend 추상화**: `DatabaseBackend` protocol을 정의해 두 backend를 지원합니다.
- **asyncpg 드라이버**: PostgreSQL 연결에는 native async driver를 사용합니다.
- **환경 변수 전환**: `DATABASE_URL` 값에 따라 backend를 자동으로 선택합니다.
  - `postgresql://...` -> PostgreSQL (asyncpg)
  - `sqlite:///...` 또는 미설정 -> SQLite (aiosqlite)
- **마이그레이션 도구**: Alembic으로 schema version을 관리하며 두 dialect를 모두 지원합니다.

## 대안 검토 (Alternatives Considered)

### 대안 1: SQLite 유지 + 읽기 복제

- **설명**: Litestream 등으로 SQLite 파일을 S3에 복제
- **장점**: 기존 코드 변경 최소화, 운영 단순
- **단점**: 동시 쓰기 문제 미해결, 다중 인스턴스 불가
- **미선택 사유**: 핵심 문제인 동시 쓰기 성능을 해결하지 못함

### 대안 2: PostgreSQL 전면 전환 (SQLite 제거)

- **설명**: SQLite 지원을 완전히 제거하고 PostgreSQL만 지원
- **장점**: 단일 backend로 유지보수 단순화
- **단점**: 로컬 개발 환경에서 PostgreSQL 설치 필수, 진입 장벽 상승
- **미선택 사유**: 개발자 경험과 빠른 프로토타이핑을 위해 SQLite fallback 유지 필요

## 결과 (Consequences)

### 긍정적 결과

- **동시성 향상**: PostgreSQL의 MVCC로 다수 사용자 동시 접근 시 성능 대폭 개선
- **수평 확장**: 다중 cluster-manager 인스턴스가 동일 DB 공유 가능
- **진정한 비동기**: asyncpg의 네이티브 비동기 I/O로 이벤트 루프 블로킹 제거
- **운영 성숙도**: PITR 백업, 복제, 모니터링 등 PostgreSQL 에코시스템 활용

### 부정적 결과 / 트레이드오프

- **운영 복잡성 증가**: PostgreSQL 인스턴스 관리, 연결 풀링, 모니터링 필요
- **Dual-backend 유지비용**: 두 가지 SQL dialect에 대한 테스트 및 호환성 유지
- **배포 의존성**: 프로덕션 배포 시 PostgreSQL 인프라 사전 준비 필요

### 리스크

- Dual-backend dispatcher에서의 SQL dialect 차이로 인한 미묘한 동작 불일치
- asyncpg 연결 풀 고갈 시 서비스 성능 저하 (적절한 풀 사이즈 튜닝 필요)

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `cluster-manager` | DB backend 추상화, asyncpg 통합, Alembic 마이그레이션 |
| `plugins` | cluster-manager 배포 Skill에 PostgreSQL 설정 가이드 추가 |

## 참고 자료

- [asyncpg 공식 문서](https://magicstack.github.io/asyncpg/)
- [Alembic 마이그레이션 도구](https://alembic.sqlalchemy.org/)
