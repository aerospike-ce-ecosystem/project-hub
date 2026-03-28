---
title: "PR #153: Drop DaisyUI and UI Overhaul"
description: Complete UI redesign dropping DaisyUI in favor of pure Tailwind CSS 4 design system
sidebar_position: 15
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, ui, tailwind, design-system]
last_updated: 2026-03-29
---

# PR #153: Drop DaisyUI and UI Overhaul

| 항목 | 내용 |
|------|------|
| **PR** | [#153](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/153) |
| **날짜** | 2026-03-28 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

DaisyUI 의존성을 제거하고 순수 Tailwind CSS 4 기반의 커스텀 디자인 시스템으로 전면 교체했다. UI 전체를 재설계하여 일관된 시각적 스타일과 더 나은 사용자 경험을 제공한다.

## 주요 변경 사항

- DaisyUI 완전 제거 및 Tailwind CSS 4로의 전환
- 커스텀 디자인 토큰 시스템 구축 (컬러, 스페이싱, 타이포그래피)
- 모든 UI 컴포넌트 재설계
- 다크 모드 지원 개선
- 번들 사이즈 감소

## 영향 범위

Cluster Manager의 모든 UI에 영향을 미치는 전면적 변경. 시각적으로 완전히 새로운 인터페이스를 제공하며, DaisyUI에 의존하던 커스텀 스타일링은 새로운 디자인 시스템으로 마이그레이션되었다. PR #152의 하이콘트라스트 컬러 시스템과 함께 적용된다.
