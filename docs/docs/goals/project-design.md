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

이 문서는 Aerospike CE Ecosystem이 어떤 원칙으로 설계되었고, 주요 기술을 왜 선택했는지 설명합니다.

---

## 1. 설계 철학

### 왜 이 에코시스템이 존재하는가

Aerospike Community Edition(CE)은 고성능 NoSQL 데이터베이스이지만, 커뮤니티 사용자가 운영에 필요한 도구를 직접 마련해야 하는 경우가 많습니다.

- **Kubernetes Operator 부재**: 공식 AKO(Aerospike Kubernetes Operator)는 Enterprise Edition용이며, CE용 Operator는 제공되지 않습니다.
- **현대적인 Python 클라이언트 부재**: 공식 Python 클라이언트는 CFFI 기반입니다. native async, 정확한 type hint, 현대적인 Python API를 충분히 제공하지 못합니다.
- **통합 관리 UI 부재**: CE 클러스터를 관리할 웹 도구가 없어 운영자가 CLI에 크게 의존합니다.
- **AI 개발 도구 부재**: Aerospike 개발과 운영에 특화된 AI 지원 도구가 없습니다.

이 에코시스템은 이러한 공백을 오픈소스 도구로 채웁니다. 각 프로젝트는 독립적으로 사용할 수 있으며, 함께 구성하면 같은 API와 운영 흐름을 공유합니다.

### 핵심 가치

1. **Community-first**: CE 사용자가 실제로 겪는 문제를 우선합니다.
2. **Quality over speed**: 릴리스 속도보다 안정성과 완성도를 중시합니다.
3. **Developer experience**: API를 사용할 개발자와 운영자의 경험을 설계 기준으로 삼습니다.
4. **Transparency**: 중요한 결정을 ADR로 남기고 공개합니다.

---

## 2. 아키텍처 원칙

### 2-1. Loose Coupling (느슨한 결합)

각 프로젝트는 다른 구성요소를 강제로 요구하지 않습니다.

- **aerospike-py**는 ACKO 없이 standalone Aerospike 클러스터에 연결할 수 있습니다.
- **ACKO**는 aerospike-py 없이도 `kubectl`로 운영할 수 있습니다.
- **cluster-manager**는 ACKO 없이 standalone 클러스터를 관리할 수 있습니다. ACKO 연동은 선택 사항입니다.
- **plugins**는 사용 중인 프로젝트 조합에 맞춰 필요한 Skill만 제공합니다.

프로젝트 간 연동은 opt-in 방식입니다. 통합 기능을 사용하지 않아도 각 프로젝트의 핵심 기능은 동작합니다.

### 2-2. Performance-first (성능 우선)

성능이 중요한 경로에는 해당 작업에 적합한 언어와 runtime을 사용합니다.

| Project | Language | Why |
|---------|----------|-----|
| aerospike-py | Rust (PyO3) | Zero-copy, GIL-free 비동기 처리 |
| ACKO | Go | Kubernetes controller-runtime 네이티브 성능 |
| cluster-manager (backend) | Python (FastAPI) | aerospike-py와의 직접 통합, async 지원 |
| cluster-manager (frontend) | TypeScript (Next.js) | SSR, 최적화된 번들링 |

### 2-3. Declarative Management (선언적 관리)

Kubernetes 리소스에는 선언적 관리 방식을 적용합니다.

- **CRD**: `AerospikeCluster` Custom Resource에 원하는 상태를 선언합니다.
- **Reconciliation**: Controller가 현재 상태를 확인하고 원하는 상태로 수렴시킵니다.
- **Infrastructure as Code**: Helm chart와 YAML 템플릿으로 같은 배포를 재현합니다.
- **GitOps**: 리소스 구조는 Argo CD와 Flux 같은 GitOps 도구에서 사용할 수 있습니다.

### 2-4. AI-assisted Development (AI 지원 개발)

AI는 기존 개발·운영 절차를 대체하지 않고, 반복 작업을 줄이는 도구로 사용합니다.

- **Claude Code plugins**: 별도 Agent 없이 9개 Skill로 개발과 운영 절차를 안내합니다.
- **Agentic CI**: `claude-code-action`이 PR을 검토하고 피드백을 남깁니다.
- **Agentic workflows**: AI가 코드 작성, 리뷰, 테스트, 문서화를 보조합니다.

### 2-5. CE Constraints as First-class Concerns (CE 제약 최우선 고려)

Aerospike CE의 제약은 문서에만 적어두지 않고 시스템에서 직접 검증합니다.

- **Webhook validation**: ACKO는 CR을 받아들이기 전에 CE 제약을 검사합니다.
  - 클러스터 크기 8 노드 이하
  - Namespace 2개 이하
  - XDR (Cross-Datacenter Replication) 사용 불가
  - TLS 사용 불가
  - Security (ACL) 제한적 지원
- **명확한 오류 메시지**: Enterprise 기능을 요청하면 사용할 수 없는 이유와 수정 방법을 안내합니다.
- **Plugin Skills**: 코드와 예제를 제안할 때 CE 제약을 반영합니다.

---

## 3. 기술 선택 배경

### 3-1. Rust/PyO3 over CFFI

> Reference: [ADR-0001: PyO3 over CFFI](/docs/architecture/adr/2026-01-15-pyo3-over-cffi)

aerospike-py는 C 클라이언트의 CFFI binding 대신 Rust/PyO3로 구현됩니다. 주요 차이는 다음과 같습니다.

| 기준 | CFFI | Rust/PyO3 |
|------|------|-----------|
| 메모리 안전성 | C 수동 관리 | Rust 소유권 시스템 |
| Async 지원 | 제한적 | Tokio 네이티브 |
| 타입 안전성 | 런타임 에러 | 컴파일 타임 검증 |
| GIL 핸들링 | 수동 | PyO3 자동 관리 |
| 빌드 시스템 | setuptools + C 컴파일러 | maturin (cross-platform) |
| 배포 | 플랫폼별 바이너리 | manylinux wheel |

### 3-2. Kubebuilder v4

> Reference: [ADR-0002: Kubebuilder v4](/docs/architecture/adr/2026-01-18-kubebuilder-v4)

ACKO는 Kubernetes API와 controller-runtime 생태계를 따르기 위해 Kubebuilder v4를 사용합니다.

- **Mature framework**: Kubernetes SIG가 유지보수하며 관련 자료와 사용자 기반이 충분합니다.
- **CRD generation**: `controller-gen`이 Go struct에서 CRD YAML을 생성합니다.
- **Webhook scaffolding**: validation/conversion Webhook의 기본 구조를 생성합니다.
- **Test framework**: `envtest`로 별도 Kubernetes 클러스터 없이 controller 통합 테스트를 실행할 수 있습니다.

### 3-3. Podman over Docker

> Reference: [ADR-0003: Podman over Docker](/docs/architecture/adr/2026-02-01-podman-over-docker)

로컬 개발과 테스트의 기본 container runtime은 Podman입니다.

- **Rootless**: 일반 사용자 권한으로 container를 실행할 수 있습니다.
- **Daemonless**: 중앙 daemon 없이 각 container를 독립 프로세스로 관리합니다.
- **OCI-compatible**: 표준 OCI image와 runtime 규격을 사용합니다.
- **Pod 지원**: Kubernetes Pod와 유사한 단위로 여러 container를 묶을 수 있습니다.
- **보안 기능**: SELinux와 seccomp profile을 지원합니다.

### 3-4. Next.js + FastAPI

Cluster Manager는 backend와 frontend의 역할에 맞춰 다음 기술을 사용합니다.

- **Next.js**: App Router, React Server Components, SSR/SSG, bundle optimization을 제공합니다.
- **FastAPI**: Python async와 OpenAPI를 기본 지원하며 aerospike-py와 직접 연동됩니다.
- **Tailwind CSS 4**: CSS 변수와 utility class로 자체 디자인 시스템을 구성합니다.
- **Custom UI Components**: 접근성(a11y)을 고려한 자체 component를 사용해 외부 UI library 의존성을 줄입니다.

> Reference: [ADR-0005: DaisyUI 제거 및 Pure Tailwind CSS 4 전환](/docs/architecture/adr/2026-02-25-daisyui-removal)

### 3-5-1. NamedTuple 반환 패턴

> Reference: [ADR-0004: Dict 대신 NamedTuple 반환 선택](/docs/architecture/adr/2026-02-10-namedtuple-over-dict)

aerospike-py의 구조화된 반환값에는 `NamedTuple`을 사용합니다.
- `record.bins`, `record.meta.gen`, `record.meta.ttl`처럼 속성으로 값에 접근할 수 있습니다.
- IDE 자동완성과 static type checking을 사용할 수 있습니다.

### 3-5-2. Semaphore Backpressure

> Reference: [ADR-0006: Semaphore 기반 Backpressure](/docs/architecture/adr/2026-03-05-backpressure-semaphore)

operation 단위의 Semaphore가 동시 요청 수를 제한합니다.

- 허용량을 넘으면 `BackpressureError`를 즉시 반환합니다.
- 서버를 과부하로부터 보호하고 호출자가 오류를 예측 가능하게 처리하도록 합니다.

### 3-5-3. Cluster-scoped Template

> Reference: [ADR-0007: Cluster-scoped AerospikeClusterTemplate](/docs/architecture/adr/2026-03-12-cluster-scoped-template)

`AerospikeClusterTemplate`은 cluster-scoped CRD이므로 여러 namespace에서 같은 template을 재사용할 수 있습니다.

### 3-5-4. IssueOps CI 워크플로우

> Reference: [ADR-0008: IssueOps 기반 CI 워크플로우](/docs/architecture/adr/2026-03-10-issueops-ci-workflow)

GitHub Issue에서 시작한 작업을 `claude-code-action`이 구현 PR까지 이어갑니다.

- **Plan-first**: 구현 전에 계획을 작성하고 검토합니다.
- **IssueOps**: Issue → Plan → Implement → PR 흐름을 자동화합니다.
- 모든 에코시스템 레포에 같은 기본 패턴을 적용합니다.

### 3-5-5. Unified BatchRecords API

> Reference: [ADR-0009: Unified BatchRecords API](/docs/architecture/adr/2026-03-20-unified-batch-records-api)

모든 batch operation은 `BatchRecords` `NamedTuple`을 반환합니다.

- 각 record의 `result_code`로 성공과 실패를 확인할 수 있습니다.
- `succeeded`와 `failed` count로 전체 결과를 빠르게 요약할 수 있습니다.

### 3-5-6. 3-Layer Observability Stack

> Reference: [ADR-0010: 3-Layer Observability Stack](/docs/architecture/adr/2026-02-05-observability-stack)

관측성은 Logging, Metrics, Tracing의 세 계층으로 구성됩니다.
- Rust tracing → Python logging bridge
- Prometheus exposition format 호환 metrics
- OpenTelemetry distributed tracing

### 3-5-7. CRD Rename (AerospikeCluster)

> Reference: [ADR-0011: CRD Rename](/docs/architecture/adr/2026-03-10-crd-rename-aerospikecluster)

CRD 이름에서 불필요한 CE 접두사를 제거해 API를 단순화했습니다.
- Short name: `asc`, `ascluster`
- Breaking change: 기존 CR 재생성 필요

### 3-5-8. Pod Readiness Gates

> Reference: [ADR-0012: Pod Readiness Gates](/docs/architecture/adr/2026-02-20-pod-readiness-gates)

`acko.io/aerospike-ready` custom readiness gate는 Pod가 cluster mesh에 합류하고 migration을 마친 뒤에만 Service endpoint에 포함시킵니다. 이 조건은 rolling update 중 준비되지 않은 Pod로 traffic이 전달되는 것을 막습니다.

### 3-5-9. Reconciliation Circuit Breaker

> Reference: [ADR-0013: Reconciliation Circuit Breaker](/docs/architecture/adr/2026-03-01-reconciliation-circuit-breaker)

Reconciliation에는 5분 context timeout과 exponential backoff를 적용합니다. 10회 연속 실패하면 circuit breaker가 열려 API server에 반복 요청이 쌓이는 것을 막습니다. 일시적인 오류가 사라지면 operator가 다시 조정을 시도합니다.

### 3-5-10. PostgreSQL Migration

> Reference: [ADR-0014: SQLite → PostgreSQL Migration](/docs/architecture/adr/2026-02-10-postgresql-migration)

Cluster Manager backend의 기본 database는 `asyncpg` 기반 PostgreSQL입니다. 로컬 개발에서는 SQLite fallback을 사용할 수 있으며, `DatabaseBackend` protocol이 두 backend의 공통 interface를 정의합니다.

### 3-5-11. asinfo Health Checks

> Reference: [ADR-0015: asinfo 기반 Health Check](/docs/architecture/adr/2026-03-05-asinfo-health-checks)

단순 TCP 연결 대신 `asinfo` 명령으로 Aerospike의 실제 상태를 확인합니다.
- Liveness: `asinfo -v 'build'` (프로세스 생존 확인)
- Readiness: `asinfo -v 'cluster-size'` (클러스터 합류 확인)

### 3-6. Docusaurus

웹으로 배포하는 프로젝트 문서는 Docusaurus로 작성합니다.

- **React-based**: 커스텀 컴포넌트, MDX 지원
- **i18n**: 내장 다국어 지원 (EN/KO)
- **Versioning**: 릴리스별 문서 버전 자동 관리
- **Mermaid**: 다이어그램 네이티브 지원
- **Search**: Algolia DocSearch 또는 로컬 검색 지원
- **GitHub Pages**: 무료 배포, CI/CD 연동 용이

---

## 4. 프로젝트 구조 원칙

### 4-1. Monorepo Ecosystem with Independent Repos

project-hub가 에코시스템 차원의 계획과 기록을 모으고, 각 프로젝트의 코드는 독립된 repository에서 관리합니다.

```
aerospike-ce-ecosystem/          # GitHub Organization
  project-hub/                   # 중앙 조율 (이 레포)
    docs/                        # 통합 문서
  aerospike-py/                  # Python 클라이언트
  aerospike-ce-kubernetes-operator/  # K8s Operator (ACKO)
  aerospike-cluster-manager/     # 관리 UI
  aerospike-ce-ecosystem-plugins/    # Claude Code 플러그인
```

이 구조는 다음과 같은 장점이 있습니다.
- 프로젝트마다 CI/CD pipeline과 release cycle을 독립적으로 운영할 수 있습니다.
- 이슈와 PR의 책임 범위가 명확합니다.
- 사용자는 필요한 프로젝트만 clone할 수 있습니다.
- project-hub에서 cross-repo 일정과 호환성을 함께 관리할 수 있습니다.

### 4-2. Shared Label System

모든 repository는 같은 핵심 label을 사용해 cross-repo 작업을 표시합니다.

- `cross-repo`: 다른 프로젝트에 영향을 주는 변경
- `breaking-change`: 호환성에 영향을 주는 변경
- `release`: 릴리스 관련 작업
- `agentic`: AI 워크플로우 관련

### 4-3. Cross-repo Review Process

다른 프로젝트에 영향을 주는 변경은 다음 순서로 검토합니다.

1. 영향을 받는 프로젝트와 공개 계약을 확인합니다.
2. 호환성을 검증하고 Release Compatibility Matrix를 업데이트합니다.
3. 관련 문서와 예제를 같은 변경에서 맞춥니다.
4. 필요한 경우 릴리스 순서와 일정을 조율합니다.

### 4-4. Release Compatibility Matrix

[Release Compatibility Matrix](/docs/history/releases/release-matrix)는 함께 사용할 수 있는 프로젝트 버전을 보여줍니다. 새 버전을 릴리스할 때는 matrix도 함께 업데이트합니다.
