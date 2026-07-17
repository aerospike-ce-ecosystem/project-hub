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

모든 repository에서 같은 의미로 label을 해석할 수 있도록 공통 체계를 사용합니다. label은 네 개 핵심 repository가 공유하는 **Agentic Workflow label**과 project-hub에서만 사용하는 **Hub label**로 나뉩니다.

## Agentic Workflow 라벨

네 개 핵심 repository(aerospike-py, ACKO, cluster-manager, plugins)가 공통으로 사용합니다. 각 label은 GitHub Agentic Workflow의 현재 상태와 다음 작업을 나타냅니다.

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

project-hub 전용 label입니다. cross-repo issue를 추적하고 여러 프로젝트의 작업을 조율할 때 사용합니다.

| Label | Color | Description |
|-------|-------|-------------|
| `cross-repo` | `#5319E7` | 여러 레포에 걸친 이슈 |
| `epic` | `#B60205` | Epic/이니셔티브 |
| `adr` | `#006B75` | Architecture Decision Record |
| `roadmap` | `#0075CA` | 로드맵 항목 |
| `discussion` | `#D4C5F9` | 논의 필요 |

## Hub Orchestration 라벨

project-hub의 Issue Planner와 Dispatcher가 사용하는 label입니다. 자동화가 issue를 어떤 단계까지 처리했는지 보여 줍니다.

| Label | Color | Description |
|-------|-------|-------------|
| `start-implement` | `#0E8A16` | Dispatcher 트리거: 각 repo에 issue 자동 생성 |
| `plan-complete` | `#1D76DB` | Hub planner가 계획 수립 완료 |
| `dispatched` | `#BFD4F2` | sub-repo에 issue 생성 완료 |
| `adr-rejected` | `#D93F0B` | ADR 기각 — 프로젝트 방향성 불일치 |
| `adr-deferred` | `#FBCA04` | ADR 보류 — 인간 판단 필요 |
| `adr-positive` | `#0E8A16` | ADR 긍정적 검토 — 인간 최종 확인 필요 |
| `needs-clarification` | `#D93F0B` | 정보 부족, 추가 설명 필요 |
| `skill-impact-review` | `#BADA55` | core repo 변경으로 plugin skill 업데이트 검토 필요 |

### Hub 라벨 상태 흐름

**ADR Proposal**:
```
adr (자동) → adr-rejected / adr-deferred / adr-positive
  → [adr-positive일 때] start-implement → dispatched
```

**Cross-Repo Issue / Epic**:
```
cross-repo 또는 epic (자동) → plan-complete
  → start-implement → dispatched
```

**Skill Impact Review** (자동):
```
core repo main 머지 (path-filtered) → skill-impact-review + cross-repo (자동)
  → Hub planner 분석 → plan-complete
  → [사람 검토] start-implement → dispatched (plugins repo)
```

## Core Repo PR 라벨

핵심 repository의 PR에는 Skill 영향 여부를 추적하는 label을 추가로 사용합니다.

| Label | Color | Description |
|-------|-------|-------------|
| `skill-impact` | `#BADA55` | PR이 plugin skill에 영향을 줄 수 있음 (pre-merge advisory) |

## 라벨 적용 규칙

1. **단일 repository issue**에는 해당 repository의 Agentic Workflow label만 사용합니다.
2. **cross-repo issue**는 project-hub에서 Hub label을 붙이고 각 하위 issue를 연결합니다.
3. **Epic**에는 `epic` label을 붙이고 하위 issue를 `org/repo#number` 형식으로 연결합니다.
4. **ADR**에는 `adr`와 `discussion` label을 함께 붙여 검토가 필요한 결정임을 표시합니다.
5. **Skill Impact**는 `pr-reviewer`의 advisory job이 핵심 repository PR에 `skill-impact` label을 자동으로 붙입니다.
