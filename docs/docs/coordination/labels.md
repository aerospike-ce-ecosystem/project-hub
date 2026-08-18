---
title: 공유 라벨 정의
description: 생태계 전체에서 사용하는 GitHub 라벨 체계 및 정의. 2026-08-18 자동화 제거 이후 라벨은 모두 수동 분류용입니다.
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
last_updated: 2026-08-18
---

# 공유 라벨 정의

모든 repository에서 같은 의미로 label을 해석할 수 있도록 공통 체계를 사용합니다.

:::danger 라벨은 더 이상 workflow를 트리거하지 않습니다 (2026-08-18)

이 페이지의 label 대부분은 원래 GitHub Actions workflow를 발화시켰습니다. 2026-08-18에 라벨 트리거 에이전트 자동화가 제거되면서, **`adr-rejected` / `adr-deferred` / `adr-positive` 세 개를 제외한 모든 label은 자동으로 아무 동작도 일으키지 않습니다.** 이제는 분류와 추적 용도로만 씁니다.

`agent`, `plan-complete`, `start-implement`를 붙여도 계획이 작성되거나 구현이 시작되지 않습니다.

배경: [ADR-0053](../architecture/adr/2026-08-18-remove-label-triggered-agent-automation.md) · [워크플로우 현황](./agentic-workflow.mdx) · [project-hub#158](https://github.com/aerospike-ce-ecosystem/project-hub/issues/158)
:::

## 자동 동작이 남아 있는 라벨

`hub-adr-status-override.yml`이 사용하는 세 개뿐입니다. project-hub의 issue에 붙이면 이미 머지된 ADR 문서의 상태 필드가 갱신됩니다.

| Label | Color | 자동 동작 |
|-------|-------|----------|
| `adr-rejected` | `#D93F0B` | ADR 문서 상태를 `Rejected`로 갱신 |
| `adr-deferred` | `#FBCA04` | ADR 문서 상태를 `Deferred`로 갱신 |
| `adr-positive` | `#0E8A16` | ADR 문서 상태를 `Proposed`로 갱신 |

## 작업 상태 라벨 (수동)

네 개 핵심 repository(aerospike-py, ACKO, cluster-manager, plugins)가 공통으로 사용합니다. 이제 사람이 붙이고 사람이 읽는 상태 표시입니다.

| Label | Color | Description | 예전 자동 동작 |
|-------|-------|-------------|--------------|
| `agent` | `#0E8A16` | AI 도구로 처리 중이거나 처리할 이슈 | `issue-planner.yml` 트리거 — **없어짐** |
| `plan-complete` | `#1D76DB` | 계획이 정리되어 구현 가능한 상태 | `agent-implement.yml` 트리거 — **없어짐** |
| `in-progress` | `#FBCA04` | 구현 진행 중 | 구현 workflow가 자동 부착 — **없어짐** |
| `needs-review` | `#E4E669` | PR 리뷰 필요 | `pr-reviewer.yml` 트리거 — **없어짐** |
| `review-complete` | `#0E8A16` | 리뷰 완료 | 리뷰 workflow가 자동 부착 — **없어짐** |
| `needs-clarification` | `#D93F0B` | 이슈 보완 필요 | planner가 자동 부착 — **없어짐** |

## Hub 라벨 (수동)

project-hub 전용 label입니다. cross-repo issue를 추적하고 여러 프로젝트의 작업을 조율할 때 사용합니다. 자동화 제거의 영향을 받지 않았습니다.

| Label | Color | Description |
|-------|-------|-------------|
| `cross-repo` | `#5319E7` | 여러 레포에 걸친 이슈 |
| `epic` | `#B60205` | Epic/이니셔티브 |
| `adr` | `#006B75` | Architecture Decision Record |
| `roadmap` | `#0075CA` | 로드맵 항목 |
| `discussion` | `#D4C5F9` | 논의 필요 |

## Hub Orchestration 라벨 (수동)

`hub-issue-planner.yml`과 `hub-issue-dispatcher.yml`이 사용하던 label입니다. 두 workflow가 삭제되었으므로 자동 동작은 없고, 진행 단계를 사람이 표시하는 용도로만 남습니다.

| Label | Color | Description | 예전 자동 동작 |
|-------|-------|-------------|--------------|
| `start-implement` | `#0E8A16` | 각 repo에 하위 issue를 만들 준비가 됨 | `hub-issue-dispatcher.yml` 트리거 — **없어짐** |
| `plan-complete` | `#1D76DB` | 계획 수립 완료 | Hub planner가 자동 부착 — **없어짐** |
| `dispatched` | `#BFD4F2` | sub-repo에 issue 생성 완료 | Dispatcher가 자동 부착 — **없어짐**. 사람이 직접 붙임 |
| `needs-clarification` | `#D93F0B` | 정보 부족, 추가 설명 필요 | Hub planner가 자동 부착 — **없어짐** |
| `skill-impact-review` | `#D93F0B` | core repo 변경으로 plugin skill 업데이트 검토 필요 | `skill-impact-notify.yml`이 **계속 자동 부착**(`ensure_label`로 없으면 생성). 이후 분석·전파만 수동 |

## Core Repo PR 라벨

| Label | Color | Description |
|-------|-------|-------------|
| `skill-impact` | `#BADA55` | PR이 plugin skill에 영향을 줄 수 있음. `pr-reviewer.yml`의 advisory job이 자동 부착했으나 해당 workflow가 삭제되어 **이제 수동** |

## 라벨 적용 규칙

1. **단일 repository issue**에는 해당 repository의 작업 상태 label만 사용합니다.
2. **cross-repo issue**는 project-hub에서 Hub label을 붙이고 각 하위 issue를 연결합니다. 하위 issue는 사람이 각 repo에 직접 생성합니다.
3. **Epic**에는 `epic` label을 붙이고 하위 issue를 `org/repo#number` 형식으로 연결합니다.
4. **ADR**에는 `adr`와 `discussion` label을 함께 붙여 검토가 필요한 결정임을 표시합니다. 검토 후 verdict label(`adr-positive` / `adr-deferred` / `adr-rejected`)을 붙이면 머지된 ADR 문서의 상태가 갱신됩니다.
5. **Skill Impact**: `skill-impact-notify.yml`이 project-hub에 issue를 만들면서 `skill-impact-review` label을 붙입니다. Core repo PR의 `skill-impact` label은 사람이 붙입니다.

:::note 라벨을 지우지 마세요

자동 동작이 사라졌더라도 label 자체는 과거 issue와 PR의 이력에 남아 있습니다. 삭제하면 그 이력을 읽을 수 없게 되므로, 정의만 갱신하고 label은 유지합니다.
:::
