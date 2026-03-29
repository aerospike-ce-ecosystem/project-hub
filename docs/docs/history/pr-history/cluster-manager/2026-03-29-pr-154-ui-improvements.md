---
title: "PR #154: UI Improvements for Overview, Record Form, and Cluster List"
description: Overview, Record Form, Cluster List 등 여러 UI 컴포넌트의 사용성 및 접근성 개선
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [fix, ui, ux]
last_updated: 2026-03-29
---

# PR #154: UI Improvements for Overview, Record Form, and Cluster List

| 항목 | 내용 |
|------|------|
| **PR** | [#154](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/154) |
| **날짜** | 2026-03-29 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

Overview, Record Form, Cluster List 등 여러 UI 영역의 사용성과 접근성을 개선했다. 클러스터 카드 전체를 클릭 가능하게 변경하고, bin 타입 선택기를 커스텀 드롭다운으로 교체하며, 키보드 내비게이션과 ARIA 속성을 추가했다.

## 주요 변경 사항

- 클러스터 카드 전체를 클릭 가능하도록 변경
- Bin 타입 선택기를 네이티브 select에서 커스텀 드롭다운으로 교체 (BinTypeSelect)
- Set name 편집을 Create Set 플로우에서만 가능하도록 제한
- Sample Data 버튼 복원
- TYPE 컬럼 너비 고정
- BinTypeSelect에 키보드 내비게이션 및 ARIA 속성 추가
- Prettier 포매팅 적용

## 영향 범위

Cluster Manager의 Overview, Record Form, Cluster List 화면에 영향을 미치는 UI/UX 개선. DaisyUI 제거 이후 새로운 디자인 시스템에 맞춰 사용성과 접근성을 보완하는 후속 작업이다.
