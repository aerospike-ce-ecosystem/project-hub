---
title: 공유 라벨 정의
description: 생태계 전체에서 사용하는 GitHub 라벨 체계 및 정의
sidebar_position: 1
scope: ecosystem
repos:
  - aerospike-py
  - aerospike-ce-kubernetes-operator
  - aerospike-cluster-manager
  - aerospike-ce-ecosystem-plugins
  - project-hub
tags:
  - labels
  - coordination
  - workflow
last_updated: 2026-03-29
---

# 공유 라벨 정의

생태계 전체에서 일관된 라벨 체계를 사용합니다. 라벨은 두 가지 그룹으로 나뉩니다: 4개 핵심 레포에서 공통으로 사용하는 **Agentic Workflow 라벨**과 project-hub 전용 **Hub 라벨**입니다.

## Agentic Workflow 라벨

4개 핵심 레포(aerospike-py, ACKO, cluster-manager, plugins)에서 공통으로 사용하는 라벨입니다. GitHub Agentic Workflow 파이프라인의 상태 전이를 제어합니다.

| Label | Color | Description |
|-------|-------|-------------|
| `agent` | `#0E8A16` | AI agent processing -- 이슈를 에이전트에게 할당 |
| `plan-complete` | `#1D76DB` | Plan 완료, Implementation 트리거 |
| `in-progress` | `#FBCA04` | 에이전트 구현 진행 중 |
| `needs-review` | `#E4E669` | PR 리뷰 워크플로우 트리거 |
| `review-complete` | `#0E8A16` | 리뷰 완료 |
| `needs-clarification` | `#D93F0B` | 이슈 보완 필요 |

### 라벨 상태 흐름

```
agent → plan-complete → in-progress → needs-review → review-complete
                                           ↓
                                   needs-clarification
```

## Hub 라벨

project-hub 레포 전용 라벨입니다. 크로스-레포 이슈 관리와 프로젝트 조율에 사용합니다.

| Label | Color | Description |
|-------|-------|-------------|
| `cross-repo` | `#5319E7` | 여러 레포에 걸친 이슈 |
| `epic` | `#B60205` | Epic/이니셔티브 |
| `adr` | `#006B75` | Architecture Decision Record |
| `roadmap` | `#0075CA` | 로드맵 항목 |
| `discussion` | `#D4C5F9` | 논의 필요 |

## 라벨 적용 규칙

1. **단일 레포 이슈**: 해당 레포에서 Agentic Workflow 라벨만 사용
2. **크로스-레포 이슈**: project-hub에서 Hub 라벨 + 서브-레포 이슈 링크
3. **Epic**: `epic` 라벨과 함께 하위 이슈를 `org/repo#number` 형식으로 링크
4. **ADR**: `adr` + `discussion` 라벨을 함께 사용하여 논의 유도
