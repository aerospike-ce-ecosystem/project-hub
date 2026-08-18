---
title: "ADR-0043: 에코시스템 통합 CI 워크플로우 스위트 표준화"
description: 에코시스템 5개 repo의 CI 워크플로우(agent-implement, pr-reviewer, issue-planner, daily-release, skill-impact-notify) 적용 범위를 표준화하고 공유 설정 관리 방식을 문서화하는 결정.
sidebar_position: 43
scope: ecosystem
repos: [aerospike-py, acko, cluster-manager, plugins]
tags: [adr, ci, workflow, standardization, automation, claude-code-action, superseded]
last_updated: 2026-08-18
---

# ADR-0043: 에코시스템 통합 CI 워크플로우 스위트 표준화

## 상태

**Superseded** (부분) — [ADR-0053: 라벨 트리거 에이전트 자동화 제거](./2026-08-18-remove-label-triggered-agent-automation.md)로 스위트 정의가 대체됨 (2026-08-18)

- 제안일: 2026-04-07
- 승인일: 2026-07-17
- 부분 대체일: 2026-08-18
- 관련 이슈: aerospike-ce-ecosystem/project-hub#48
- 검토 결과: POSITIVE REVIEW

:::danger 필수 워크플로우 세트에서 3종이 빠졌습니다

2026-08-18에 `agent-implement.yml` / `pr-reviewer.yml` / `issue-planner.yml`이 네 개 core repo 전부에서, `hub-issue-planner.yml` / `hub-issue-dispatcher.yml`이 project-hub에서 **삭제**되었습니다. 아래 본문의 적용 현황표와 "필수 워크플로우 세트" 정의는 당시 상태를 남기기 위해 원문 그대로 보존합니다.

현행 필수 세트는 다음과 같습니다.

| 워크플로우 | 현재 상태 |
|-----------|----------|
| `agent-implement` | **삭제됨** |
| `pr-reviewer` | **삭제됨** |
| `issue-planner` (core repo) | **삭제됨** |
| `issue-planner` (hub 전용 = `hub-issue-planner`) | **삭제됨** |
| `daily-release` | 유지 |
| `skill-impact-notify` | 유지 (감지·알림까지) |

따라서 아래 "Gap 해소 로드맵"의 1·2번 항목(cluster-manager에 skill-impact-notify 추가, plugins에 daily-release 검토)만 유효하며, 공유 설정 표준 중 `CLAUDE_MODEL`·`CLAUDE_MAX_TURNS`는 참조하는 workflow가 남아 있지 않습니다.

**제거 사유**: 삭제된 workflow들이 plan을 issue 코멘트에서 작성자 검사 없이 읽어 조직 전역 PAT로 실행했습니다. 공교롭게도 이 ADR이 문제로 지목한 "copy-paste 복제로 인한 drift"가 보안 게이트를 각 repo에 개별 유지해야 하는 부담으로 이어져, 자동화 유지 대신 제거를 택하는 근거가 되었습니다. 자세한 내용은 ADR-0053에 있습니다.

관련 이슈: [project-hub#158](https://github.com/aerospike-ce-ecosystem/project-hub/issues/158)
:::

## 맥락 (Context)

에코시스템 5개 repo가 공통 CI 워크플로우 스위트를 공유하고 있으나, 적용 범위가 일치하지 않습니다. ADR-0008(IssueOps 기반 CI 워크플로우)은 agent-implement, issue-planner, pr-reviewer 3개 워크플로우만 다루며, daily-release와 skill-impact-notify는 아키텍처 결정으로 문서화되어 있지 않습니다.

### 현재 워크플로우 적용 현황

| 워크플로우 | aerospike-py | ACKO | cluster-manager | plugins | project-hub |
|-----------|:---:|:---:|:---:|:---:|:---:|
| agent-implement | ✅ | ✅ | ✅ | ✅ | ❌ |
| pr-reviewer | ✅ | ✅ | ✅ | ✅ | ❌ |
| issue-planner | ✅ | ✅ | ✅ | ✅ | hub 전용 |
| daily-release | ✅ | ✅ | ✅ | ❌ | ❌ |
| skill-impact-notify | ✅ | ✅ | ❌ | N/A | N/A |

### 문제점

1. **워크플로우 drift**: repo 간 copy-paste로 복제되어 시간이 지남에 따라 설정이 발산
2. **Gap 존재**: cluster-manager에 skill-impact-notify 미적용, plugins에 daily-release 미적용
3. **암묵적 설정 관리**: `CLAUDE_MODEL`, `CLAUDE_MAX_TURNS`, `GH_AW_GITHUB_TOKEN` 등 공유 설정의 관리 규칙이 문서화되어 있지 않음
4. **비용 가시성 부족**: Claude Code Action 사용량을 에코시스템 전체에서 파악할 수 없음

## 결정 (Decision)

> **현행 repo별 독립 워크플로우 방식(Option A)을 단기 유지하되, 필수 워크플로우 세트, 공유 설정 표준, Gap 해소 로드맵을 ADR로 공식 문서화한다. 장기적으로 GitHub Reusable Workflows(Option B)로의 전환을 검토한다.**

### 필수 워크플로우 세트

각 repository의 특성에 맞는 필수 workflow를 다음과 같이 정의합니다.

- **코드 repo** (aerospike-py, ACKO, cluster-manager): agent-implement, pr-reviewer, issue-planner, daily-release, skill-impact-notify (해당 시)
- **플러그인 repo** (plugins): agent-implement, pr-reviewer, issue-planner, daily-release 검토
- **허브 repo** (project-hub): hub 전용 issue-planner만 유지

### 공유 설정 표준

모든 워크플로우에서 사용하는 공유 설정의 관리 규칙:
- `CLAUDE_MODEL`: Organization-level variable로 관리
- `CLAUDE_MAX_TURNS`: 워크플로우별 적정값 표준화
- `GH_AW_GITHUB_TOKEN`: Organization-level secret으로 관리

### Gap 해소 로드맵

1. cluster-manager에 skill-impact-notify 워크플로우 추가
2. plugins에 daily-release 도입 여부 검토
3. 전체 repo의 공유 설정값 정합성 확인

## 대안 (Alternatives Considered)

### Option A: Repo별 독립 워크플로우 유지 (현재 방식) — 추천

- **장점**: repo별 커스터마이즈 용이, 마이그레이션 비용 없음, 각 repo의 독립성 유지
- **단점**: 시간이 지남에 따라 drift 발생 가능, 변경 사항을 모든 repo에 수동 전파 필요
- **선택 이유**: 현재 5개 repo 규모에서는 중앙화의 복잡성 대비 이점이 크지 않음. 문서화로 일관성을 확보하는 것이 현실적

### Option B: GitHub Reusable Workflows

- **장점**: 중앙 관리로 일관성 보장, 변경 사항 자동 전파, 워크플로우 코드 중복 제거
- **단점**: `.github` org-level repo 필요, 워크플로우 디버깅 복잡도 증가, repo별 커스터마이즈 유연성 감소
- **미선택 사유**: 장기적으로 유효하나, 현재 규모에서는 과도한 인프라. repo 수가 증가하면 재검토

### Option C: Composite Actions

- **장점**: 핵심 스텝만 공유하면서 워크플로우 구조는 repo별 유지, 유연성과 일관성의 절충
- **단점**: 공유 범위가 스텝 레벨로 제한되어 워크플로우 전체 구조의 일관성은 보장 불가
- **미선택 사유**: Option A + 문서화가 같은 수준의 유연성을 더 낮은 복잡도로 제공

## 결과 (Consequences)

### 긍정적

- 전체 CI 인프라의 가시성 확보 — 어떤 repo에 어떤 워크플로우가 있어야 하는지 명확
- repo별 워크플로우 gap 식별 및 해소 계획 수립
- 신규 기여자의 CI 구조 이해도 향상
- 비용 예측 가능 — Claude Code Action 사용량 전체 파악
- ADR-0008의 범위를 전체 CI 스위트로 자연스럽게 확장

### 부정적

- 표준화 문서와 실제 워크플로우 간의 동기화를 지속적으로 유지해야 함
- repo별 특수 요구사항이 표준에 맞지 않을 경우 예외 처리 필요
- Option B 전환 시점의 판단 기준이 아직 명확하지 않음 (repo 수? drift 빈도?)

## 관련 ADR

- [ADR-0008: IssueOps 기반 CI 워크플로우](/docs/architecture/adr/2026-03-10-issueops-ci-workflow) — agent-implement, issue-planner, pr-reviewer의 도입 결정. 이 ADR은 ADR-0008의 범위를 전체 CI 스위트로 확장 (ADR-0008은 2026-08-18 Superseded)
- [ADR-0053: 라벨 트리거 에이전트 자동화 제거](./2026-08-18-remove-label-triggered-agent-automation.md) — 이 ADR의 필수 워크플로우 세트에서 agent-implement / pr-reviewer / issue-planner를 제거한 결정
- [ADR-0010: 3-Layer Observability Stack](/docs/architecture/adr/2026-02-05-observability-stack) — skill-impact-notify가 관측성 데이터를 활용하여 변경 영향을 알림
