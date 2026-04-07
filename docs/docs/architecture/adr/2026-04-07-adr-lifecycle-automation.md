---
title: "ADR-0039: Project Hub ADR Lifecycle 자동화 아키텍처 — 리뷰/디스패치/상태 관리 3단계 자동화"
description: Project-hub의 ADR lifecycle을 AI 리뷰, cross-repo 디스패치, 상태 관리 3단계로 자동화하는 워크플로우 아키텍처를 문서화하고 표준화하는 결정.
sidebar_position: 39
scope: ecosystem
repos: [aerospike-py, acko, cluster-manager, plugins]
tags: [adr, automation, issueops, ai-review, workflow, dispatch]
last_updated: 2026-04-07
---

# ADR-0039: Project Hub ADR Lifecycle 자동화 아키텍처 — 리뷰/디스패치/상태 관리 3단계 자동화

## 상태

**Proposed**

- 제안일: 2026-04-07
- 관련 이슈: aerospike-ce-ecosystem/project-hub#54
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Project-hub에는 ADR lifecycle을 자동화하는 3개의 GitHub Actions 워크플로우가 운영 중입니다:

1. **hub-issue-planner.yml**: ADR proposal issue가 생성되면 Claude Code 에이전트가 자동으로 AI 리뷰를 수행하고, 3단 verdict(REJECT/DEFER/POSITIVE)를 판정
2. **hub-issue-dispatcher.yml**: POSITIVE verdict 이후 관련 sub-repo에 구현 issue를 자동 디스패치
3. **hub-adr-status-override.yml**: human override로 이미 머지된 ADR 문서의 status를 업데이트

이 파이프라인은 다음과 같은 특징을 가집니다:

- `<!-- repo-plan:... -->`, `<!-- repo-list:... -->` 마크업을 machine-parseable API로 사용하여 워크플로우 간 데이터를 전달
- 모든 verdict(REJECT 포함)에 대해 ADR 문서를 자동 생성 및 머지하여 의사결정 이력을 보존
- cross-repo, epic, skill-impact-review 3가지 planning 모드를 지원

ADR-0008(IssueOps 기반 CI 워크플로우)은 기본 IssueOps 패턴(Issue → Plan → Implement → PR)만 다루고 있으며, project-hub 전용 ADR lifecycle 자동화는 별도로 문서화되어 있지 않았습니다. 이 시스템은 이미 다수의 ADR을 성공적으로 처리한 검증된 인프라이므로, 이를 ADR로 명문화하여 프로토콜 스펙과 운영 기준을 표준화할 필요가 있습니다.

## 결정 (Decision)

> **현재 운영 중인 3단계 ADR lifecycle 자동화(AI 리뷰 → 자동 ADR 생성/디스패치 → 상태 관리)를 프로젝트의 공식 아키텍처로 채택하고, 마크업 프로토콜 스펙과 verdict 기준을 표준화한다.**

### 3단계 파이프라인 구조

```
ADR Proposal Issue 생성
  → [Stage 1] hub-issue-planner: AI 리뷰 + 3단 Verdict
    → REJECT: ADR 문서 생성 (Rejected 상태) + 머지
    → DEFER: ADR 문서 생성 (Deferred 상태) + 머지
    → POSITIVE: ADR 문서 생성 (Proposed 상태) + 머지
      → [Stage 2] hub-issue-dispatcher: 관련 sub-repo에 구현 issue 자동 생성
  → [Stage 3] hub-adr-status-override: human이 최종 결정 후 ADR 상태 업데이트
```

### 마크업 프로토콜

워크플로우 간 데이터 전달에 사용되는 HTML 주석 기반 마크업:

- `<!-- repo-plan:repo-name -->...<!-- /repo-plan:repo-name -->`: 레포별 구현 계획 블록
- `<!-- repo-list: repo1, repo2 -->`: 영향받는 레포 목록 (디스패치 대상)
- `<!-- agent-plan-start -->...<!-- agent-plan-end -->`: AI 리뷰 코멘트 범위 마커

### 3단 Verdict 기준

| Verdict | 기준 | ADR 상태 |
|---------|------|----------|
| REJECT | 기존 ADR 충돌, 불필요한 복잡성, 대안이 명백히 우수 | Rejected |
| DEFER | 트레이드오프 판단이 주관적, 추가 정보 필요, 타이밍 부적절 | Deferred |
| POSITIVE | 프로젝트 목표 정합, 기술적 타당, 수용 가능한 트레이드오프 | Proposed |

### Planning 모드

| 모드 | 용도 |
|------|------|
| adr_proposal | ADR proposal issue 리뷰 및 verdict |
| cross_repo_issue | cross-repo 영향이 있는 일반 issue |
| epic | 대규모 기능 개발 계획 |

## 대안 (Alternatives Considered)

### Option A: 현재 3단계 자동화 유지 (추천)

- AI 리뷰 → 자동 ADR 생성 → 디스패치의 완전 자동화
- **장점**: 이미 검증된 시스템, ADR 품질 게이트 효과적, cross-repo 구현 누락 방지
- **단점**: 3단 워크플로우 체인의 디버깅 어려움, AI verdict 정확도 한계

### Option B: 간소화 (AI 리뷰만)

- AI가 리뷰 코멘트만 작성하고 ADR 생성/디스패치는 수동 수행
- **장점**: 워크플로우 단순화, 유지보수 용이
- **단점**: 자동 ADR 생성과 디스패치라는 핵심 가치 상실, 수동 작업으로 인한 누락 가능성

### Option C: GitHub Projects 기반 관리

- GitHub Projects board로 ADR lifecycle을 시각적으로 추적
- **장점**: 시각적 관리 가능, 상태 추적 직관적
- **단점**: 자동 디스패치 불가, ADR 문서 자동 생성 불가, 자동화 수준 대폭 감소

## 결과 (Consequences)

### 긍정적

- ADR lifecycle의 end-to-end 자동화로 일관된 문서 품질 보장
- 3단 verdict 체계가 ADR 품질 게이트로 효과적 동작
- 자동 디스패치로 cross-repo 구현 누락 방지
- 모든 verdict(REJECT 포함)가 ADR로 기록되어 의사결정 이력 완전 보존
- 마크업 프로토콜 표준화로 워크플로우 간 안정적 데이터 전달

### 부정적

- 3단 워크플로우 체인의 디버깅 복잡성 (한 단계 실패 시 전체 파이프라인 영향)
- AI verdict의 정확도 한계 — human override가 안전장치로 존재하나 추가 작업 발생 가능
- 마크업 프로토콜 변경 시 3개 워크플로우의 동시 수정 필요
- GitHub Actions minutes 비용 발생

## 관련 ADR

- [ADR-0008: IssueOps 기반 CI 워크플로우](/docs/architecture/adr/2026-03-10-issueops-ci-workflow) — 기본 IssueOps 패턴의 기반 결정. 이 ADR은 ADR-0008을 project-hub의 ADR lifecycle 전용으로 확장
