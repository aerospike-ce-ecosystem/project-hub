---
title: "PR #105: Template Sync & Operations"
description: Template sync status tracking, operation progress display, and storage improvements
sidebar_position: 15
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, template, sync, operations, storage]
last_updated: 2026-03-29
---

# PR #105: Template Sync & Operations

| 항목 | 내용 |
|------|------|
| **PR** | [#105](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/105) |
| **날짜** | 2026-03-10 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

템플릿 동기화 상태 추적, 오퍼레이션 진행률 표시, 스토리지 개선을 포함하는 변경이다. 클러스터 템플릿의 sync 상태를 실시간으로 확인할 수 있고, 진행 중인 오퍼레이션의 진행률을 시각적으로 표시한다.

## 주요 변경 사항

- 템플릿 동기화 상태 추적 UI 추가
- 오퍼레이션 진행률 표시 기능 구현
- 스토리지 관련 설정 및 표시 개선
- sync 상태 변화에 따른 실시간 업데이트

## 영향 범위

Cluster Manager에서 템플릿 기반으로 클러스터를 관리하는 사용자에게 영향. 동기화 상태를 한눈에 파악할 수 있어 템플릿과 실제 클러스터 간의 차이를 빠르게 감지할 수 있다. 오퍼레이션 진행률 표시로 장시간 작업의 상태를 명확히 확인할 수 있다.
