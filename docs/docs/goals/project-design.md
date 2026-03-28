---
title: Project Design & Philosophy
description: Aerospike CE Ecosystem의 설계 철학, 아키텍처 원칙, 기술 선택의 배경
sidebar_position: 2
scope: ecosystem
repos: [aerospike-py, acko, cluster-manager, plugins]
tags: [design, philosophy, architecture, principles]
last_updated: 2026-03-29
---

# Project Design & Philosophy

Aerospike CE Ecosystem의 설계 철학, 아키텍처 원칙, 기술 선택의 배경을 설명합니다.

---

## 1. 설계 철학

### 왜 이 에코시스템이 존재하는가

Aerospike Community Edition(CE)은 고성능 NoSQL 데이터베이스이지만, 커뮤니티 환경에서 다음과 같은 도구적 공백이 존재합니다:

- **공식 Kubernetes Operator 부재**: Aerospike Enterprise Edition에는 공식 AKO(Aerospike Kubernetes Operator)가 있으나, CE 사용자를 위한 Operator는 제공되지 않음
- **모던 Python 클라이언트 부재**: 기존 공식 Python 클라이언트는 C 바인딩(CFFI) 기반으로 async 지원, 타입 힌트, 현대적 Python 패턴 지원이 미흡
- **통합 관리 UI 부재**: CE 클러스터를 위한 웹 기반 관리 도구가 없어 CLI 의존도가 높음
- **AI 개발 도구 부재**: Aerospike 개발에 특화된 AI 어시스턴트 도구가 없음

이 에코시스템은 커뮤니티가 이러한 공백을 채우기 위해 만들어졌습니다. 각 프로젝트는 독립적으로 사용 가능하면서도, 함께 사용할 때 시너지를 발휘하도록 설계되었습니다.

### 핵심 가치

1. **Community-first**: CE 사용자의 실제 요구사항에 초점
2. **Quality over speed**: 빠른 릴리스보다 품질과 안정성 우선
3. **Developer experience**: 개발자 경험을 최우선으로 고려한 API 설계
4. **Transparency**: 모든 의사결정을 ADR로 기록, 오픈소스 공개

---

## 2. 아키텍처 원칙

### 2-1. Loose Coupling (느슨한 결합)

각 프로젝트는 독립적으로 사용할 수 있습니다:

- **aerospike-py**: ACKO 없이도 standalone Aerospike 클러스터와 사용 가능
- **ACKO**: aerospike-py 없이도 kubectl로 클러스터 관리 가능
- **cluster-manager**: ACKO 없이도 standalone 클러스터 관리 가능 (ACKO 연동은 선택)
- **plugins**: 어떤 프로젝트 조합에서든 독립 사용 가능

프로젝트 간 연동은 선택적(opt-in)이며, 필수 의존성이 아닌 확장 기능으로 제공됩니다.

### 2-2. Performance-first (성능 우선)

각 프로젝트의 핵심 컴포넌트는 성능을 최우선으로 설계했습니다:

| Project | Language | Why |
|---------|----------|-----|
| aerospike-py | Rust (PyO3) | Zero-copy, GIL-free 비동기 처리 |
| ACKO | Go | Kubernetes controller-runtime 네이티브 성능 |
| cluster-manager (backend) | Python (FastAPI) | aerospike-py와의 직접 통합, async 지원 |
| cluster-manager (frontend) | TypeScript (Next.js) | SSR, 최적화된 번들링 |

### 2-3. Declarative Management (선언적 관리)

Kubernetes의 선언적 패턴을 적극 활용합니다:

- **CRD**: AerospikeCluster Custom Resource로 원하는 상태 선언
- **Reconciliation**: Controller가 현재 상태를 원하는 상태로 자동 수렴
- **Infrastructure as Code**: Helm chart, YAML 템플릿으로 재현 가능한 배포
- **GitOps 친화**: ArgoCD, Flux 등과 호환되는 리소스 구조

### 2-4. AI-assisted Development (AI 지원 개발)

에코시스템 전체에 AI 개발 도구를 통합합니다:

- **Claude Code plugins**: 5개 Skills + 1개 Agent로 개발 생산성 향상
- **Agentic CI**: claude-code-action으로 PR 자동 리뷰 및 피드백
- **Agentic workflows**: AI가 코드 생성, 리뷰, 테스트, 문서화를 지원

### 2-5. CE Constraints as First-class Concerns (CE 제약 최우선 고려)

Aerospike CE의 라이선스 제약을 시스템 레벨에서 검증합니다:

- **Webhook validation**: ACKO가 CE 제약을 CRD 생성 시점에 검증
  - 클러스터 크기 8 노드 이하
  - Namespace 2개 이하
  - XDR (Cross-Datacenter Replication) 사용 불가
  - TLS 사용 불가
  - Security (ACL) 제한적 지원
- **명확한 에러 메시지**: Enterprise 기능 사용 시도 시 구체적인 안내 제공
- **Plugin Skills**: CE 제약을 인지한 코드 생성 및 가이드

---

## 3. 기술 선택 배경

### 3-1. Rust/PyO3 over CFFI

> Reference: [ADR-0001: PyO3 over CFFI](/docs/architecture/adr/pyo3-over-cffi)

aerospike-py는 기존 C 클라이언트의 CFFI 바인딩 대신 Rust/PyO3를 선택했습니다:

| 기준 | CFFI | Rust/PyO3 |
|------|------|-----------|
| 메모리 안전성 | C 수동 관리 | Rust 소유권 시스템 |
| Async 지원 | 제한적 | Tokio 네이티브 |
| 타입 안전성 | 런타임 에러 | 컴파일 타임 검증 |
| GIL 핸들링 | 수동 | PyO3 자동 관리 |
| 빌드 시스템 | setuptools + C 컴파일러 | maturin (cross-platform) |
| 배포 | 플랫폼별 바이너리 | manylinux wheel |

### 3-2. Kubebuilder v4

> Reference: [ADR-0002: Kubebuilder v4](/docs/architecture/adr/kubebuilder-v4)

ACKO는 Kubebuilder v4를 Operator 프레임워크로 선택했습니다:

- **Mature framework**: Kubernetes SIG에서 유지보수, 활발한 커뮤니티
- **CRD generation**: controller-gen으로 Go struct에서 CRD YAML 자동 생성
- **Webhook scaffolding**: 검증/변환 Webhook 보일러플레이트 자동 생성
- **Test framework**: envtest로 etcd 없이 단위 테스트 가능

### 3-3. Podman over Docker

> Reference: [ADR-0003: Podman over Docker](/docs/architecture/adr/podman-over-docker)

에코시스템 전체에서 Podman을 컨테이너 런타임으로 사용합니다:

- **Rootless**: 데몬 없이 일반 사용자 권한으로 컨테이너 실행
- **Daemonless**: 중앙 데몬 없이 각 컨테이너가 독립 프로세스
- **OCI-compatible**: Docker 이미지와 100% 호환
- **Pod 개념**: Kubernetes Pod와 유사한 네이티브 Pod 지원
- **보안**: SELinux, seccomp 프로필 기본 지원

### 3-4. Next.js + FastAPI

Cluster Manager의 기술 스택 선택 이유:

- **Next.js**: SSR/SSG, App Router, React Server Components, 최적화된 번들링
- **FastAPI**: Python async 네이티브, 자동 OpenAPI 문서, aerospike-py와 직접 통합
- **Tailwind CSS 4**: 유틸리티 퍼스트, 커스텀 디자인 시스템 구축 용이
- **Radix UI**: 접근성(a11y) 기반 헤드리스 컴포넌트, DaisyUI 대비 유연성

> Reference: [ADR-0005: DaisyUI 제거 및 Pure Tailwind CSS 4 전환](/docs/architecture/adr/daisyui-removal)

### 3-5-1. NamedTuple 반환 패턴

> Reference: [ADR-0004: Dict 대신 NamedTuple 반환 선택](/docs/architecture/adr/namedtuple-over-dict)

aerospike-py의 모든 반환값은 NamedTuple 패턴을 사용합니다:
- `record.bins`, `record.meta.gen`, `record.meta.ttl` — 속성 접근 방식
- IDE 자동완성과 타입 검사 지원

### 3-5-2. Semaphore Backpressure

> Reference: [ADR-0006: Semaphore 기반 Backpressure](/docs/architecture/adr/backpressure-semaphore)

동시 요청 과부하 방지를 위한 operation-level Semaphore:
- `BackpressureError` 예외로 즉시 피드백
- 서버 보호와 예측 가능한 에러 처리

### 3-5-3. Cluster-scoped Template

> Reference: [ADR-0007: Cluster-scoped AerospikeClusterTemplate](/docs/architecture/adr/cluster-scoped-template)

AerospikeClusterTemplate을 cluster-scoped CRD로 변환하여 namespace 간 재사용 가능:

### 3-5-4. IssueOps CI 워크플로우

> Reference: [ADR-0008: IssueOps 기반 CI 워크플로우](/docs/architecture/adr/issueops-ci-workflow)

GitHub Issues에서 AI 에이전트(claude-code-action)가 코드를 생성하는 자동화 워크플로우:
- Plan-first: 구현 전 반드시 계획 생성 및 리뷰
- IssueOps: Issue → Plan → Implement → PR 전체 흐름 자동화
- 에코시스템 전체 레포에 동일 패턴 적용

### 3-5-5. Unified BatchRecords API

> Reference: [ADR-0009: Unified BatchRecords API](/docs/architecture/adr/unified-batch-records-api)

모든 batch 연산의 반환 타입을 `BatchRecords` NamedTuple로 통일:
- per-record `result_code`로 개별 레코드 성공/실패 추적
- `succeeded`/`failed` 카운트로 빠른 성공률 확인

### 3-5-6. 3-Layer Observability Stack

> Reference: [ADR-0010: 3-Layer Observability Stack](/docs/architecture/adr/observability-stack)

Logging + Metrics + Tracing 3계층 관측성:
- Rust tracing → Python logging bridge
- Prometheus exposition format 호환 metrics
- OpenTelemetry distributed tracing

### 3-6. Docusaurus

모든 프로젝트의 문서 플랫폼으로 Docusaurus를 선택했습니다:

- **React-based**: 커스텀 컴포넌트, MDX 지원
- **i18n**: 내장 다국어 지원 (EN/KO)
- **Versioning**: 릴리스별 문서 버전 자동 관리
- **Mermaid**: 다이어그램 네이티브 지원
- **Search**: Algolia DocSearch 또는 로컬 검색 지원
- **GitHub Pages**: 무료 배포, CI/CD 연동 용이

---

## 4. 프로젝트 구조 원칙

### 4-1. Monorepo Ecosystem with Independent Repos

프로젝트 허브(project-hub)가 에코시스템 전체를 조율하고, 각 프로젝트는 독립 레포지토리로 관리됩니다:

```
aerospike-ce-ecosystem/          # GitHub Organization
  project-hub/                   # 중앙 조율 (이 레포)
    docs/                        # 통합 문서
  aerospike-py/                  # Python 클라이언트
  aerospike-ce-kubernetes-operator/  # K8s Operator (ACKO)
  aerospike-cluster-manager/     # 관리 UI
  aerospike-ce-ecosystem-plugins/    # Claude Code 플러그인
```

이 구조의 장점:
- 각 프로젝트의 독립적인 CI/CD 파이프라인
- 프로젝트별 이슈 트래킹과 릴리스 사이클
- 선택적 사용 (필요한 프로젝트만 clone)
- project-hub에서 전체 조율 및 호환성 관리

### 4-2. Shared Label System

모든 레포지토리에서 통일된 라벨 시스템을 사용하여 크로스-레포 조율을 합니다:

- `cross-repo`: 다른 프로젝트에 영향을 주는 변경
- `breaking-change`: 호환성에 영향을 주는 변경
- `release`: 릴리스 관련 작업
- `agentic`: AI 워크플로우 관련

### 4-3. Cross-repo Review Process

프로젝트 간 영향을 주는 변경은 크로스-레포 리뷰 프로세스를 거칩니다:

1. 영향 범위 분석 (어떤 프로젝트에 영향?)
2. 호환성 테스트 (Release Compatibility Matrix 업데이트)
3. 문서 동기화 (관련 문서 일괄 업데이트)
4. 릴리스 조율 (필요 시 동시 릴리스)

### 4-4. Release Compatibility Matrix

[Release Compatibility Matrix](/docs/history/releases/release-matrix)에서 프로젝트 간 호환 버전을 추적합니다. 신규 릴리스 시 반드시 매트릭스를 업데이트하여 호환성을 보장합니다.
