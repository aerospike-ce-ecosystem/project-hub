---
title: "ADR-0039: Skill Impact Review 파이프라인 — Core Repo → Plugin Skill 변경 감지 및 자동 디스패치"
description: Core repo(aerospike-py, ACKO, cluster-manager)의 API/파일 변경이 plugin skill에 미치는 영향을 자동 감지하고 project-hub를 거쳐 plugins repo에 구현 이슈를 디스패치하는 cross-repo 파이프라인 도입 결정.
sidebar_position: 39
scope: ecosystem
repos: [aerospike-py, acko, cluster-manager, plugins]
tags: [adr, automation, cross-repo, skill-sync, pipeline, claude-code-action]
last_updated: 2026-04-07
---

# ADR-0039: Skill Impact Review 파이프라인 — Core Repo → Plugin Skill 변경 감지 및 자동 디스패치

## 상태

**Proposed**

- 제안일: 2026-04-07
- 관련 이슈: aerospike-ce-ecosystem/project-hub#47
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Aerospike CE Ecosystem은 4개의 독립 레포지토리로 구성되어 있으며, core repo(aerospike-py, ACKO, cluster-manager)의 API 변경이 plugins repo의 Claude Code skill에 영향을 줄 수 있습니다. 프로젝트 목표 4-1은 "각 프로젝트의 API/기능 변경 사항을 Skills에 빠르게 반영할 것"을 명시하고 있습니다.

### 문제 상황

1. **수동 동기화의 한계**: core repo에서 API가 변경될 때, 해당 변경이 어떤 plugin skill에 영향을 주는지 개발자가 수동으로 판단해야 했음. Q1에 수동으로 놓친 사례가 발생
2. **Cross-repo 가시성 부족**: repo 간 영향 관계가 명시적으로 추적되지 않아, 변경의 파급 효과를 사후에 발견
3. **에코시스템 확장에 따른 복잡도**: 4개 repo 간의 의존 관계가 점점 복잡해지면서 수동 관리의 한계에 도달

### 현재 적용 현황

| Repo | skill-impact-notify | 상태 |
|------|-------------------|------|
| aerospike-py | ✅ 적용 | file-to-skill 매핑 테이블 포함 |
| ACKO | ✅ 적용 | CRD/controller 변경 감지 |
| cluster-manager | ❌ 미적용 | 향후 API 변경 시 gap 발생 가능 |
| plugins | N/A (수신 측) | issue 수신 및 구현 |

### 파이프라인 구조

```
Core repo PR merge
  → skill-impact-notify.yml (파일 변경 감지)
  → project-hub에 자동 issue 생성
  → hub-issue-planner.yml (Claude Code로 diff 분석 및 skill 영향 평가)
  → hub-issue-dispatcher.yml (plugins repo에 구현 issue 디스패치)
```

## 결정 (Decision)

> **파일 경로 기반 자동 감지(Option A)를 공식 패턴으로 채택하고, project-hub를 중앙 오케스트레이터로 사용하는 Skill Impact Review 파이프라인을 에코시스템 표준으로 확립한다.**

각 core repo의 `skill-impact-notify.yml` 워크플로우에 file-to-skill 매핑 테이블을 정의하고, 해당 파일이 변경될 때 자동으로 project-hub에 영향 분석 이슈를 생성합니다. project-hub의 워크플로우가 Claude Code로 diff를 분석하여 skill 영향을 평가하고, 필요 시 plugins repo에 구현 이슈를 디스패치합니다.

### 추가 결정 사항

1. **cluster-manager 적용**: backend API schema 변경을 감지하는 `skill-impact-notify.yml`을 추가
2. **매핑 테이블 관리**: 각 repo의 매핑 테이블은 해당 repo에서 관리하며, CI에서 매핑 커버리지를 검증
3. **실패 처리**: skill update 실패 시 `skill-update-failed` 라벨로 escalation, 수동 fallback

## 대안 (Alternatives Considered)

### Option A: 파일 경로 기반 자동 감지 (채택)

각 repo의 워크플로우에 file-to-skill 매핑 테이블을 하드코딩하고, 파일 변경 시 자동 트리거. project-hub를 중앙 오케스트레이터로 사용.

- **장점**: 완전 자동화로 누락 방지, 중앙 추적으로 가시성 확보, 이미 2개 repo에서 검증됨
- **단점**: 매핑 테이블 하드코딩으로 drift 위험, 4개 repo 워크플로우 유지보수 부담, AI 분석 비용

### Option B: 라벨/커밋 메시지 기반 감지

`skill-impact` 라벨 또는 커밋 메시지 키워드로 트리거. 개발자가 명시적으로 skill 영향을 선언.

- **장점**: 오탐(false positive) 감소, 개발자가 의도를 명시
- **단점**: 개발자 의존으로 누락 위험 높음, 프로젝트 목표 4-1의 "빠르게 반영" 요구사항에 부합하지 않음
- **기각 사유**: 수동 선언 방식은 이전 Q1 누락 사례와 동일한 문제를 반복할 수 있음

### Option C: 직접 cross-repo Actions (hub 경유 없이)

core repo에서 plugins repo로 직접 `workflow_dispatch`. 중간 허브 없이 단순한 파이프라인.

- **장점**: 파이프라인 단순화, 중간 단계 제거로 지연 감소
- **단점**: 중앙 추적 기능 상실, 영향 분석 없이 바로 디스패치되어 불필요한 이슈 생성 가능
- **기각 사유**: project-hub의 중앙 오케스트레이터 역할(설계 원칙 4-1)과 충돌하며, AI 기반 영향 분석 단계를 생략하게 됨

## 결과 (Consequences)

### 긍정적

- **API 동기화 누락 방지**: 파일 변경 시 자동으로 skill 영향이 감지되어 Q1 같은 누락 사례 해소
- **자동화된 영향 분석**: Claude Code가 diff를 분석하여 실제 skill 영향 여부를 판단, 리뷰 부담 감소
- **중앙 추적**: project-hub에서 모든 cross-repo 변경의 skill 영향을 일괄 추적 가능
- **ADR-0008 확장**: IssueOps 패턴을 cross-repo 감지까지 확장하여 에코시스템 자동화 수준 향상
- **프로젝트 목표 4-1 직접 지원**: Skills 최신 반영 목표를 시스템 수준에서 보장

### 부정적

- **4개 repo 워크플로우 유지보수**: 각 repo의 `skill-impact-notify.yml`과 매핑 테이블을 개별 관리해야 함
- **매핑 테이블 drift 위험**: 새로운 파일이 추가되었지만 매핑 테이블에 반영되지 않을 수 있음 (CI 검증으로 완화)
- **Claude Code Action 비용**: 매 감지마다 AI 분석이 실행되어 GitHub Actions 비용 발생
- **오탐 가능성**: 파일 변경이 반드시 skill 영향을 의미하지 않을 수 있으나, AI 분석 단계에서 필터링

## 관련 ADR

- [ADR-0008: IssueOps 기반 CI 워크플로우](./2026-03-10-issueops-ci-workflow.md) — 이 파이프라인의 기반 패턴. Issue → Plan → Implement 흐름을 cross-repo 감지까지 확장
- [ADR-0017: Cluster Manager Backend↔Frontend 타입 동기화 자동화](./2026-03-30-codegen-type-sync.md) — repo 내부 타입 동기화의 선례. 이 ADR은 repo 간 API↔Skill 동기화를 다루어 보완적
- [ADR-0038: ACKO 외부 네트워크 접근](./2026-04-05-external-network-access.md) — CRD 변경이 plugins skill에 영향을 주는 사례. 이 파이프라인이 감지해야 할 대표적 시나리오
