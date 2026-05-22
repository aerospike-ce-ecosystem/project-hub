---
title: "ADR-0040: Multi-Cluster Topology and Keycloak OIDC for ACKO + Cluster-Manager"
description: ACKO Helm chart를 multi-cluster 토폴로지(common + per-environment operator cluster)로 확장하고, FastAPI native JWT 검증 + Keycloak external IdP를 표준 인증 수단으로 채택하는 결정.
sidebar_position: 40
scope: ecosystem
repos: [acko, cluster-manager, plugins]
tags: [adr, acko, cluster-manager, kubernetes, helm, oidc, keycloak, multi-cluster, security]
last_updated: 2026-05-05
---

# ADR-0040: Multi-Cluster Topology and Keycloak OIDC for ACKO + Cluster-Manager

## 상태

**Accepted**

- 제안일: 2026-05-05
- 승인일: 2026-05-05

## 맥락 (Context)

지금까지 ACKO Helm chart는 단일 cluster를 가정했고, web/api/operator가 같은 namespace에 함께 배포되는 single-cluster 토폴로지로만 검증되어 있었다. 이 구조에서는 다음과 같은 운영 시나리오를 수용하기 어렵다.

- 환경 분리 운영: dev/prod Aerospike cluster를 서로 다른 Kubernetes cluster에 배치하면서 단일 진입점에서 모두 관리
- 권한 분리: dev cluster는 다수의 개발자가 자유롭게 접근 / prod cluster는 SRE만 접근하는 RBAC 정책
- 인증의 외부화: 자체 인증 구현이 아니라, 조직 표준 IdP(Keycloak)와 통합하여 SSO/MFA/감사로깅 활용

기존 single-cluster 가정 때문에 "common(웹) cluster ↔ 다수의 operator cluster" 구조를 chart 차원에서 표현할 수 없었고, API 인증은 미지원 또는 최소한의 BearerToken 수준이었다.

### 인증 측면 추가 배경

- Aerospike CE에는 enterprise 보안 기능(LDAP/OIDC 직접 연동)이 없다. 따라서 web 계층(cluster-manager)에 IdP-fronted 접근 제어를 두는 것이 현실적이다.
- ADR-0030 (Cluster Manager API 인증/인가 아키텍처 및 보안 헤더 강화)에서 인증 인터페이스의 자리만 마련해 두었고 외부 IdP 연동 표준은 결정되어 있지 않았다.

## 결정 (Decision)

> **ACKO Helm chart에 "common cluster + 환경별 operator cluster" 토폴로지를 1급 옵션으로 추가하고, 인증 표준은 Keycloak을 외부 IdP로 두고 FastAPI가 native하게 JWT를 검증(JWKS)하는 방식으로 통일한다.**

구체 결정은 다음 5가지로 구성된다.

### 1. 토폴로지: common cluster + per-environment operator cluster

- **common cluster**: web (SPA) 만 배포. 사용자가 가장 먼저 접근하는 진입점.
- **operator cluster (dev / prod)**: api + operator + 자기 cluster의 Aerospike만 다룬다. 자기 환경의 cluster registry view만 가진다.
- common cluster의 web pod는 ConfigMap volume으로 마운트된 `/cluster-registry.json`을 읽어 사용자에게 클러스터 목록을 보여준다.

ACKO chart의 `multiCluster.enabled`, `multiCluster.clusters[]` values 키로 이 토폴로지를 표현한다.

### 2. Browser → 각 cluster ingress 직접 호출 (proxy.js 라우팅 없음)

기존 cluster-manager의 `proxy.js`가 backend를 다중 라우팅하던 패턴 대신, 브라우저가 환경별 ingress(host)를 직접 호출하는 fan-out 모델을 채택한다.

- 각 operator cluster에는 자기만의 API ingress (`api.dev.example.com`, `api.prod.example.com`) 가 있다.
- common cluster의 web에는 정적 cluster registry가 ConfigMap으로 mount되어 있고, 브라우저는 그 정보를 읽어 직접 그 host를 호출한다.
- proxy.js의 multi-backend 분기 로직, common cluster의 동적 routing 책임 모두 제거된다.

### 3. Cluster registry source-of-truth = static helm values + ConfigMap volume

- chart `values.yaml`의 `multiCluster.clusters[]`가 cluster registry의 단일 원천이다.
- helm template이 이를 ConfigMap (`cluster-registry`) 으로 렌더링하고 web pod에 `/cluster-registry.json` 경로로 mount한다.
- 동적 등록(런타임 cluster discovery / DB 저장) 은 의도적으로 채택하지 않는다. 정적 helm values 외 런타임 변경 경로는 두지 않아 chart upgrade가 진실의 단일 경로가 되도록 한다.

### 4. 인증 = Keycloak external + FastAPI native JWT 검증

- IdP는 외부의 Keycloak (single realm: `acko`).
- SPA는 public client (`acko-spa`, PKCE), API는 audience `acko-api`.
- FastAPI는 JWKS를 캐시하고 RS256으로 access token을 verify, audience(`acko-api`)와 issuer를 검증한다. (별도의 oauth2-proxy / authservice를 ingress에 두지 않는다 — 단계 1에서는.)
- 권한 모델은 `realm_access.roles[]` 기반의 단순 RBAC. cluster-scoped role naming은 `acko:dev`, `acko:prod`. 옵션이며, 미설정 시 기본은 "모든 인증된 사용자에게 read-only" 정책에 가깝게 둔다.

### 5. local/e2e: bitnami/keycloak 부트스트랩

- 로컬 개발과 e2e CI에서는 `bitnami/keycloak` chart로 Keycloak을 띄우고, prebuilt realm export(`acko-realm.json`) 를 import한다.
- 이는 cert-manager가 로컬 e2e에서 jetstack/cert-manager로 standardize되어 있는 기존 패턴(ADR-0002 인근)과 동일한 철학이다 — production runtime 책임을 chart가 부담하지 않고, e2e fixture로만 bundle한다.

## 대안 (Alternatives Considered)

### 대안 A: Common cluster proxy.js multi-backend routing 유지

- **설명**: 현재의 proxy.js를 그대로 두고, dev/prod backend를 path/host로 라우팅
- **장점**: 코드 변경 표면 가장 작음
- **단점**: K8s 표준 ingress 패턴과 어긋남, web pod가 모든 backend ingress에 도달 가능해야 함 (cross-cluster network 가정), proxy.js가 멀티 cluster topology의 단일 SPOF가 됨
- **미선택 사유**: 표준 ingress 패턴이 아닐 뿐 아니라 cluster 간 routing 책임이 web pod에 집중되어 운영 부담이 커진다.

### 대안 B: Bearer token (Keycloak 없음)

- **설명**: 정적 token 또는 자체 발급 token 만으로 API를 보호
- **장점**: 의존성 0
- **단점**: 회전·만료·감사 정책 부재, SSO/MFA/외부 디렉터리 통합 불가, 운영자가 직접 user/group 관리
- **미선택 사유**: 보안 운영 표준과 맞지 않음. 조직 IdP와 통합되어야 한다는 사용자 요구 미충족.

### 대안 C: Ingress 단에서 oauth2-proxy / Keycloak gatekeeper로 종단 보호

- **설명**: 모든 ingress 앞에 oauth2-proxy를 두고 인증 강제, FastAPI는 X-Auth-Request-* header만 신뢰
- **장점**: 표준 패턴, defense-in-depth
- **단점**: cookie domain·CSRF·multi-cluster session 동기화 복잡, 처음 단계에 도입하기에 변경 표면이 큼, 토큰 lifecycle을 proxy가 가지고 있어 SSE/장기 stream 호환성 검증 필요
- **미선택 사유**: 단계 1에는 과도. **다음 ADR(후속 작업)** 로 분리하여, FastAPI native JWT 검증이 안정화된 뒤 defense-in-depth 레이어로 추가하는 것이 단계적 도입 비용 대비 효과적이다.

### 대안 D: Keycloak을 chart의 subchart로 In-chart bundle (production)

- **설명**: ACKO chart가 `dependencies:`로 bitnami/keycloak을 prod에서도 포함
- **장점**: 한 번에 설치
- **단점**: chart 책임이 비대해짐 (Keycloak 자체 운영 — DB, 백업, realm 관리 — 까지 ACKO chart가 떠안음), prod에서는 보통 별도로 운영되는 IdP를 chart가 강제로 띄우는 모양이 됨
- **미선택 사유**: prod에서는 외부 운영 Keycloak을 가정하는 것이 옳다. local/e2e fixture로만 한정한다.

## 결과 (Consequences)

### 긍정적

- K8s native: cluster-per-environment 패턴이 chart values만으로 표현되며 표준 ingress/Service에 머무름.
- 멀티 cluster가 자연스럽게 확장: 새 환경(예: staging) 추가 시 `multiCluster.clusters[]` 항목 1줄과 helm install 1회로 끝.
- 인증/권한이 외부 IdP에 위임: SSO/MFA/감사로깅/계정 lifecycle을 조직 표준에 일임.
- proxy.js가 사라지면서 web 계층이 stateless static asset에 가까워진다 — 캐시·CDN 친화적.
- ADR-0030(Cluster Manager API 인증/인가 아키텍처)에서 비워둔 외부 IdP 연동 자리가 채워진다.

### 부정적

- 각 cluster마다 TLS 인증서 운영이 필요 (cert-manager + LetsEncrypt 권장). cluster 수에 비례.
- audience가 단일(`acko-api`) 이라 토큰이 cluster 간 replay될 수 있음. 단계 1에서는 cluster role(`acko:dev` / `acko:prod`)으로 권한 분리는 가능하지만, audience 자체 분리는 후속 ADR 대상.
- 각 operator cluster의 PostgreSQL profile이 그 cluster 안에 갇힘 (silos). cross-cluster aggregation은 후속 ADR 필요.
- 사용자가 cluster 진입점(common cluster)에서 dev/prod로 fan-out할 때 mixed-content / CORS 설정을 모든 ingress에서 일관되게 유지해야 한다.

### 리스크

- Keycloak 가용성이 ACKO 인증의 가용성과 직결됨. Keycloak 장애 = web/api 인증 실패.
- JWKS rotation 시 짧은 윈도우의 5xx (FastAPI 캐시 만료 ~ 새 키 fetch) 가능. JWKS 캐시 TTL과 retry 정책 튜닝 필요.
- cluster registry가 정적이므로, cluster를 추가/삭제할 때 helm upgrade 필수. 사용자가 임시 cluster를 동적으로 추가하려는 운영 시나리오는 미지원.

## 후속 작업 (TODO / Open Questions)

이 ADR은 단계 1을 정의한다. 다음 결정들은 후속 ADR로 분리한다.

- **Ingress 단 oauth2-proxy / Keycloak gatekeeper** — defense-in-depth. native JWT 검증과 병행 가능.
- **Keycloak realm/client 자동 프로비저닝** — Terraform Keycloak provider로 realm/client/audience mapper IaC화.
- **mTLS (proxy ↔ API)** — service mesh 기반 또는 cert-manager 기반.
- **Cross-cluster 메트릭/로그 federation** — Prometheus federation, Loki multi-tenant.
- **멀티 kind e2e (stage-2)** — 현재는 single kind에 namespace로 common/operator를 흉내내지만, 진정한 multi-cluster e2e는 별도 stage.
- **PostgreSQL connection-profile cross-cluster aggregation** — 현재는 cluster마다 DB가 silo. 통합 view 필요시 별도 결정.
- **Audience 분리 (`acko-api-dev`, `acko-api-prod`)** — replay 차단을 강화하려면 cluster별 audience.

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
