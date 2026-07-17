---
title: "ADR-0041: MCP federation gateway — single registration for many cluster-manager instances"
description: 여러 Cluster Manager 인스턴스의 MCP endpoint를 하나의 진입점으로 통합하는 federation gateway 설계
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
- 검토 결과: 이 ADR을 merge한 뒤 prototype으로 남은 질문을 검증하고, 결과가 확인되면 상태를 Accepted로 변경합니다.

## 맥락 (Context)

PR #302(`feb3b95`)는 Cluster Manager의 각 instance에 `/mcp` endpoint를 추가했습니다. ADR-0040의 multi-cluster topology는 common cluster와 environment별 operator cluster로 구성되므로, dev, staging, production에 각각 별도의 Cluster Manager API instance가 실행됩니다. LLM agent가 이 환경을 모두 사용하려면 현재는 다음과 같이 instance마다 MCP server를 등록해야 합니다.

```
claude mcp add acm-dev   https://acm-dev.example.com/mcp
claude mcp add acm-stage https://acm-stage.example.com/mcp
claude mcp add acm-prod  https://acm-prod.example.com/mcp
```

환경이 늘어날 때마다 등록과 설정도 함께 늘어납니다. 또한 `connect`, `list_namespaces`처럼 같은 역할의 tool이 환경별로 반복되어 agent의 tool catalog를 이해하기 어려워집니다. 이를 해결하기 위해 여러 backend의 tool을 하나의 등록으로 제공하는 federation gateway가 필요합니다.

이 ADR은 issue #306에서 제기한 auth bridging, OTel propagation, mTLS, failure semantics, streaming proxy의 기본 방향을 정합니다. 실제 구현은 별도의 PR series로 진행합니다.

### Phase 0 contract와의 관계

Phase 0a의 MCP registry decorator Context contract와 Phase 0b의 `Workspace.ownerId` schema는 **각 instance 안에서** session과 workspace 권한을 처리하는 방법을 정의합니다. Federation gateway는 이 모델을 바꾸지 않는 외부 계층입니다. 따라서 caller identity를 backend가 이해하는 형태로 전달하고, backend가 사용하는 OIDC `sub` claim과 bearer sentinel을 보존해야 합니다.

## 결정 (Decision)

> **Federation gateway는 다수 backend ACM의 `/mcp`를 묶어 단일 `/mcp`로 노출하는 aggregating reverse-proxy로 구현한다. `tools/list`는 backend별 prefix를 붙여 합치고, `tools/call`은 prefix 또는 `Mcp-Session-Id`로 backend를 결정해 forward한다.**

결정은 다음 아홉 가지 원칙으로 구성됩니다.

### 1. Aggregating reverse-proxy 형태

- 하나의 `/mcp` endpoint를 제공합니다.
- `tools/list`는 연결할 수 있는 모든 backend의 tool에 prefix를 붙여 하나의 목록으로 반환합니다.
- `tools/call`은 tool name prefix 또는 session affinity를 사용해 정확히 한 backend로 전달합니다.
- gateway는 stateless로 운영하며 backend 목록은 static config에서 읽습니다.

인증만 통합하고 instance별 등록을 유지하는 “per-instance OIDC delegation without aggregation”은 등록 수를 줄이지 못하므로 선택하지 않습니다.

### 2. Tool naming under federation: backend prefix + `__` separator

`tools/list` 결과의 tool name은 `<backend>__<tool>` 형식으로 만듭니다. 예를 들어 `dev__connect`, `prod__list_namespaces`처럼 표시합니다.

- separator는 우선 `__`(double underscore)를 사용합니다. `/`는 일부 MCP client나 agent가 tool name을 path segment로 sanitize할 때 문제가 될 수 있습니다. FastMCP의 `add_tool(name=...)`은 별도의 regular expression을 강제하지 않지만, 영문자·숫자·underscore만 허용하는 보수적인 client와의 호환성도 고려했습니다. Prototype에서 Claude Desktop과 Inspector를 포함한 실제 client 호환성을 검증합니다. 문제가 있으면 `:` 또는 `.`으로 변경하되, federation 전체가 하나의 separator만 사용한다는 원칙은 유지합니다.
- backend name은 gateway config의 `backends[].name`에서 읽고 snake_case만 허용합니다. Backend가 하나뿐이어도 prefix를 생략하지 않습니다. 그래야 backend를 추가해도 client의 tool catalog가 바뀌지 않습니다.
- `tools/call`이 prefix 없는 name을 받으면 4xx error를 반환합니다. Gateway가 backend를 추측하지는 않습니다.

### 3. Session affinity (선택적 라우팅 키)

기본 routing key는 tool prefix입니다. `Mcp-Session-Id` header가 있으면 같은 session의 후속 요청을 처음 선택한 backend로 고정합니다. Phase 0a #303에서 정의한 session-scoped client cache가 backend 내부에 있기 때문에, session이 backend 사이를 이동하면 cache를 재사용할 수 없습니다.

### 4. Auth bridging: OIDC token exchange (RFC 8693), bearer는 pass-through

Gateway는 caller를 인증한 뒤 다음 두 방식 중 하나로 backend credential을 전달합니다.

| Mode | 설명 | 트레이드오프 |
|---|---|---|
| **OIDC token exchange (RFC 8693)** | gateway가 자기 audience(`acm-gateway`)로 검증 후, IdP의 token-exchange endpoint에 가서 backend audience(`acm-api`) 토큰을 새로 받아 backend로 forward | per-user audit trail 보존, IdP가 RFC 8693을 지원해야 함 (Keycloak은 지원) |
| **Bearer pass-through (per-backend service account)** | gateway가 자체 보유한 backend별 static bearer를 forward. backend는 ACM_MCP_TOKEN으로 받아 인증 | 단순함. per-user 추적 불가 — backend audit log엔 service account 1개로만 보임 |

Phase F1은 bearer pass-through로 시작하고, F2에서 OIDC token exchange를 추가합니다. Bearer mode에서는 backend의 Phase 0a `_mcp_bearer=True` sentinel이 활성화되어 workspace gate를 우회합니다. 따라서 production에서 이 mode를 사용하면 gateway 뒤의 환경을 사실상 single-tenant로 취급해야 합니다.

### 5. OTel propagation: `traceparent` injection + 모든 trace context header preserve

- Gateway는 inbound request의 `traceparent`와 `tracestate` header를 그대로 backend에 전달합니다.
- Gateway는 `mcp.gateway.forward` span을 만들어 agent call과 backend Cluster Manager span을 연결합니다.
- ADR-0046에서 채택한 W3C Trace Context를 따릅니다. Gateway가 OTel SDK를 직접 사용하지 않더라도 trace context header를 보존하면 trace가 끊기지 않습니다.
- Session과 workspace 정보를 context variable에 저장하는 Phase 0a의 처리는 backend 내부에만 머뭅니다. Gateway는 `Mcp-Session-Id`, `Authorization`, 그 밖의 application header를 임의로 제거하지 않습니다.

### 6. mTLS: production 필수, cert-manager 발급 인증서

- Gateway에서 caller-facing TLS를 terminate하고 backend connection은 별도의 mTLS session으로 만듭니다.
- Certificate는 ADR-0040의 cert-manager 운영 pattern을 따릅니다. Gateway Pod는 client certificate를 mount하고 backend Ingress 또는 Service는 client CA를 trust anchor로 등록합니다.
- Local/E2E 환경에서는 self-signed CA와 TTL이 짧은 certificate로 같은 흐름을 검증합니다.
- mTLS는 Phase F3에서 적용합니다. F1과 F2는 cluster-internal HTTPS를 전제로 합니다.

### 7. Failure semantics: `tools/list` partial success, `tools/call` 단일 backend 실패

| 동작 | 정상 | 일부 backend 장애 | 모든 backend 장애 |
|---|---|---|---|
| `tools/list` | 모든 backend의 union을 응답 | 도달 가능한 backend만 union, 응답 metadata에 `degraded_backends: [...]` 포함, HTTP 200 | 빈 tool list + warning, HTTP 200 (gateway 자체는 살아 있음) |
| `tools/call` | 정확히 한 backend로 forward | prefix가 가리키는 backend가 down이면 504-class JSON-RPC error를 그대로 반환 | 동일 |

핵심 규칙은 **`tools/list`가 5xx를 반환하지 않는 것**입니다. Backend 하나의 일시적인 장애 때문에 전체 federation의 tool discovery가 중단되어서는 안 됩니다. Agent는 degraded marker를 보고 재시도하거나 해당 backend를 건너뛸 수 있습니다.

### 8. Streaming proxy: frame-by-frame, 버퍼링 금지

Cluster Manager MCP는 Streamable HTTP(SSE-style) transport를 사용합니다. `tools/call`이 stream을 반환할 때 gateway는 backend frame을 받는 즉시 전달해야 합니다. 전체 response를 먼저 buffer하면 agent가 partial result를 받을 수 없어 streaming의 의미가 사라집니다.

단순한 HTTP/1.1 reverse proxy로는 이 요구사항을 충족하기 어려우므로 다음 두 option을 검토합니다.

- **Option A**: Starlette 기반 transport-aware custom proxy를 사용합니다. `httpx.AsyncClient.stream()`과 Starlette `StreamingResponse`로 frame을 바로 전달합니다. Cluster Manager와 같은 Python/asyncio stack을 사용하므로 함께 운영하기 쉽습니다.
- **Option B**: Envoy나 HAProxy 같은 general-purpose L7 proxy에 streaming filter를 결합합니다. 성숙도와 성능은 높지만 prefix에서 backend로 연결하는 federation routing logic을 sidecar, Lua 또는 WASM filter로 구현해야 합니다.

최종 선택은 prototype 결과에 따릅니다. Phase F1은 option A로 시작하고, 성능이 충분하지 않으면 F3에서 option B로 이동하는 방안을 검토합니다. 이 항목은 아래 open question에 포함합니다.

### 9. Workspace boundary: gateway는 cross-instance workspace를 도입하지 않는다

Phase 0b에 따라 workspace ownership은 Cluster Manager instance의 `Workspace.ownerId` 범위 안에서만 유효합니다. Federation gateway는 다음 기능을 추가하지 않습니다.

- backend N개의 workspace 목록을 cross-instance global namespace로 합치지 않는다.
- "어느 workspace든 어느 backend든 접근 가능"이라는 모델을 도입하지 않는다.
- workspace 단위의 routing 키를 새로 정의하지 않는다 — 라우팅은 §2 prefix와 §3 session affinity만으로 구성한다.

dev workspace를 production backend에서 사용하는 것과 같은 cross-instance workspace는 명시적으로 범위에서 제외합니다. 이후 이 기능이 필요해지면 별도의 ADR로 권한 model과 routing을 정의해야 합니다. 이 경계는 instance 내부 권한과 federation routing의 책임을 분리합니다.

## 구현 단계 (Phasing)

각 phase는 독립적으로 배포할 수 있습니다. 다음 phase가 끝날 때까지 앞선 phase의 사용을 기다릴 필요는 없습니다.

| Phase | 범위 | 의존 |
|---|---|---|
| **F1 — minimum viable federation** | 정적 YAML config(backend 목록), `__` prefix 라우팅, bearer pass-through, `tools/list` partial success | 본 ADR |
| **F2 — OIDC token exchange** | gateway가 audience `acm-gateway`로 검증 후 RFC 8693으로 backend audience 토큰 재발급. Keycloak realm에 token-exchange permission 추가 | F1 + ADR-0040(Keycloak realm) |
| **F3 — production hardening** | mTLS (cert-manager), streaming proxy 검증 + 성능 측정, dynamic backend registry (선택) | F2 |

F1은 internal lab이나 demo처럼 single-tenant에 가까운 환경을 대상으로 합니다. Multi-tenant production에는 F2의 identity propagation이 필요하며, F3에서 정식 SLA에 필요한 보안과 성능을 갖춥니다.

## 대안 (Alternatives Considered)

### 대안 A: Per-instance MCP registration (status quo)

- **설명**: Gateway를 추가하지 않고 client가 backend마다 `claude mcp add`를 실행합니다.
- **장점**: code와 infrastructure를 변경할 필요가 없으며 auth, OTel, mTLS도 각 backend의 기존 stack을 그대로 사용합니다.
- **단점**: 환경 수만큼 등록이 늘어나고 같은 tool이 반복되어 agent tool catalog가 복잡해집니다. ADR-0040의 multi-cluster topology와도 일관된 사용 경험을 제공하지 못합니다.
- **미선택 사유**: 이 ADR이 해결하려는 등록과 tool 중복 문제를 그대로 남깁니다.

### 대안 B: DNS-based routing (host header multiplexing)

- **설명**: 하나의 domain(`mcp.example.com`) 뒤에서 host header나 SNI로 backend를 선택하고, client는 DNS alias로 instance를 가리킵니다.
- **장점**: 표준 Ingress pattern을 사용할 수 있습니다.
- **단점**: MCP client는 host header multiplexing을 위한 별도 기능을 제공하지 않습니다. Inspector도 설정된 host를 그대로 사용하므로 같은 origin에서 여러 cluster를 동시에 노출할 수 없습니다. 결국 backend별 등록이 다시 필요합니다.
- **미선택 사유**: MCP routing은 host가 아니라 tool name을 중심으로 동작하므로 요구사항에 맞지 않습니다.

### 대안 C: Aggregating gateway WITHOUT prefix renaming

- **설명**: Gateway가 여러 backend의 tool을 합치되 name은 변경하지 않습니다.
- **장점**: 사용자에게 보이는 tool name이 짧습니다.
- **단점**: 두 backend가 `connect`처럼 같은 name을 제공하는 순간 충돌하고 `tools/call`의 목적지가 모호해집니다. 충돌을 피하려고 backend마다 서로 다른 name을 강제하면 backend가 독립적으로 발전하기 어렵습니다.
- **미선택 사유**: name collision이 deployment가 아니라 runtime에서 드러나는 불안정한 구조를 허용하지 않습니다.

### 대안 D: Per-instance OIDC delegation without aggregation

- **설명**: 인증만 하나의 IdP로 통일하고 MCP server는 instance마다 등록합니다.
- **장점**: 인증 방식을 표준화할 수 있습니다. 이 부분은 이미 ADR-0040에 포함돼 있습니다.
- **단점**: 등록 수와 중복 tool 문제를 해결하지 못합니다.
- **미선택 사유**: ADR-0040이 이미 인증 표준화를 다루고 있어 이 ADR의 목적에 새로운 가치를 더하지 않습니다.

## 결과 (Consequences)

### 긍정적

- Agent는 `claude mcp add gateway` 한 번으로 여러 환경의 tool을 사용할 수 있습니다. 이 방식은 ADR-0040의 multi-cluster topology와 일관됩니다.
- Backend는 federation을 알 필요 없이 독립적으로 발전할 수 있습니다. 새 tool을 추가해도 gateway code를 바꾸지 않습니다.
- Static YAML config와 prefix routing만으로 F1을 작게 구현할 수 있습니다. 단순한 component이므로 ADR-0008의 IssueOps 기반 CI에도 적용하기 쉽습니다.

### 부정적

- Gateway Pod, config, certificate lifecycle이라는 새 infrastructure component를 운영해야 합니다.
- `<backend>__` prefix가 사용자에게 보이므로 tool name이 길어지고 agent prompt의 가독성이 조금 낮아집니다.
- OTel trace correlation은 gateway가 trace context header를 보존할 때만 유지됩니다. Middleware 변경 후에도 trace가 연결되는지 정기적으로 검증해야 합니다.
- Bearer pass-through mode는 backend workspace gate를 우회합니다. Production에서 이 mode를 사용한다면 사실상 single-tenant라는 가정을 받아들여야 합니다.

### 중립

- Backend가 tool을 추가하는 일은 gateway 변경을 요구하지 않습니다. 다만 transport를 Streamable HTTP에서 bidirectional WebSocket 등으로 바꾸면 gateway도 같은 transport를 지원해야 합니다.
- `__` separator는 client config와 prompt에 널리 사용되므로 나중에 바꾸기 어렵습니다. F1 prototype에서 충분히 검증한 뒤 고정합니다.

## 후속 작업 / Open Questions (prototype이 닫아야 할 항목)

이 ADR을 Accepted로 변경하기 전에 prototype으로 다음 질문에 답해야 합니다.

1. **Streaming proxy**: option A(Starlette/httpx)와 option B(Envoy/HAProxy + filter)의 p99 latency overhead와 frame buffering 동작을 비교합니다.
2. **prefix separator 호환성**: `__`가 Claude Desktop, Inspector, Claude Code MCP client에서 모두 동작하는지 확인합니다. 실패하면 `:` 또는 `.`을 검토합니다.
3. **OIDC token exchange overhead**: Keycloak token-exchange round trip이 `tools/call`마다 추가하는 latency를 측정하고 token cache와 reuse window를 정합니다.
4. **Backend health check**: `tools/list`에서 backend 장애를 판단할 timeout과 fail-fast 또는 hedged request 정책을 정합니다.
5. **Dynamic backend registry**: F1의 static YAML을 runtime registry(DB 또는 CRD)로 바꿔야 하는지, 필요하다면 언제 바꿀지 결정합니다.
6. **Streaming 중 token expiration**: 장시간 stream에서 OIDC token이 만료될 때 gateway와 agent 중 어느 쪽이 refresh를 책임질지 정합니다.
7. **Backend prefix와 workspace의 이해도**: 사용자가 `dev__connect`를 ADR-0040의 `dev`/`prod` cluster registry와 자연스럽게 연결해 이해하는지 확인합니다.
8. **Failure response schema**: MCP specification이 직접 정하지 않은 degraded `tools/list` metadata(`degraded_backends`, `errors[]`)의 schema를 확정합니다.

## 관련 ADR

- [ADR-0040: Multi-Cluster Topology and Keycloak OIDC for ACKO + Cluster-Manager](./2026-05-05-multi-cluster-topology-and-keycloak-oidc.md) — federation gateway는 ADR-0040의 multi-cluster topology를 LLM 에이전트 surface로 확장한다. Keycloak realm/audience 모델을 그대로 재사용한다.
- [ADR-0046: OpenTelemetry Tracing 완전 통합 및 에코시스템 전파](./2026-04-07-otel-tracing-integration.md) — gateway는 ADR-0046의 W3C trace context 전파 규칙을 깨지 않는 단순 forward 정책을 따른다.
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
