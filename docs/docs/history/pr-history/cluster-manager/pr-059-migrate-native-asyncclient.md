---
title: "PR #059: Migrate Backend to Native AsyncClient"
description: Sync Client + asyncio.to_thread 방식에서 네이티브 AsyncClient로 전환하여 2.2-2.4배 처리량 향상
sidebar_position: 3
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [refactor, async, performance, backend]
last_updated: 2026-03-29
---

# PR #059: Migrate Backend to Native AsyncClient

| 항목 | 내용 |
|------|------|
| **PR** | [#059](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/59) |
| **날짜** | 2026-02-27 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

기존에 동기 클라이언트를 `asyncio.to_thread`로 감싸서 사용하던 방식을 네이티브 AsyncClient로 전면 교체했다. 스레드 전환 오버헤드가 제거되면서 처리량이 2.2-2.4배 향상되었다.

## 주요 변경 사항

- 동기 Client를 네이티브 AsyncClient로 교체
- asyncio.to_thread 래핑 코드 전면 제거
- 비동기 연결 수명 주기 관리 개선
- 모든 Aerospike 호출 경로를 await 기반으로 변환
- 벤치마크 결과: 요청 처리량 2.2-2.4배 개선

## 영향 범위

백엔드 전체의 Aerospike 통신 레이어가 변경되었다. PR #058의 PostgreSQL 마이그레이션과 함께 적용되어 데이터베이스와 Aerospike 양쪽 모두 완전한 비동기 아키텍처를 갖추게 되었다.
