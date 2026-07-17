---
title: "PR #153: Drop DaisyUI and UI Overhaul"
description: Complete UI redesign dropping DaisyUI in favor of pure Tailwind CSS 4 design system
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

DaisyUI dependency를 제거하고 Tailwind CSS 4 기반 custom design system으로 바꿨다. 전체 UI에 같은 design token과 component pattern을 적용했다.

## 주요 변경 사항

- DaisyUI 완전 제거 및 Tailwind CSS 4로의 전환
- 커스텀 디자인 토큰 시스템 구축 (컬러, 스페이싱, 타이포그래피)
- 모든 UI 컴포넌트 재설계
- 다크 모드 지원 개선
- 번들 사이즈 감소

## 영향 범위

Cluster Manager의 모든 UI가 영향을 받는다. DaisyUI class에 의존하던 custom style은 새 design system으로 migration해야 하며, PR #152의 high-contrast color system도 함께 적용된다.
