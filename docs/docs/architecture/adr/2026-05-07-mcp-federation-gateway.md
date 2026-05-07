---
title: "ADR-0041: MCP federation gateway — single registration for many cluster-manager instances"
description: 다수의 Aerospike Cluster Manager (ACM) 인스턴스가 노출하는 /mcp 엔드포인트를 단일 진입점으로 묶어 LLM 에이전트에게 한 번의 등록으로 노출하는 federation gateway 설계 결정.
sidebar_position: 41
scope: ecosystem
repos: [cluster-manager]
tags: [adr, mcp, federation, gateway, oidc, otel, mtls, streaming, multi-cluster]
last_updated: 2026-05-07
---

# ADR-0041: MCP federation gateway — single registration for many cluster-manager instances

## 상태

**Proposed**

- 제안일: 2026-05-07
- 관련 이슈: [aerospike-ce-ecosystem/aerospike-cluster-manager#306](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/issues/306)
- 검토 결과: 본 ADR이 머지된 뒤 prototype을 통해 open question을 해소한 다음 Accepted로 승격한다.

## 맥락 (Context)

PR #302 (`feb3b95`)로 ACM에 단일 인스턴스 `/mcp` mount가 도입되었다. ADR-0040에서 채택한 multi-cluster topology(common cluster + per-environment operator cluster)에서는 환경마다 ACM API 인스턴스가 따로 떠 있고, 각 인스턴스가 자기만의 `/mcp` 엔드포인트를 노출한다. 결과적으로 LLM 에이전트가 dev/staging/prod를 동시에 다루려면 다음과 같이 N번의 등록을 해야 한다.

```
claude mcp add acm-dev   https://acm-dev.example.com/mcp
claude mcp add acm-stage https://acm-stage.example.com/mcp
claude mcp add acm-prod  https://acm-prod.example.com/mcp
```

이 모델은 환경이 늘어날수록 운영 부담이 선형 증가하고, 같은 의미의 도구(`connect`, `list_namespaces`)가 환경마다 중복 등록되어 에이전트의 tool catalog가 산만해진다. 단일 등록(`claude mcp add gateway` 한 번)으로 다수 backend의 tool을 통합 노출하는 **federation gateway**가 필요하다.

이 ADR은 issue #306의 open question (인증 bridging, OTel 전파, mTLS, 실패 의미, streaming proxy)에 대한 default direction을 결정한다. 구현은 별도 PR 시리즈로 진행한다.

### Phase 0 contract와의 관계

Phase 0a (mcp/registry decorator Context contract) 와 Phase 0b (Workspace.ownerId schema) 는 **인스턴스 내부**의 session/workspace 권한 체계를 결정한다. Federation gateway는 그 위에 얹히는 외부 계층이며, 인스턴스 내부 권한 모델은 그대로 유지한다. 따라서 gateway는 caller identity를 backend가 받을 수 있는 형태로 forward해야 하고, backend가 의존하는 OIDC `sub` claim이나 bearer 센티넬을 손상시키지 않아야 한다.

## 결정 (Decision)

> **Federation gateway는 다수 backend ACM의 `/mcp`를 묶어 단일 `/mcp`로 노출하는 aggregating reverse-proxy로 구현한다. `tools/list`는 backend별 prefix를 붙여 합치고, `tools/call`은 prefix 또는 `Mcp-Session-Id`로 backend를 결정해 forward한다.**

핵심 결정은 다음 9가지로 구성된다.

### 1. Aggregating reverse-proxy 형태

- 단일 `/mcp` 엔드포인트를 노출한다.
- `tools/list`는 모든 healthy backend의 도구를 prefix 붙여 합쳐 응답한다.
- `tools/call`은 도구 이름의 prefix(또는 session affinity)로 정확히 1개 backend로 forward한다.
- gateway 자체는 stateless이며, backend 목록은 정적 config로부터 읽는다.

대안인 "per-instance OIDC delegation without aggregation" (인증만 통합, 등록은 그대로 N개)은 사용자가 보는 등록 sprawl을 해결하지 못하므로 기각.

### 2. Tool naming under federation: backend prefix + `__` separator

`tools/list` aggregation 시 도구 이름을 `<backend>__<tool>` 으로 prefix한다. 예: `dev__connect`, `prod__list_namespaces`.

- separator로 `__`(double underscore)를 **잠정 채택**한다. `/`는 일부 MCP client/agent가 도구 이름을 path-segment로 sanitize하면서 깨질 수 있고, FastMCP의 `add_tool(name=...)`은 별도 정규식 검사를 강제하지 않지만 보수적으로 영문/숫자/`_`만 허용하는 client(Claude Desktop, Inspector)와 호환되리라 예상한다. 다만 실제 client 호환성은 prototype에서 검증해야 하며, 그 결과가 부정적이면 후속 작업 #2의 fallback(`:` 또는 `.`)으로 교체한다 — 이 단계에서는 단일 separator 정책을 유지한다는 것이 결정의 핵심이며, 기호 자체는 prototype-gated이다.
- backend 이름은 gateway config의 `backends[].name` 키에서 가져오며, kebab-case가 아닌 snake-case를 강제한다. 이름이 하나뿐일 때 prefix 생략 옵션은 두지 않는다 (단일 backend일 때조차 prefix를 유지해야 backend를 늘렸을 때 client tool catalog가 바뀌지 않는다).
- `tools/call`이 prefix 없는 이름을 받으면 4xx로 명시적으로 실패한다 — 자동 추정은 하지 않는다.

### 3. Session affinity (선택적 라우팅 키)

prefix routing이 1차 라우팅 키이지만, MCP의 `Mcp-Session-Id` 헤더가 존재하는 경우 동일 session의 후속 요청은 같은 backend로 고정한다. 이는 backend가 session 내부에서 client cache(Phase 0a #303의 session-scoped client)를 유지하기 때문이며, session이 backend 사이를 옮겨다니면 cache가 무용지물이 된다.

### 4. Auth bridging: OIDC token exchange (RFC 8693), bearer는 pass-through

gateway는 caller를 인증한 뒤 backend로 forward할 때 다음 두 모드 중 하나를 사용한다.

| Mode | 설명 | 트레이드오프 |
|---|---|---|
| **OIDC token exchange (RFC 8693)** | gateway가 자기 audience(`acm-gateway`)로 검증 후, IdP의 token-exchange endpoint에 가서 backend audience(`acm-api`) 토큰을 새로 받아 backend로 forward | per-user audit trail 보존, IdP가 RFC 8693을 지원해야 함 (Keycloak은 지원) |
| **Bearer pass-through (per-backend service account)** | gateway가 자체 보유한 backend별 static bearer를 forward. backend는 ACM_MCP_TOKEN으로 받아 인증 | 단순함. per-user 추적 불가 — backend audit log엔 service account 1개로만 보임 |

Phase F1은 bearer pass-through로 시작하고, F2에서 OIDC token exchange를 추가한다 (§ 10 참조). bearer 모드에서는 backend의 Phase 0a `_mcp_bearer=True` 센티넬이 활성화되어 workspace gate를 bypass하므로, **prod에서 bearer 모드는 신중하게 사용해야 한다** — 사실상 gateway 너머는 single-tenant가 된다.

### 5. OTel propagation: `traceparent` injection + 모든 trace context header preserve

- gateway는 inbound 요청의 `traceparent` / `tracestate` 헤더를 그대로 backend로 forward한다.
- gateway 자신은 `mcp.gateway.forward` span을 생성해 incoming agent call ↔ backend ACM span을 연결한다.
- ADR-0039 (OTel Tracing 통합)에서 정한 W3C trace context 표준을 그대로 따른다. gateway가 OTel SDK를 직접 import하지 않더라도 header pass-through만 보장하면 ADR-0039 trace는 절단되지 않는다.
- Phase 0a (registry decorator Context contract)가 session/workspace 정보를 ctxvar에 stash하는 흐름은 backend 내부에서만 일어나며, gateway는 그에 영향을 주지 않는다. 단, gateway는 `Mcp-Session-Id` 와 `Authorization` 외의 application header를 임의로 strip하지 않는다.

### 6. mTLS: production 필수, cert-manager 발급 인증서

- gateway는 caller의 TLS를 종단(termination)하고, backend로의 connection은 mTLS로 별도 수립한다.
- 인증서는 ADR-0040에서 정한 cert-manager 운영 패턴을 따른다 (jetstack/cert-manager). gateway pod는 client cert을 mount하고, backend의 ingress(또는 Service)는 client CA를 trust anchor로 등록한다.
- local/e2e에서는 self-signed CA + 짧은 TTL 인증서로 동일 흐름을 검증한다.
- mTLS 적용은 Phase F3로 분리한다 — F1/F2는 cluster-internal HTTPS만 가정한다.

### 7. Failure semantics: `tools/list` partial success, `tools/call` 단일 backend 실패

| 동작 | 정상 | 일부 backend 장애 | 모든 backend 장애 |
|---|---|---|---|
| `tools/list` | 모든 backend의 union을 응답 | 도달 가능한 backend만 union, 응답 metadata에 `degraded_backends: [...]` 포함, HTTP 200 | 빈 tool list + warning, HTTP 200 (gateway 자체는 살아 있음) |
| `tools/call` | 정확히 한 backend로 forward | prefix가 가리키는 backend가 down이면 504-class JSON-RPC error를 그대로 반환 | 동일 |

핵심 규칙: **`tools/list`는 절대 5xx를 반환하지 않는다**. 한 backend의 일시 장애가 전체 federation의 등록을 끊으면 안 되기 때문이다. agent는 degraded marker를 보고 retry하거나 무시할 수 있다.

### 8. Streaming proxy: frame-by-frame, 버퍼링 금지

ACM의 MCP는 Streamable-HTTP(SSE-style) transport를 사용한다. `tools/call` 응답이 stream인 경우 gateway는 backend 응답을 frame 단위로 즉시 forward해야 하며, 응답 전체를 버퍼링하면 SSE 의미가 깨진다(에이전트가 partial result를 못 받음).

이는 naive HTTP/1.1 reverse-proxy로는 충족하기 어렵고, 다음 두 옵션 중 하나를 택해야 한다.

- **option A**: Starlette 기반의 transport-aware custom proxy. `httpx.AsyncClient.stream()` + Starlette `StreamingResponse`로 frame을 즉시 yield한다. ACM 코드베이스와 같은 Python/asyncio 스택이라 운영 일체화 측면에서 유리.
- **option B**: Envoy/HAProxy 같은 generic L7 proxy를 streaming filter와 함께 사용. 성숙도/성능은 우수하지만 federation 전용 routing(prefix → backend) logic을 sidecar/Lua/WASM filter로 구현해야 함.

선택은 prototype 결과에 따라 정한다. Phase F1은 option A 가정으로 시작하고, 성능 부족 시 F3 단계에서 option B로 마이그레이션을 검토한다. **이 결정은 prototype에서 닫아야 할 open question으로 § 12에 명시한다.**

### 9. Workspace boundary: gateway는 cross-instance workspace를 도입하지 않는다

Phase 0b의 결정에 따라 workspace ownership은 ACM 인스턴스 단위(`Workspace.ownerId`)로 닫혀 있다. federation gateway는 다음을 **하지 않는다**.

- backend N개의 workspace 목록을 cross-instance global namespace로 합치지 않는다.
- "어느 workspace든 어느 backend든 접근 가능"이라는 모델을 도입하지 않는다.
- workspace 단위의 routing 키를 새로 정의하지 않는다 — 라우팅은 §2 prefix와 §3 session affinity만으로 구성한다.

cross-instance workspace 개념(예: dev workspace를 prod backend에서 사용)은 명시적으로 out of scope이며, 미래에 도입하려면 별도 ADR이 필요하다. 이는 인스턴스 내부 권한 모델(Phase 0b)과 federation 외부 모델 사이의 단일 책임 경계를 보존한다.

## 구현 단계 (Phasing)

각 phase는 독립적으로 ship 가능하며, 이전 phase의 production 적용을 막지 않는다.

| Phase | 범위 | 의존 |
|---|---|---|
| **F1 — minimum viable federation** | 정적 YAML config(backend 목록), `__` prefix 라우팅, bearer pass-through, `tools/list` partial success | 본 ADR |
| **F2 — OIDC token exchange** | gateway가 audience `acm-gateway`로 검증 후 RFC 8693으로 backend audience 토큰 재발급. Keycloak realm에 token-exchange permission 추가 | F1 + ADR-0040(Keycloak realm) |
| **F3 — production hardening** | mTLS (cert-manager), streaming proxy 검증 + 성능 측정, dynamic backend registry (선택) | F2 |

F1은 single-tenant에 가까운 운영(internal lab, demo)에 충분하다. F2부터 multi-tenant prod에 안전해진다. F3는 정식 SLA를 약속하는 단계.

## 대안 (Alternatives Considered)

### 대안 A: Per-instance MCP registration (status quo)

- **설명**: gateway 없이 client가 backend별로 `claude mcp add` 를 N번 실행
- **장점**: 코드/인프라 변경 0. 인증/OTel/mTLS 등 모든 레이어가 backend의 기존 stack 그대로
- **단점**: 등록 sprawl이 환경 수에 비례. 같은 도구가 N번 중복 등록되어 agent tool catalog가 혼탁. multi-cluster topology(ADR-0040) 사용자 경험과 일관되지 않음
- **미선택 사유**: 본 ADR이 해결하려는 문제 자체

### 대안 B: DNS-based routing (host header multiplexing)

- **설명**: 단일 도메인(`mcp.example.com`) 뒤에서 host header / SNI로 backend를 선택. client는 DNS 별칭으로 인스턴스를 가리킴
- **장점**: 표준 ingress 패턴 활용 가능
- **단점**: MCP client가 host header 다중화에 적극 대응하지 않음. Inspector는 구성 host를 그대로 따라가며, 동일 origin 내 multi-cluster fan-out을 expose할 수 없음. 결국 등록 sprawl(대안 A)과 같은 문제로 회귀
- **미선택 사유**: MCP 표준의 routing model이 host 기반이 아닌 tool-name 기반이라 본질적으로 fit하지 않음

### 대안 C: Aggregating gateway WITHOUT prefix renaming

- **설명**: gateway는 두지만 도구 이름을 그대로 합침
- **장점**: 사용자에게 노출되는 도구 이름이 짧음
- **단점**: 두 backend가 같은 도구(`connect`)를 갖는 즉시 이름 충돌 — `tools/call` 라우팅이 모호해짐. 강제 collision-free를 위해 backend별 도구 분리를 강요하면 backend 진화의 자유가 줄어듦
- **미선택 사유**: collision의 결정이 deploy time → runtime으로 미뤄지는 fragility를 허용하지 않음

### 대안 D: Per-instance OIDC delegation without aggregation

- **설명**: 인증만 단일 IdP로 통일, 등록은 그대로 N번
- **장점**: 인증 표준화는 달성 (이미 ADR-0040으로 달성된 영역)
- **단점**: 등록 sprawl 미해결 — 본 ADR의 1차 목적과 무관
- **미선택 사유**: ADR-0040의 결정으로 이미 자동 달성된 부분이라, 본 ADR이 추가할 가치가 없음

## 결과 (Consequences)

### 긍정적

- Agent 등록이 `claude mcp add gateway` 한 줄로 끝남 — multi-environment 사용자 경험이 ADR-0040 multi-cluster topology와 정렬됨
- Backend는 federation을 모르고 진화한다 — gateway는 도구 이름에 agnostic해서 backend가 새 도구를 추가해도 gateway 코드 변경이 필요 없음
- 정적 YAML config + prefix routing으로 F1을 빠르게 ship 가능 — IssueOps 기반 CI(ADR-0008)에 잘 맞는 단순한 component

### 부정적

- 운영해야 하는 새 인프라 component가 추가됨 (gateway pod, config, 인증서 lifecycle)
- 도구 이름에 `<backend>__` prefix가 user-visible noise로 노출됨 — agent prompt 길이 + 가독성에 미세한 영향
- OTel correlation은 gateway가 header pass-through를 안 망가뜨려야만 보존됨 — 잘못된 미들웨어 추가 시 trace가 끊길 수 있어 정기 검증이 필요
- bearer pass-through 모드에서는 backend의 workspace gate가 무력화되므로, prod에서 단순 bearer를 쓰는 운영자는 사실상 single-tenant 가정을 받아들여야 함

### 중립

- backend 진화는 gateway 변경을 요구하지 않으나, backend의 transport 변경(예: streamable-HTTP → bidirectional WebSocket)은 gateway에도 동일한 transport 지원을 강제함
- prefix 정책(`__` separator)은 한번 정하면 client에 깊이 박혀 변경 비용이 크다 — F1에서 신중히 고정하고, 이후 변경 금지

## 후속 작업 / Open Questions (prototype이 닫아야 할 항목)

이 ADR을 Accepted로 승격하려면 아래 question에 prototype 결과로 답해야 한다.

1. **Streaming proxy 선택**: option A (Starlette/httpx custom) vs option B (Envoy/HAProxy + filter). p99 latency overhead와 frame buffering 동작을 측정.
2. **prefix separator 호환성**: `__` 가 Claude Desktop, Inspector, claude-code mcp client 모두에서 무탈한지 검증. 실패 시 `:` 또는 `.` 후보.
3. **OIDC token exchange overhead**: Keycloak token-exchange endpoint의 round-trip이 `tools/call` 1회당 추가하는 latency. 캐시 가능한가? token reuse 윈도우?
4. **Backend health check**: gateway가 `tools/list`에서 backend가 down임을 판단하는 기준 (timeout 값, fail-fast vs hedged).
5. **Dynamic backend registry**: 정적 YAML(F1) → runtime registry (DB/CRD) 로의 마이그레이션이 필요한가? 어떤 시점에?
6. **Streaming + token expiration**: 장시간 stream 도중 OIDC token이 만료되면 backend 인증이 끊긴다. token refresh 의무는 gateway인가, agent인가?
7. **Backend prefix와 workspace 명세의 직관성**: 사용자에게 `dev__connect`가 ADR-0040의 cluster registry(`dev`/`prod`) 와 자연스럽게 mapping되는지 UX 검증.
8. **Failure 응답 schema 표준화**: degraded `tools/list` 응답에 어떤 필드(`degraded_backends`, `errors[]`)를 넣을지 — MCP 스펙이 직접 규정하지 않으므로 우리가 정해야 함.

## 관련 ADR

- [ADR-0040: Multi-Cluster Topology and Keycloak OIDC for ACKO + Cluster-Manager](./2026-05-05-multi-cluster-topology-and-keycloak-oidc.md) — federation gateway는 ADR-0040의 multi-cluster topology를 LLM 에이전트 surface로 확장한다. Keycloak realm/audience 모델을 그대로 재사용한다.
- [ADR-0039: OpenTelemetry Tracing 완전 통합 및 에코시스템 전파](./2026-04-07-otel-tracing-integration.md) — gateway는 ADR-0039의 W3C trace context 전파 규칙을 깨지 않는 단순 forward 정책을 따른다.
- [ADR-0030: Cluster Manager API 인증/인가 아키텍처 및 보안 헤더 강화](./2026-03-30-auth-security-headers.md) — gateway가 backend로 forward하는 토큰의 inbound 검증 모델은 ADR-0030의 native JWT verify 방식 그대로다.
- [ADR-0008: IssueOps 기반 CI 워크플로우](./2026-03-10-issueops-ci-workflow.md) — gateway 자체 repo / 디렉터리에서도 동일한 IssueOps automation을 따른다.

## 참고 자료

- [aerospike-cluster-manager#306](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/issues/306) — federation gateway issue (본 ADR이 답함)
- [aerospike-cluster-manager#302](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/302) — `/mcp` mount 도입 PR (federation의 출발점)
- Phase 0a contract — `aerospike-cluster-manager/docs/plans/2026-05-07-mcp-context-contract.md` (registry decorator Context model)
- Phase 0b contract — `aerospike-cluster-manager/docs/plans/2026-05-07-workspace-ownership-schema.md` (Workspace.ownerId schema)
- [Model Context Protocol — specification](https://modelcontextprotocol.io/) — `tools/list`, `tools/call`, Streamable-HTTP transport 정의
- [RFC 8693 — OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693) — F2 단계 auth bridging 표준
- [W3C Trace Context](https://www.w3.org/TR/trace-context/) — `traceparent` / `tracestate` header
- [Keycloak — Token Exchange](https://www.keycloak.org/securing-apps/token-exchange) — F2의 IdP 측 구현 가이드
- [cert-manager](https://cert-manager.io/docs/) — F3 mTLS 인증서 운영
