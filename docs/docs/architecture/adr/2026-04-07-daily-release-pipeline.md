---
title: "ADR-0039: 에코시스템 일일 자동 릴리스 파이프라인 — Conventional Commits 기반 SemVer 자동화"
description: 4개 core repo에서 매일 KST 09:00에 Conventional Commits 분석 기반 SemVer 자동 릴리스를 실행하는 daily-release 파이프라인의 아키텍처 결정 문서화.
sidebar_position: 39
scope: ecosystem
repos: [aerospike-py, acko, cluster-manager, plugins]
tags: [adr, release, ci-cd, conventional-commits, semver, automation]
last_updated: 2026-04-07
---

# ADR-0039: 에코시스템 일일 자동 릴리스 파이프라인 — Conventional Commits 기반 SemVer 자동화

## 상태

**Proposed**

- 제안일: 2026-04-07
- 관련 이슈: aerospike-ce-ecosystem/project-hub#46
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Aerospike CE Ecosystem의 4개 core repo(aerospike-py, ACKO, cluster-manager, plugins)는 `daily-release.yml` 워크플로우를 통해 **매일 KST 09:00**에 자동 릴리스를 실행하고 있습니다. 이 파이프라인은 Q1에 28회 릴리스를 달성하며 안정적으로 운영되고 있으나, 에코시스템의 버전 정책, 릴리스 cadence, 품질 게이트를 결정하는 핵심 아키텍처 결정임에도 불구하고 ADR로 문서화되지 않았습니다.

### 현황 (2026-04-07 기준)

| Repo | 최신 버전 | daily-release | 비고 |
|------|-----------|---------------|------|
| aerospike-py | v0.2.1 | 적용 | — |
| ACKO | v0.4.1 | 적용 | Helm chart publish 연쇄 트리거 |
| cluster-manager | v0.6.1 | 적용 | — |
| plugins | v1.0.0 | 적용 | — |

### 파이프라인 구성 요소

1. **Conventional Commits 분석**: `feat` → minor, `fix` → patch로 SemVer 버전 자동 결정
2. **AI 릴리스 노트**: Claude Code Action으로 한국어/영어 이중 릴리스 노트 생성
3. **GitHub Release 생성**: `gh release create`로 자동 생성
4. **Helm chart 연쇄 트리거**: ACKO의 경우 tag 생성 시 Helm chart publish가 자동 트리거

이 결정은 ADR-0008 (IssueOps 기반 CI 워크플로우)에서 확립한 AI 기반 자동화 패턴의 자연스러운 확장이며, project-design의 "Transparency: 모든 의사결정을 ADR로 기록" 원칙에 따라 공식 문서화가 필요합니다.

## 결정 (Decision)

> **현재 운영 중인 Daily 자동 릴리스 파이프라인(Option A)을 에코시스템 공식 릴리스 전략으로 채택하고, 다음 사항을 명시한다:**
>
> 1. 매일 KST 09:00 cron 트리거로 Conventional Commits 기반 SemVer 자동 bump
> 2. Claude Code Action을 통한 한국어/영어 이중 릴리스 노트 생성
> 3. ACKO tag → Helm chart publish 연쇄 트리거 유지
> 4. Cross-repo 릴리스 순서, rollback 절차, Helm 버전 연동 규칙 후속 정의

### 세부 결정 사항

- **릴리스 트리거**: 매일 KST 09:00 (UTC 00:00) cron schedule
- **버전 결정**: Conventional Commits 분석 — `feat:` → minor bump, `fix:` → patch bump, `BREAKING CHANGE` → major bump
- **릴리스 노트**: Claude Code Action이 커밋 내역 분석 후 한국어/영어 이중 노트 자동 생성
- **No-op 처리**: 전일 대비 변경 없는 경우 릴리스 스킵 (불필요한 버전 증가 방지)
- **Helm chart 연동**: ACKO repo에서 Git tag 생성 시 별도 워크플로우가 Helm chart를 자동 패키징 및 publish

### 향후 결정 필요 사항

- Cross-repo 릴리스 순서 정의 (aerospike-py → cluster-manager 의존성 체인 반영)
- 릴리스 실패 시 rollback 절차 표준화
- Helm chart 버전과 operator 버전 연동 규칙 구체화
- Release Compatibility Matrix 자동 업데이트 연동

## 대안 (Alternatives Considered)

### Option A: Daily 자동 릴리스 (채택)

- **장점**: 이미 안정 운영 중 (Q1 28회), 수동 릴리스 부담 제거, 일관된 cadence
- **단점**: 변경 없는 날에도 워크플로우 실행 비용, Claude Code Action 장애 시 릴리스 중단

### Option B: On-demand 릴리스

- **장점**: 더 세밀한 릴리스 타이밍 제어, 불필요한 릴리스 없음
- **단점**: 수동 트리거 필요로 릴리스 지연 가능, 개발자가 릴리스 타이밍을 판단해야 하는 인지 부담
- **불채택 사유**: 현재 1인 유지보수 체계에서 수동 트리거는 릴리스 지연의 주요 원인이 될 수 있음

### Option C: release-please / semantic-release 도구 채택

- **장점**: 커뮤니티 표준 도구, Changelog 자동 생성, 풍부한 플러그인 생태계
- **단점**: AI 릴리스 노트의 한국어/영어 이중 지원 불가, 에코시스템 특화 커스터마이징 제한
- **불채택 사유**: Claude Code Action 기반 릴리스 노트가 에코시스템의 bilingual 요구사항에 더 적합. 또한 ADR-0008의 AI 자동화 패턴과 일관성 유지

## 결과 (Consequences)

### 긍정적

- 매일 최신 버전 제공으로 빠른 피드백 사이클 확보
- 수동 릴리스 부담 완전 제거 — 1인 유지보수 체계에 적합
- Conventional Commits 강제로 커밋 메시지 품질 향상 (품질 게이트 역할)
- 일관된 버전 정책이 4개 repo에 동일하게 적용
- AI 생성 릴리스 노트로 문서화 부담 감소
- ADR-0008 (IssueOps)의 자동화 철학과 일관된 에코시스템 운영

### 부정적

- 변경 없는 날에도 GitHub Actions 워크플로우 실행 (비용, no-op 처리로 완화 가능)
- Claude Code Action 장애 시 릴리스 파이프라인 전체 중단 위험 (단일 장애점)
- Cross-repo 의존성 타이밍 이슈: aerospike-py 릴리스 전 cluster-manager가 먼저 릴리스될 수 있음
- project-design의 "Quality over speed" 원칙과 표면적 긴장 — 단, Conventional Commits 품질 게이트로 완화

## 관련 ADR

- [ADR-0008: IssueOps 기반 CI 워크플로우](/docs/architecture/adr/2026-03-10-issueops-ci-workflow) — AI 기반 자동화 패턴의 선례
- [ADR-0003: Docker 대신 Podman 선택](/docs/architecture/adr/2026-02-01-podman-over-docker) — 에코시스템 전체 도구 표준화의 선례
