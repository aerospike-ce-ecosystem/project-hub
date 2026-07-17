---
title: "ADR-0040: Multi-Cluster Topology and Keycloak OIDC for ACKO + Cluster-Manager"
description: ACKO의 multi-cluster topology와 Keycloak 기반 OIDC 인증 방식을 정의한 결정
sidebar_position: 40
scope: ecosystem
repos: [acko, cluster-manager, plugins]
tags: [adr, acko, cluster-manager, kubernetes, helm, oidc, keycloak, multi-cluster, security]
last_updated: 2026-07-17
---

# ADR-0040: Multi-Cluster Topology and Keycloak OIDC for ACKO + Cluster-Manager

## 상태

**Accepted**

- 제안일: 2026-05-05
- 승인일: 2026-05-05

## 맥락 (Context)

기존 ACKO Helm chart는 하나의 cluster만 가정했습니다. Web, API, Operator를 같은 namespace에 배포하는 topology로만 검증돼 있어 다음과 같은 운영 요구를 충족하기 어려웠습니다.

- **환경 분리**: dev와 production Aerospike cluster를 서로 다른 Kubernetes cluster에 배치하되 하나의 진입점에서 관리해야 합니다.
- **권한 분리**: 여러 개발자가 사용하는 dev와 SRE만 접근하는 production에 서로 다른 RBAC policy를 적용해야 합니다.
- **외부 인증 연동**: 자체 인증을 운영하지 않고 조직의 Keycloak을 사용해 SSO, MFA, audit logging을 활용해야 합니다.

Single-cluster 가정에서는 common Web cluster와 여러 Operator cluster의 관계를 Helm values로 표현할 수 없었습니다. API 인증도 지원하지 않거나 최소한의 bearer token만 사용하는 수준이었습니다.

### 인증 측면 추가 배경

- Aerospike CE는 LDAP 또는 OIDC와 직접 연동하는 Enterprise security 기능을 제공하지 않습니다. 따라서 Cluster Manager 계층에서 IdP 기반 access control을 적용하는 것이 현실적입니다.
- ADR-0030은 Cluster Manager의 authentication interface를 마련했지만 어떤 external IdP와 어떻게 연동할지는 정하지 않았습니다.

## 결정 (Decision)

> **ACKO Helm chart에 "common cluster + 환경별 operator cluster" 토폴로지를 1급 옵션으로 추가하고, 인증 표준은 Keycloak을 외부 IdP로 두고 FastAPI가 native하게 JWT를 검증(JWKS)하는 방식으로 통일한다.**

이 결정은 다음 다섯 부분으로 구성됩니다.

### 1. 토폴로지: common cluster + per-environment operator cluster

- **common cluster**에는 Web SPA만 배포하며 사용자가 처음 접근하는 진입점으로 사용합니다.
- **environment별 Operator cluster**에는 API와 Operator를 배포합니다. 각 instance는 같은 환경의 Aerospike cluster와 registry view만 관리합니다.
- Common cluster의 Web Pod는 ConfigMap volume으로 mount한 `/cluster-registry.json`을 읽어 사용 가능한 cluster 목록을 표시합니다.

이 topology는 ACKO chart의 `multiCluster.enabled`와 `multiCluster.clusters[]` values로 설정합니다.

### 2. Browser → 각 cluster ingress 직접 호출 (proxy.js 라우팅 없음)

기존에는 Cluster Manager의 `proxy.js`가 여러 backend로 request를 전달했습니다. 새 topology에서는 browser가 environment별 Ingress host를 직접 호출합니다.

- 각 Operator cluster는 자체 API Ingress를 가집니다(예: `api.dev.example.com`, `api.prod.example.com`).
- Common cluster의 Web에는 static cluster registry를 ConfigMap으로 mount합니다. Browser는 이 정보를 읽어 선택한 host를 직접 호출합니다.
- `proxy.js`의 multi-backend branch와 common cluster의 dynamic routing 책임은 제거합니다.

### 3. Cluster registry source-of-truth = static helm values + ConfigMap volume

- Chart `values.yaml`의 `multiCluster.clusters[]`를 cluster registry의 source of truth로 사용합니다.
- Helm template은 이 값을 `cluster-registry` ConfigMap으로 render하고 Web Pod의 `/cluster-registry.json`에 mount합니다.
- Runtime cluster discovery나 database를 통한 dynamic registration은 지원하지 않습니다. Cluster 목록은 Helm upgrade로만 바꿀 수 있게 해 configuration 변경 경로를 하나로 유지합니다.

### 4. 인증 = Keycloak external + FastAPI native JWT 검증

- 외부 Keycloak의 단일 `acko` realm을 IdP로 사용합니다.
- SPA는 PKCE를 사용하는 `acko-spa` public client로 등록하고, API token의 audience는 `acko-api`로 설정합니다.
- FastAPI는 JWKS를 cache하고 RS256 access token의 signature, `acko-api` audience, issuer를 검증합니다. 첫 단계에서는 Ingress 앞에 별도의 oauth2-proxy나 auth service를 두지 않습니다.
- Authorization은 `realm_access.roles[]`에 기반한 단순한 RBAC를 사용합니다. Cluster별 role은 `acko:dev`, `acko:prod` 형식으로 이름을 붙입니다. Role을 설정하지 않은 초기 구성에서는 인증된 사용자에게 read-only access를 허용하는 방향을 기본으로 합니다.

### 5. local/e2e: bitnami/keycloak 부트스트랩

- Local development와 E2E CI에서는 `bitnami/keycloak` chart를 설치하고 미리 준비한 realm export(`acko-realm.json`)를 import합니다.
- Production Keycloak의 운영 책임을 ACKO chart에 포함하지 않고, E2E fixture로만 제공한다는 점은 local E2E에서 jetstack/cert-manager를 사용하는 기존 원칙과 같습니다.

## 대안 (Alternatives Considered)

### 대안 A: Common cluster proxy.js multi-backend routing 유지

- **설명**: 기존 `proxy.js`를 유지하고 dev와 production backend를 path 또는 host에 따라 routing합니다.
- **장점**: 변경해야 할 code가 가장 적습니다.
- **단점**: Kubernetes의 일반적인 Ingress pattern과 다르며, Web Pod가 모든 backend Ingress에 접근할 수 있는 cross-cluster network가 필요합니다. 또한 `proxy.js`가 multi-cluster topology 전체의 single point of failure가 됩니다.
- **미선택 사유**: Cluster 간 routing 책임이 Web Pod에 집중되어 운영이 복잡해지고 표준 Ingress 구성을 활용하기 어렵습니다.

### 대안 B: Bearer token (Keycloak 없음)

- **설명**: Static token 또는 자체 발급 token만으로 API를 보호합니다.
- **장점**: 외부 dependency가 필요하지 않습니다.
- **단점**: Rotation, expiration, audit policy를 직접 구현해야 합니다. SSO, MFA, external directory와 연동할 수 없고 운영자가 user와 group도 직접 관리해야 합니다.
- **미선택 사유**: 조직의 IdP를 사용한다는 요구사항과 security operation 기준을 충족하지 못합니다.

### 대안 C: Ingress 단에서 oauth2-proxy / Keycloak gatekeeper로 종단 보호

- **설명**: 모든 Ingress 앞에 oauth2-proxy를 두고 인증을 강제하며, FastAPI는 `X-Auth-Request-*` header만 신뢰합니다.
- **장점**: 널리 사용하는 pattern이며 defense in depth를 제공합니다.
- **단점**: Cookie domain, CSRF, multi-cluster session synchronization이 복잡해집니다. Proxy가 token lifecycle을 관리하므로 SSE와 장시간 stream의 호환성도 검증해야 합니다.
- **미선택 사유**: 첫 단계의 범위로는 변경이 너무 큽니다. FastAPI native JWT 검증을 안정화한 뒤 별도의 ADR에서 추가 security layer로 검토합니다.

### 대안 D: Keycloak을 chart의 subchart로 In-chart bundle (production)

- **설명**: ACKO chart의 `dependencies:`에 `bitnami/keycloak`을 추가해 production에도 함께 설치합니다.
- **장점**: 한 번의 Helm install로 모든 component를 배포할 수 있습니다.
- **단점**: Keycloak database, backup, realm 관리까지 ACKO chart가 책임져야 합니다. 이미 IdP를 중앙에서 운영하는 조직에도 별도 Keycloak을 강제로 설치하게 됩니다.
- **미선택 사유**: Production에서는 외부에서 관리하는 Keycloak을 사용하고, bundled Keycloak은 Local/E2E fixture로만 제공합니다.

## 결과 (Consequences)

### 긍정적

- Cluster-per-environment pattern을 Helm values와 표준 Ingress/Service만으로 구성할 수 있습니다.
- Staging 같은 환경을 추가할 때 `multiCluster.clusters[]` 항목과 해당 cluster의 Helm release만 추가하면 됩니다.
- SSO, MFA, audit logging, account lifecycle을 조직의 IdP에 위임할 수 있습니다.
- `proxy.js`를 제거하면 Web 계층이 stateless static asset에 가까워져 cache와 CDN을 활용하기 쉽습니다.
- ADR-0030에서 열어 둔 external IdP integration 방식을 구체적으로 정의합니다.

### 부정적

- Cluster 수가 늘어나는 만큼 TLS certificate도 각각 운영해야 합니다. cert-manager와 Let's Encrypt 사용을 권장합니다.
- 모든 API가 하나의 `acko-api` audience를 사용하므로 token을 cluster 사이에서 replay할 가능성이 있습니다. 첫 단계에서는 `acko:dev`, `acko:prod` role로 권한을 나누고, audience 분리는 후속 ADR에서 검토합니다.
- 각 Operator cluster의 PostgreSQL connection profile은 해당 cluster에만 저장됩니다. Cross-cluster aggregation에는 별도 설계가 필요합니다.
- Common cluster의 Web에서 여러 Ingress를 직접 호출하므로 모든 Ingress의 mixed-content와 CORS 설정을 일관되게 유지해야 합니다.

### 리스크

- Keycloak을 사용할 수 없으면 Web과 API 인증도 실패합니다. Keycloak의 availability와 disaster recovery를 별도로 확보해야 합니다.
- JWKS rotation 직후 FastAPI cache가 만료되고 새 key를 가져오는 짧은 구간에 5xx가 발생할 수 있습니다. Cache TTL과 retry policy를 조정해야 합니다.
- Static cluster registry를 사용하므로 cluster를 추가하거나 삭제할 때 Helm upgrade가 필요합니다. 임시 cluster를 runtime에 등록하는 방식은 지원하지 않습니다.

## 후속 작업 (TODO / Open Questions)

이 ADR은 첫 단계만 정의합니다. 아래 항목은 범위와 security 영향이 다르므로 후속 ADR에서 결정합니다.

- **Ingress 단 oauth2-proxy / Keycloak gatekeeper** — defense-in-depth. native JWT 검증과 병행 가능.
- **Keycloak realm/client 자동 프로비저닝** — Terraform Keycloak provider로 realm/client/audience mapper IaC화.
- **mTLS (proxy ↔ API)** — service mesh 기반 또는 cert-manager 기반.
- **Cross-cluster 메트릭/로그 federation** — Prometheus federation, Loki multi-tenant.
- **멀티 kind e2e (stage-2)** — 현재는 single kind에 namespace로 common/operator를 흉내내지만, 진정한 multi-cluster e2e는 별도 stage.
- **PostgreSQL connection-profile cross-cluster aggregation** — 현재는 cluster마다 DB가 silo. 통합 view 필요시 별도 결정.
- **Audience 분리 (`acko-api-dev`, `acko-api-prod`)** — replay 차단을 강화하려면 cluster별 audience.

## 보완 (Amendments)

### 2026-07-17 — SSE 스트림 인증: JWT query parameter → 단일 사용 stream ticket

이 ADR을 처음 구현할 때 native `EventSource`가 `Authorization` header를 설정할 수 없어 SSE endpoint에만 JWT를 URL query(`?access_token=<jwt>`)로 전달했습니다. 장기 유효 token이 Ingress access log, browser history, `Referer` header에 노출될 수 있어 P0 security issue로 추적했습니다(cluster-manager [#345](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/issues/345)). Cluster Manager [#454](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/454)는 이를 다음과 같은 one-time stream ticket으로 교체했습니다.

- **발급**: `POST /api/events/ticket`은 `Authorization` header 인증만 허용하고 query credential은 거부합니다. 검증한 claim에 binding된 256-bit opaque ticket을 발급합니다. TTL은 30초(`SSE_TICKET_TTL_SECONDS`)이고 동시에 대기할 수 있는 ticket은 최대 1,024개입니다(`SSE_TICKET_MAX_PENDING`). 한도를 넘으면 429를 반환합니다.
- **소비**: `GET /events/stream?ticket=...`에서 처음 사용한 ticket은 즉시 폐기하므로 재사용하면 401을 반환합니다. Redeem할 때 ticket claim을 기준으로 `OIDC_REQUIRED_ROLES`를 다시 확인합니다.
- **기존 경로 제거**: `?access_token=`은 JWKS 검증 없이 401과 migration hint를 반환합니다. `curl`과 ackoctl이 사용하는 header 기반 streaming은 그대로 동작합니다. Request log에서는 `?ticket=` value도 masking합니다.
- **제약**: Ticket store는 process-local입니다. API를 여러 replica로 배포한다면 `/api/*` session affinity 또는 shared store가 필요합니다. 이 ADR이 정의한 Operator cluster당 API replica 하나의 topology에는 영향을 주지 않습니다.

## 관련 ADR

- [ADR-0007: Cluster-scoped AerospikeClusterTemplate](./2026-03-12-cluster-scoped-template.md) — 각 operator cluster가 자기 namespace의 Aerospike 클러스터를 관리하는 cluster-scoped 패턴
- [ADR-0030: Cluster Manager API 인증/인가 아키텍처 및 보안 헤더 강화](./2026-03-30-auth-security-headers.md) — 본 ADR이 채우는 외부 IdP 연동 자리의 출발점
- [ADR-0038: ACKO 외부 네트워크 접근 — Per-pod LoadBalancer/NodePort 서비스](./2026-04-05-external-network-access.md) — 외부 클라이언트 접근의 네트워크 측면 (본 ADR은 인증 측면)
- [ADR-0045: ACKO Helm Chart 버전 관리 체계](./2026-04-07-helm-chart-oci-dual-chart.md) — 본 ADR로 추가되는 multiCluster values는 동일 chart 릴리스 체계를 따른다

## 참고 자료

- [Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/) — realm/client/role 모델
- [Keycloak — Securing Applications Overview](https://www.keycloak.org/securing-apps/overview) — OIDC 클라이언트 가이드 (PKCE, audience)
- [bitnami/keycloak Helm chart](https://github.com/bitnami/charts/tree/main/bitnami/keycloak) — local/e2e 부트스트랩
- [cert-manager](https://cert-manager.io/docs/) — multi-cluster TLS 인증서 운영
- [Terraform Keycloak Provider](https://registry.terraform.io/providers/keycloak/keycloak/latest/docs) — 후속 IaC 자동화 후보
