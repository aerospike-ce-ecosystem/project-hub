---
title: ADR 템플릿
description: Architecture Decision Record 작성을 위한 표준 템플릿. 새 ADR 작성 시 이 템플릿을 복사하여 사용.
displayed_sidebar: null
sidebar_class_name: hidden
scope: ecosystem
repos: [aerospike-py, acko, cluster-manager, plugins]
tags: [adr, template, guide]
last_updated: 2026-03-29
---

# ADR-XXXX: [결정 제목]

:::info 사용 방법
이 템플릿을 복사하여 새 ADR 파일을 생성하세요.
파일명 형식: `XXXX-간략한-제목.md` (예: `0005-event-driven-arch.md`)
:::

## 상태

**[Proposed | Accepted | Deprecated | Superseded]**

- 제안일: YYYY-MM-DD
- 승인일: YYYY-MM-DD (승인 시 기입)
- 대체 ADR: [해당 시 링크] (Superseded인 경우)

## 맥락 (Context)

이 결정이 필요하게 된 배경을 설명합니다.

- 현재 상황은 무엇인가?
- 어떤 문제 또는 요구사항이 있는가?
- 어떤 제약 조건이 존재하는가?
- 기술적/비즈니스적 동인(driver)은 무엇인가?

## 결정 (Decision)

선택한 방안을 명확하게 기술합니다.

> **"우리는 [X]를 선택한다. 그 이유는 [Y] 때문이다."**

선택한 방안의 상세 내용:

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
