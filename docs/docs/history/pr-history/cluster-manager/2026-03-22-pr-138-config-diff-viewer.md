---
title: "PR #138: Config Diff Viewer"
description: Added side-by-side config diff viewer and event export functionality
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, config, diff, events, export]
last_updated: 2026-03-29
---

# PR #138: Config Diff Viewer

| 항목 | 내용 |
|------|------|
| **PR** | [#138](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/138) |
| **날짜** | 2026-03-22 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

클러스터 설정 변경 사항을 나란히(side-by-side) 비교할 수 있는 diff 뷰어와 이벤트 내보내기 기능을 추가했다. 설정 변경 전후를 시각적으로 비교하여 의도치 않은 변경을 사전에 확인할 수 있다.

## 주요 변경 사항

- Side-by-side 설정 diff 뷰어 UI 구현
- 변경된 라인 하이라이팅 및 차이점 요약
- 이벤트 타임라인 데이터 JSON/CSV 내보내기
- 설정 히스토리 조회 및 버전 간 비교

## 영향 범위

클러스터 설정을 자주 변경하는 운영 환경에 영향. PR #086의 config drift 감지 기능과 함께 사용하면 설정 변경의 전체 라이프사이클을 관리할 수 있다. 이벤트 내보내기를 통해 외부 감사(audit) 시스템과 통합 가능.
