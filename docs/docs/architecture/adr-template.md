---
title: ADR 템플릿
description: Architecture Decision Record를 일관된 형식으로 작성하기 위한 표준 템플릿
displayed_sidebar: null
sidebar_class_name: hidden
scope: ecosystem
repos: [aerospike-py, acko, cluster-manager, plugins]
tags: [adr, template, guide]
last_updated: 2026-03-29
---

# ADR-XXXX: [결정 제목]

:::info 사용 방법
이 템플릿을 복사해 새 ADR 파일을 만드세요.
파일명은 `XXXX-간략한-제목.md` 형식을 사용합니다(예: `0005-event-driven-arch.md`).
:::

## 상태

**[Proposed | Accepted | Deprecated | Superseded]**

- 제안일: YYYY-MM-DD
- 승인일: YYYY-MM-DD (승인 시 기입)
- 대체 ADR: [해당 시 링크] (Superseded인 경우)

## 맥락 (Context)

이 결정이 필요하게 된 배경을 설명합니다.

- 현재 상황은 무엇인가요?
- 해결해야 할 문제나 요구사항은 무엇인가요?
- 선택 가능한 방안을 제한하는 조건은 무엇인가요?
- 결정을 이끄는 기술적·비즈니스적 요인은 무엇인가요?

## 결정 (Decision)

선택한 방안을 명확하게 기술합니다.

> **"우리는 [X]를 선택한다. 그 이유는 [Y] 때문이다."**

선택한 방안은 다음 항목을 중심으로 구체적으로 설명합니다.

- 구현 방식
- 적용 범위
- 주요 설계 원칙

## 대안 검토 (Alternatives Considered)

### 대안 1: [이름]

- **설명**: ...
- **장점**: ...
- **단점**: ...
- **미선택 사유**: ...

### 대안 2: [이름]

- **설명**: ...
- **장점**: ...
- **단점**: ...
- **미선택 사유**: ...

## 결과 (Consequences)

### 긍정적 결과

- ...
- ...

### 부정적 결과 / 트레이드오프

- ...
- ...

### 리스크

- ...

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `aerospike-py` | (해당 시 기술) |
| `acko` | (해당 시 기술) |
| `cluster-manager` | (해당 시 기술) |
| `plugins` | (해당 시 기술) |

## 참고 자료

- 관련 링크 1
- 관련 링크 2
- 관련 Issue/PR
