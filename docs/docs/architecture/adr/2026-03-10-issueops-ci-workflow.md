---
title: "ADR-0008: IssueOps 기반 CI 워크플로우"
description: GitHub Issues에서 claude-code-action을 통해 AI 에이전트가 자동으로 코드를 생성하고 PR을 제출하는 IssueOps 워크플로우 도입 결정.
sidebar_position: 8
scope: ecosystem
repos: [aerospike-py, acko, cluster-manager]
tags: [adr, ci, issueops, claude-code-action, automation]
last_updated: 2026-03-29
---

# ADR-0008: IssueOps 기반 CI 워크플로우

## 상태

**Accepted**

- 제안일: 2026-03-10
- 승인일: 2026-03-16

## 맥락 (Context)

에코시스템 프로젝트들의 개발 생산성 향상을 위해, GitHub Issues와 Comments에서 직접 AI 에이전트가 코드 변경을 수행할 수 있는 자동화 워크플로우가 필요했습니다.

### 문제 상황

1. **반복적 작업의 비효율**: 테스트 추가, 문서 수정, 린트 수정 등 패턴화된 작업에 개발자 시간 소모
2. **컨텍스트 전환 비용**: Issue에서 코드로 넘어가는 과정에서의 컨텍스트 손실
3. **기여 장벽**: 비개발자도 Issue를 통해 코드 변경을 요청할 수 있으면 좋겠다는 요구

### 요구사항

1. Issue 생성 시 AI가 자동으로 구현 계획 생성
2. Comment로 구현 지시 가능
3. 자동 PR 생성 및 제출
4. Plan-first 워크플로우: 구현 전 계획 검토

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

1. **issue-planner.yml**: Issue 생성/편집 시 트리거, 구현 계획만 생성
2. **agent-implement.yml**: "implement" 라벨 또는 코멘트로 트리거, 실제 코드 생성 및 PR 제출
3. **pr-reviewer.yml**: PR 생성 시 자동 코드 리뷰

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

## 참고 자료

- [PR #208 - gh-aw IssueOps + CommentOps](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/208)
- [PR #216 - Plan-first 워크플로우 재설계](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/216)
- [claude-code-action (gh-aw)](https://github.com/github/gh-aw)
