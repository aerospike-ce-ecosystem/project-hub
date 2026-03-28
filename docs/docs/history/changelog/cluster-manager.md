---
title: Cluster Manager Changelog
description: Aerospike Cluster Manager UI 릴리스 변경 이력
sidebar_position: 3
scope: single-repo
repos:
  - cluster-manager
tags:
  - changelog
  - cluster-manager
  - fastapi
  - nextjs
  - ui
last_updated: 2026-03-29
---

# Cluster Manager Changelog

## Unreleased (latest)

### Features
- **Drop DaisyUI**: Complete UI overhaul removing DaisyUI, adopting pure Tailwind CSS 4 design system (PR #153)
- **OOM prevention**: Added memory usage monitoring and prevention mechanisms (PR #152)
- **Unified overview**: Merged Overview + Namespaces into single cluster overview page
- **Create Set / Sample Data**: Added Set creation flow and Sample Data button

### Bug Fixes
- **UI improvements**: Made cluster cards clickable, custom bin type dropdown, ARIA attributes (PR #154)
- **Sidebar fixes**: Improved sidebar browser position and tree toggle behavior
- **Mobile responsive**: Made unified overview responsive for mobile screens

### Documentation
- **README screenshots**: Updated screenshots to reflect current UI (PR #155)

---

Aerospike Cluster Manager 릴리스별 변경 사항을 기록합니다.

---

## v0.1.0

> Initial release

### 주요 변경 사항

- **Dashboard**: 실시간 TPS 차트를 포함한 클러스터 대시보드
- **Namespace/Set 브라우저**: 네임스페이스 및 셋 탐색 UI
- **Record 브라우저**: 페이지네이션 지원 레코드 탐색기
- **Query Builder**: 시각적 쿼리 빌더
- **AQL Terminal**: 웹 기반 AQL 터미널
- **Index 관리**: Secondary Index 생성/삭제 UI
- **User/Role 관리**: 사용자 및 역할 관리 인터페이스
- **UDF 관리**: User-Defined Function 등록/조회/삭제 UI
- **ACKO K8s 클러스터 관리 통합**: ACKO 연동을 통한 Kubernetes 클러스터 관리 기능
