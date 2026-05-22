---
title: "ADR-0042: ACKO Operator·Cluster Manager OpenTelemetry Export 통합"
description: "ACKO operator와 cluster-manager API가 traces·metrics·logs를 OTLP collector로 export하고, Helm으로 활성화하며, aerospike-py의 네이티브 tracing을 수집한다."
sidebar_position: 42
scope: ecosystem
repos: [acko, cluster-manager, aerospike-py]
tags: [adr, observability, opentelemetry, otel, helm, networkpolicy]
last_updated: 2026-05-21
---

# ADR-0042: ACKO Operator·Cluster Manager OpenTelemetry Export 통합

## 상태

**Accepted**

- 제안일: 2026-05-21
- 승인일: 2026-05-21
- 관련 ADR: [ADR-0010](./2026-02-05-observability-stack.md) (3-Layer Observability Stack), [ADR-0046](./2026-04-07-otel-tracing-integration.md) (OpenTelemetry Tracing 통합)

## 맥락 (Context)

ADR-0010과 ADR-0046으로 `aerospike-py`는 logging·metrics·tracing 3계층 observability를 갖췄고, OpenTelemetry trace context가 PyO3 경계를 넘어 전파된다. 그러나 그 위 계층은 단절돼 있었다.

- **ACKO operator (Go)** — Prometheus `/metrics`(controller-runtime + `acko_*`)만 노출했고 tracing이나 OTLP export는 전혀 없었다. reconcile 루프의 동작은 trace로 관찰할 수 없었다.
- **Cluster Manager API (FastAPI)** — OpenTelemetry SDK는 구성돼 있었지만 `aerospike_py.init_tracing()`을 호출하지 않았다. `[otel]` extra는 context 전파만 연결할 뿐 span *emission*은 시작하지 않으므로, aerospike-py의 `aerospike.<op>` span은 문서의 설명과 달리 실제로는 전량 누락됐다.

결과적으로 한 요청이 UI → API → operator → Aerospike로 흐를 때 end-to-end trace가 끊겼다. 스택 전체가 동일한 OTLP collector로 신호를 보내 하나의 trace로 이어지는 통합 관찰성이 필요했고, 활성화 전에는 비용이 0이어야 하며 설정은 OpenTelemetry SDK 표준 환경변수만으로 이뤄져야 했다.

## 결정 (Decision)

> **"우리는 ACKO operator와 cluster-manager API가 OpenTelemetry로 traces·metrics·logs를 OTLP collector에 직접 export하도록 한다. 그 이유는 aerospike-py에서 시작된 trace를 스택 전체로 이어 end-to-end 관찰성을 확보하기 위함이다."**

선택한 방안의 상세 내용:

1. **Operator (Go)** — `internal/telemetry` 패키지를 신설하여 OTLP/gRPC로 내보낸다.
   - **traces**: reconcile span (`Reconcile` → `reconcileCluster` → `reconcileRacks`), 루프의 종료 오류를 span status에 기록.
   - **metrics**: controller-runtime + `acko_*` Prometheus registry를 `contrib/bridges/prometheus`로 OTLP에 bridge — metric 정의 코드는 그대로이고 기존 `/metrics` scrape도 유지된다(push·scrape 병행).
   - **logs**: zap 로그 stream을 `otelzap` bridge로 OTLP log pipeline에 tee.
2. **Cluster Manager API** — `setup_observability()`가 `aerospike_py.init_tracing()`으로 aerospike-py의 네이티브 OTLP span exporter를 시작하고, `set_log_level()`로 Rust-core 로그를 stdlib logging tree에 연결한다.
3. **Helm** — operator chart에 `observability.otel.*` values를 추가한다(`enabled`, `endpoint`, `serviceName`, `headers`, `resourceAttributes`, `sampler`, `samplerArg`, `collectorPort`, `extraEnv`). `enabled=true`이면 deployment에 표준 `OTEL_*` 환경변수를 주입하고, `endpoint`가 없으면 렌더링이 실패한다. `networkPolicy.enabled`/`cilium.enabled`이면 collector로의 OTLP egress 규칙을 자동으로 추가한다. scheme이 없는 `host:port` endpoint는 `http://`로 정규화한다.
4. **공통 원칙** — 기본은 off(`OTEL_SDK_DISABLED`, NoOp provider로 zero-cost), 모든 exporter/sampler/resource 설정은 OTel SDK 표준 환경변수로만, OTel Collector 자체는 차트가 배포하지 않는다(외부 의존성으로 둔다).

## 대안 검토 (Alternatives Considered)

### 대안 1: Prometheus scrape만 유지, operator tracing 미도입

- **설명**: operator는 기존대로 `/metrics`만 노출하고 tracing을 추가하지 않는다.
- **장점**: 변경 없음, 의존성 추가 없음.
- **단점**: reconcile 동작을 trace로 관찰할 수 없고, UI→API→operator end-to-end trace가 단절된다.
- **미선택 사유**: ADR-0010/0039가 세운 관찰성 목표와 정면으로 배치된다.

### 대안 2: Helm chart가 OTel Collector를 함께 배포

- **설명**: 차트가 collector Deployment/Service를 포함한다.
- **장점**: 설치 후 바로 동작.
- **단점**: collector의 수명주기와 exporter 백엔드(vendor 연동, 샘플링, 보존)는 인프라 팀의 소관으로 차트 책임 범위를 넘어선다. 클러스터에 이미 collector가 있으면 충돌한다.
- **미선택 사유**: collector는 외부 의존성으로 둔다 — cluster-manager의 로그 라우팅 결정과 일관된다.

### 대안 3: metrics를 OTLP push 대신 scrape로만

- **설명**: collector의 Prometheus receiver가 operator `/metrics`를 scrape한다.
- **장점**: push 코드가 불필요.
- **단점**: collector → operator 방향의 네트워크 도달성이 필요하고, traces/logs(push)와 모델이 비대칭이다.
- **미선택 사유**: Prometheus bridge로 metric 코드 변경 없이 push가 가능하며, `/metrics` scrape도 그대로 유지되므로 두 방식을 모두 취한다.

## 결과 (Consequences)

### 긍정적 결과

- UI → API → operator로 이어지는 end-to-end distributed trace를 확보(W3C trace context 전파).
- operator의 reconcile 루프가 span으로 관찰 가능하고, 실패가 span status에 기록된다.
- 기존 `acko_*` 및 controller-runtime metric이 코드 변경 없이 OTLP로도 흐르며 `/metrics` scrape를 병행한다.
- 기본 off이므로 활성화 전 런타임 비용이 0이다(NoOp provider).

### 부정적 결과 / 트레이드오프

- operator에 OpenTelemetry Go 의존성(exporters·bridges)이 추가된다.
- `OTEL_EXPORTER_OTLP_ENDPOINT`는 URL scheme이 필수다 — bare `host:port`는 SDK가 `scheme://opaque`로 오파싱하므로 차트가 `http://`로 정규화한다.
- `networkPolicy`/`cilium`을 쓰면 collector egress 규칙이 필요하다 — 차트가 자동 추가하나, 비표준 collector 포트는 `collectorPort`로 맞춰야 한다.

### 리스크

- collector가 떠 있지 않거나 도달 불가하면 export가 실패한다 — best-effort로 처리되어 앱의 startup/shutdown을 막지는 않는다.
- aerospike-py의 exporter는 OTLP/gRPC 전용이다 — HTTP collector를 쓰더라도 gRPC 수신 포트가 필요하다.

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `aerospike-py` | 변경 없음. 기존 `init_tracing()`·`set_log_level()`·Prometheus metrics 공개 API를 cluster-manager가 소비한다. |
| `acko` | `internal/telemetry` 패키지 신설, reconcile span 계측, Helm `observability.otel.*` values + NetworkPolicy/CiliumNetworkPolicy OTLP egress. (PR #279, #281) |
| `cluster-manager` | `setup_observability()`가 aerospike-py traces/logs 수집을 활성화, `AEROSPIKE_PY_LOG_LEVEL`·`AEROSPIKE_PY_TRACING` 환경변수 추가. (PR #378) |
| `plugins` | `acko-deploy`·`acko-operations`·`acko-e2e-test` 스킬에 operator OTel 설정·운영 가이드를 반영. |

## 참고 자료

- [ADR-0010: 3-Layer Observability Stack](./2026-02-05-observability-stack.md)
- [ADR-0046: OpenTelemetry Tracing 완전 통합 및 에코시스템 전파](./2026-04-07-otel-tracing-integration.md)
- `acko` PR #279 — operator OpenTelemetry export (traces/metrics/logs)
- `acko` PR #281 — Helm OTel 활성화 + NetworkPolicy egress
- `cluster-manager` PR #378 — aerospike-py traces/logs 수집
- [OpenTelemetry SDK 환경변수 명세](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/)
