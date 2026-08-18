---
title: "ADR-0008: IssueOps 기반 CI 워크플로우"
description: GitHub Issues에서 claude-code-action을 통해 AI 에이전트가 자동으로 코드를 생성하고 PR을 제출하는 IssueOps 워크플로우 도입 결정.
sidebar_position: 8
scope: ecosystem
repos: [aerospike-py, acko, cluster-manager]
tags: [adr, ci, issueops, claude-code-action, automation, superseded]
last_updated: 2026-08-18
---

# ADR-0008: IssueOps 기반 CI 워크플로우

## 상태

**Superseded** — [ADR-0053: 라벨 트리거 에이전트 자동화 제거](./2026-08-18-remove-label-triggered-agent-automation.md)로 대체됨 (2026-08-18)

- 제안일: 2026-03-10
- 승인일: 2026-03-16
- 대체일: 2026-08-18

:::danger 이 결정은 더 이상 유효하지 않습니다

아래에 기술된 `issue-planner.yml` / `agent-implement.yml` / `pr-reviewer.yml` 3종 workflow는 2026-08-18에 **네 개 core repo 전부에서 삭제**되었습니다. 아래 본문은 당시의 결정 근거를 남기기 위해 원문 그대로 보존합니다.

**제거 사유**: 이 파이프라인은 plan을 issue 코멘트 본문에서 `<!-- agent-plan-start -->` marker로 찾아 실행하면서 코멘트 작성자를 전혀 검사하지 않았습니다(`grep -c "author_association"` → 4개 repo 모두 `0`). 실행은 조직 전역 PAT(`GH_AW_GITHUB_TOKEN`)와 `--dangerously-skip-permissions`로 이뤄집니다. 트리거(`on: issues: [labeled]`)에는 write 권한이 필요하므로 외부인 단독 실행은 불가능하지만, 외부인이 심어 둔 plan을 maintainer가 정상 절차로 label을 붙여 실행시키면 권한 분리가 무너집니다. 자세한 위협 모델과 재도입 조건은 ADR-0053에 있습니다.

관련 이슈: [project-hub#158](https://github.com/aerospike-ce-ecosystem/project-hub/issues/158)
:::

## 맥락 (Context)

반복 작업과 context 전환에 드는 시간을 줄이기 위해 GitHub Issue와 comment에서 AI agent에게 코드 변경을 요청하는 workflow가 필요했습니다.

### 문제 상황

1. **반복 작업의 비효율**: Test 추가, 문서 수정, lint 수정 같은 정형화된 작업이 개발자 시간을 차지했습니다.
2. **Context 전환 비용**: Issue에서 구현 작업으로 옮겨 가는 과정에서 요구사항의 context가 손실되었습니다.
3. **기여 장벽**: 코드를 직접 작성하지 않는 사용자도 Issue를 통해 변경을 요청할 수 있어야 했습니다.

### 요구사항

1. Issue가 생성되면 AI가 구현 계획을 작성해야 합니다.
2. Comment로 구현을 지시할 수 있어야 합니다.
3. 구현 결과를 PR로 자동 제출해야 합니다.
4. 구현 전에 계획을 검토하는 plan-first workflow를 따라야 합니다.

## 결정 (Decision)

> **gh-aw(claude-code-action) 기반의 IssueOps/CommentOps 워크플로우를 도입하고, plan-first 패턴을 적용한다.**

### 워크플로우 구조

```
Issue 생성 → issue-planner (Plan 생성)
  → 사용자 검토
  → Comment "implement" → agent-implement (코드 생성 + PR)
  → 자동 PR 리뷰
```

### 구현 방식

1. **issue-planner.yml**: Issue를 만들거나 편집하면 실행되며 구현 계획만 작성합니다.
2. **agent-implement.yml**: `implement` label 또는 comment로 실행되며 코드를 작성하고 PR을 제출합니다.
3. **pr-reviewer.yml**: PR이 생성되면 자동으로 code review를 수행합니다.

### 가드레일

- `agent` 라벨이 있는 Issue에서만 동작
- Plan-first: 구현 전 반드시 계획 생성 및 사용자 검토
- 자동 생성된 PR은 반드시 사람 리뷰 필요

## 대안 검토 (Alternatives Considered)

### 대안 1: PR-only 자동화

- **설명**: PR에서만 AI 리뷰/수정 자동화
- **단점**: Issue에서 코드까지의 간극을 메우지 못함
- **미선택 사유**: Issue → Code 전체 흐름을 자동화하는 것이 더 큰 가치

### 대안 2: Slack/Discord Bot

- **설명**: 채팅 인터페이스에서 코드 생성 지시
- **단점**: GitHub와의 통합이 약함, 코드 컨텍스트 부족
- **미선택 사유**: GitHub 네이티브 워크플로우가 코드 관리에 더 적합

## 결과 (Consequences)

### 긍정적 결과

- Issue에서 바로 코드 생성까지 end-to-end 자동화
- Plan-first 패턴으로 의도치 않은 변경 방지
- 에코시스템 전체 레포에 동일한 워크플로우 적용

### 부정적 결과 / 트레이드오프

- claude-code-action 비용 발생 (GitHub Actions minutes)
- 복잡한 변경에는 AI 결과물의 품질이 불안정할 수 있음
- Plan 검토 단계로 인한 추가 지연

## 영향받는 레포지토리

| 레포 | 영향 내용 |
|------|----------|
| `aerospike-py` | PR #208, #216에서 IssueOps/CommentOps 워크플로우 도입 |
| `acko` | 동일한 워크플로우 패턴 적용 |
| `cluster-manager` | 동일한 워크플로우 패턴 적용 |

## 관련 ADR

- [ADR-0053: 라벨 트리거 에이전트 자동화 제거](./2026-08-18-remove-label-triggered-agent-automation.md) — 이 ADR을 대체. 여기서 도입한 3종 workflow를 삭제한 결정

## 참고 자료

- [PR #208 - gh-aw IssueOps + CommentOps](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/208)
- [PR #216 - Plan-first 워크플로우 재설계](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/216)
- [claude-code-action (gh-aw)](https://github.com/github/gh-aw)
