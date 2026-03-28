---
title: Project Goals
description: Aerospike CE Ecosystem 각 프로젝트의 개발 방향과 제약 조건 정의
sidebar_position: 1
scope: ecosystem
repos:
  - aerospike-py
  - acko
  - cluster-manager
  - plugins
tags:
  - goals
  - constraints
  - principles
  - development-guidelines
last_updated: 2026-03-29
---

# Project Goals

Aerospike CE Ecosystem 각 프로젝트의 개발 방향과 제약 조건.

---

## 1. aerospike-py

> Aerospike Python Rust binding async client

1-1. **고성능 유지** — Rust(PyO3) 기반의 성능 이점을 항상 유지할 것

1-2. **aerospike-client-rust v2 추적** — aerospike-client-rust v2를 Skills로 이해하고 있을 것. 최신 버전이 나오면 도입 검토할 것

1-3. **NumPy batch 연산 개선** — batch_read_numpy, batch_write_numpy 스펙이 잘 동작하도록 개선하고 유지보수할 것

1-4. **Observability 유지** — logging, metrics, tracing(OpenTelemetry) 잘 개선하고 유지할 것. FastAPI에서 잘 동작하는지 sample-fastapi에서 테스트할 것

1-5. **batch_write retry** — batch_write(..., retry=10) 옵션으로 client side에서 batch_write가 실패하지 않도록 최대한 제어할 것

---

## 2. aerospike-cluster-manager

> 웹 기반 Aerospike 클러스터 관리 UI (FastAPI + Next.js)

2-1. **Frontend UI 컴포넌트 활용성 유지** — 공통 컴포넌트 재사용성을 잘 관리할 것

2-2. **Backend read/write timeout·limit 관리** — data table 조회 시 limit 제어, 성능 문제 잘 제어할 것

2-3. **ACKO UI 클러스터 관리** — ACKO 연동 K8s 클러스터 관리를 잘 제어할 것. 편의성 UX 개선

2-4. **큰 틀의 UI 변경 금지** — 전체 레이아웃과 네비게이션 구조를 함부로 변경하지 말 것

2-5. **ACKO 클러스터 생성 편의성** — Wizard 기반 생성 흐름의 편의성 중요

2-6. **ACKO 클러스터 관리·조회·변경** — 편의성과 성능 문제 모두 중요

2-7. **Backend ↔ Frontend 타입 동기화** — Backend Pydantic models와 Frontend TypeScript types(lib/api/types.ts)는 수동 동기화 필수. 모델 변경 시 양쪽 모두 업데이트할 것

2-8. **Record 브라우저 대용량 데이터 성능** — scan/query 시 limit, pagination, timeout을 적절히 제어하여 대용량 데이터셋에서도 안정적으로 동작할 것

---

## 3. ACKO (Aerospike CE Kubernetes Operator)

> Kubernetes Operator for Aerospike CE cluster lifecycle management

3-1. **심플한 CRD 구조 유지** — Pod, StatefulSet, Service, PVC 등 K8s 표준 리소스로 제어 가능하게 할 것. Custom Resource를 함부로 추가하지 말 것

3-2. **Cluster Template 목적 유지 및 고도화**
  - minimal: 개발용
  - soft-rack: Stage 환경 (1 Node N Pod)
  - hard-rack: Prod 환경 (N Node N Pod)
  - 이 목적을 유지하면서 잘 개선하고 고도화할 것

3-3. **Helm chart 버전 관리** — charts/aerospike-ce-kubernetes-operator/의 Helm chart 버전 관리와 릴리스 프로세스를 체계적으로 유지할 것

3-4. **E2E 테스트 커버리지 확장** — Kind 기반 E2E 테스트 시나리오를 확장할 것 (scale, rolling update, ACL, monitoring 등 운영 시나리오)

3-5. **CE 제약 Webhook 검증 신뢰성** — size≤8, namespaces≤2, no XDR/TLS 등 CE 제약 조건 검증을 항상 정확하게 유지할 것. Enterprise 기능 사용 시도 시 명확한 에러 메시지 제공

---

## 4. aerospike-ce-ecosystem-plugins

> Claude Code 플러그인 — AI 어시스턴트 연동

4-1. **Skills 최신 반영** — 각 프로젝트의 API/기능 변경 사항을 Skills에 빠르게 반영할 것 (aerospike-py API 변경, ACKO CRD 변경 등)

4-2. **디버깅 에이전트 정확도** — ACKO 클러스터 디버깅 에이전트(acko-cluster-debugger)가 실제 트러블슈팅에 유효하도록 정확도를 유지할 것
