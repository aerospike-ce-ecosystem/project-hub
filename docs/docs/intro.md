---
title: Aerospike CE Ecosystem Hub
description: Aerospike CE 오픈소스 생태계의 중앙 프로젝트 관리 허브 소개
sidebar_position: 1
scope: ecosystem
repos:
  - aerospike-py
  - aerospike-ce-kubernetes-operator
  - aerospike-cluster-manager
  - ackoctl
  - aerospike-ce-ecosystem-plugins
  - project-hub
tags:
  - introduction
  - ecosystem
  - overview
last_updated: 2026-05-23
---

# Aerospike CE Ecosystem Hub

Aerospike CE Ecosystem Hub는 5개 핵심 레포지토리의 협업 문서를 한곳에 모은 프로젝트 허브입니다. 여러 레포에 걸친 이슈와 아키텍처 결정, 로드맵, 릴리스 계획을 이곳에서 함께 관리합니다.

## 핵심 레포지토리

| 레포 | 설명 | 기술 스택 |
|------|------|-----------|
| [aerospike-py](https://github.com/aerospike-ce-ecosystem/aerospike-py) | Aerospike Python 클라이언트 | Rust/PyO3로 구현한 고성능 sync/async 클라이언트 |
| [ACKO](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator) | Aerospike CE Kubernetes Operator | Aerospike CE 클러스터의 배포와 운영을 자동화하는 Go 기반 Kubernetes Operator |
| [cluster-manager](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager) | Aerospike Cluster Manager | 클러스터를 모니터링하고 관리하는 Python/TypeScript 기반 웹 UI |
| [ackoctl](https://github.com/aerospike-ce-ecosystem/ackoctl) | Aerospike Cluster Manager CLI | connection, cluster, Kubernetes, record 등을 관리하는 Go/Cobra 기반 CLI |
| [plugins](https://github.com/aerospike-ce-ecosystem/aerospike-ce-ecosystem-plugins) | Claude Code Plugins | 에코시스템 개발과 운영을 지원하는 9개 Skill 모음 |

## 문서 구성

필요한 문서는 다음 섹션에서 찾을 수 있습니다.

- **Architecture** — 시스템 구조, 레포 간 의존성, ADR(Architecture Decision Record)
- **Roadmap** — 분기별 목표와 마일스톤
- **History** — 변경 이력, 주요 결정, 릴리스 호환성
- **Coordination** — 라벨 체계, Agentic Workflow, 리뷰 절차
- **Goals** — 프로젝트 목표, 성공 기준, 설계 원칙

## 기여 방법

문서나 여러 레포에 걸친 작업을 제안하려면 목적에 맞는 이슈 템플릿을 선택하세요.

### Cross-Repo Issue

두 개 이상의 레포가 관련된 작업에 사용합니다. 영향받는 레포를 표시하고, 각 레포의 하위 이슈를 `org/repo#number` 형식으로 연결하세요.

### Epic

여러 단계로 나뉘는 큰 작업에 사용합니다. 성공 기준과 하위 작업을 체크리스트로 적고, 관련 이슈와 PR을 하나의 Epic으로 묶으세요.

### ADR Proposal

아키텍처 결정을 제안할 때 사용합니다. 배경과 대안, 권장안, trade-off를 같은 형식으로 정리해 논의할 수 있습니다.

:::tip 이슈 생성 위치
한 레포에만 해당하는 이슈는 해당 레포에 직접 등록하세요. 이 허브는 여러 레포가 관련된 작업과 에코시스템 차원의 조율에 사용합니다.
:::
