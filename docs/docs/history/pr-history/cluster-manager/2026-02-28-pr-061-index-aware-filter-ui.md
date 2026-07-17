---
title: "PR #061: Add Index-Aware Filter UI for Record Browser"
description: 레코드 브라우저에 인덱스 인식 칩 기반 필터 툴바와 표현식 필터 백엔드 추가
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, ui, filter, record-browser, expression]
last_updated: 2026-03-29
---

# PR #061: Add Index-Aware Filter UI for Record Browser

| 항목 | 내용 |
|------|------|
| **PR** | [#061](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/61) |
| **날짜** | 2026-02-28 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

레코드 브라우저에 칩(Chip) 기반의 필터 툴바를 추가하고, 백엔드에 Aerospike 표현식 필터(Expression Filter) 지원을 구현했다. 사용자가 세컨더리 인덱스를 인식하면서 직관적으로 레코드를 필터링할 수 있다.

## 주요 변경 사항

- 칩 기반 필터 UI 컴포넌트 구현
- 세컨더리 인덱스 메타데이터 조회 및 표시
- 표현식 필터(Expression Filter) 백엔드 엔드포인트
- 필터 조건 조합(AND/OR) 지원
- 인덱스 활용 여부에 따른 시각적 피드백

## 영향 범위

Record Browser가 secondary index를 인식하는 filter UI를 제공한다. 사용자는 많은 record 가운데 조건에 맞는 data를 조회하고 query가 사용할 index를 화면에서 확인할 수 있다.
