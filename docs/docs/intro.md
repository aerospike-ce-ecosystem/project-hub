---
title: Aerospike CE Ecosystem Hub
description: Aerospike CE 오픈소스 생태계의 중앙 프로젝트 관리 허브 소개
sidebar_position: 1
scope: ecosystem
repos:
  - aerospike-py
  - aerospike-ce-kubernetes-operator
  - aerospike-cluster-manager
  - aerospike-ce-ecosystem-plugins
  - project-hub
tags:
  - introduction
  - ecosystem
  - overview
last_updated: 2026-03-29
---

# Aerospike CE Ecosystem Hub

Aerospike CE Ecosystem Hub는 4개의 핵심 레포지토리를 중앙에서 관리하는 프로젝트 허브입니다. 크로스-레포 이슈 추적, 아키텍처 결정, 로드맵 관리, 릴리스 조율 등 생태계 전반의 협업을 이곳에서 수행합니다.

## 핵심 레포지토리

| 레포 | 설명 | 기술 스택 |
|------|------|-----------|
| [aerospike-py](https://github.com/aerospike-ce-ecosystem/aerospike-py) | Aerospike Python 클라이언트 | Rust/PyO3 기반 고성능 async Python 클라이언트 |
| [ACKO](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator) | Aerospike CE Kubernetes Operator | Go 기반 Kubernetes Operator로 Aerospike 클러스터 자동 배포/관리 |
| [cluster-manager](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager) | Aerospike Cluster Manager | Python/TypeScript 기반 웹 UI로 클러스터 모니터링 및 관리 |
| [plugins](https://github.com/aerospike-ce-ecosystem/aerospike-ce-ecosystem-plugins) | Claude Code Plugins | 생태계 전용 Claude Code 플러그인 (skills, hooks, commands) |

## 문서 구성

이 사이트는 다음 섹션으로 구성되어 있습니다:

- **Architecture** -- 시스템 아키텍처, 레포 간 의존성, ADR(Architecture Decision Record)
- **Roadmap** -- 분기별 로드맵, 릴리스 매트릭스, 마일스톤
- **History** -- 프로젝트 변경 이력, 주요 결정 기록
- **Coordination** -- 라벨 체계, Agentic Workflow, 리뷰 프로세스
- **Goals** -- 프로젝트 목표 및 성공 기준

## 기여 방법

이 허브에 기여하려면 아래 이슈 템플릿을 사용하세요:

### Cross-Repo Issue

여러 레포에 걸친 이슈를 생성할 때 사용합니다. 관련 레포를 체크하고, 서브-레포 이슈를 `org/repo#number` 형식으로 링크합니다.

### Epic

대형 작업 단위를 정의할 때 사용합니다. 성공 기준과 하위 태스크를 체크리스트로 작성하고, 여러 레포의 이슈/PR을 하나의 Epic으로 묶어 관리합니다.

### ADR Proposal

아키텍처 결정이 필요할 때 사용합니다. 컨텍스트, 대안, 추천안, trade-off를 구조화하여 제안하고 논의합니다.

:::tip 이슈 생성 위치
단일 레포에 해당하는 이슈는 해당 레포에서 직접 생성하세요. 이 허브는 크로스-레포 이슈와 생태계 전반의 조율에 사용합니다.
:::
