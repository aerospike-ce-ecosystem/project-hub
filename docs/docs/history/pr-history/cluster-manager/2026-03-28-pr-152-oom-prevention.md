---
title: "PR #152: OOM Prevention"
description: Prevent OOM on large set browsing with server-side max_records limit and high-contrast color system
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [fix, oom, performance, ui]
last_updated: 2026-03-29
---

# PR #152: OOM Prevention

| 항목 | 내용 |
|------|------|
| **PR** | [#152](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/152) |
| **날짜** | 2026-03-28 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

대용량 set 브라우징 시 발생하던 OOM(Out of Memory) 문제를 수정했다. 서버 사이드에서 `max_records` 제한을 적용하여 한 번에 반환되는 레코드 수를 제어하고, 하이콘트라스트 컬러 시스템을 추가하여 데이터 가시성을 개선했다.

## 주요 변경 사항

- 서버 사이드 `max_records` 제한 적용 (기본값: 1,000)
- 프론트엔드 가상 스크롤링(virtual scrolling) 적용
- 하이콘트라스트 컬러 시스템 도입
- 대용량 데이터 브라우징 시 메모리 사용량 안정화

## 영향 범위

수백만 건 이상의 레코드를 가진 set을 브라우징하는 사용자에게 직접적 영향. 이전에는 브라우저가 OOM으로 크래시했던 시나리오가 안정적으로 동작한다. 하이콘트라스트 컬러 시스템은 접근성(accessibility)도 개선한다.
