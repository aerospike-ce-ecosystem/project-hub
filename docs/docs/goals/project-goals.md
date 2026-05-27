---
title: Project Goals
description: Ecosystem motivation and per-project development goals for the Aerospike CE Ecosystem.
sidebar_position: 1
scope: ecosystem
repos:
  - aerospike-py
  - acko
  - cluster-manager
  - ackoctl
  - plugins
tags:
  - goals
  - constraints
  - principles
  - development-guidelines
last_updated: 2026-05-27
---

# Project Goals

This page is the single source of truth for **why the Aerospike CE Ecosystem
exists** and **what each project in it is trying to accomplish**. Every
repository in the ecosystem links back here; downstream design decisions are
expected to align with these goals.

---

## Why this ecosystem exists

Aerospike is a high-performance, low-latency NoSQL database and a natural fit
for online feature stores and other latency-critical serving paths. Yet
adopting Aerospike well today has three rough edges that this ecosystem was
created to close.

### 1. The official Python client cannot carry an ML feature-store workload

The upstream Python client wraps the C library through CFFI. The GIL is held
across the I/O path, async support is bolted on, and the published type stubs
drift from the runtime. For ML serving — where Python is the working
language of the pipeline and feature-store reads must keep up with model
inference — that gap is large enough to disqualify Aerospike from otherwise
strong-fit use cases.

**Response:** `aerospike-py` — a from-scratch client written in Rust (PyO3).
Native async, GIL release across the entire I/O path, NumPy batch
fast-paths, and complete `.pyi` stubs. About **2.4× the throughput** of the
official C client on standard mixed workloads.

### 2. CE has no community Kubernetes story

Aerospike CE ships no community Kubernetes operator — the upstream AKO is
Enterprise-only. There is no maintained web management UI, and the
operational tooling assumes bare-metal deployments. Day-2 work on
Kubernetes (scaling, rolling upgrades, warm restarts, ACL sync, dynamic
config rollout) is left to each team to reinvent.

**Response:** **ACKO** (a CE-focused Kubernetes operator), **Cluster
Manager** (a FastAPI + Next.js web UI for cluster operations), and
`ackoctl` (a CLI surface for both). Declarative cluster management,
rolling upgrades, warm restarts, ACL management, and an
OpenTelemetry-instrumented data path — all driven by CRDs and exposed
through both a UI and a CLI.

### 3. Enterprise Edition is often out of reach inside large organisations

Adopting Aerospike EE requires an org-level contract. Inside a large
organisation, the procurement, legal, finance, and architecture sign-off
chain becomes its own blocker — a classic *bell-the-cat* problem where
everyone agrees EE would help, but nobody owns pushing the contract
through, and the cost-justification burden lands on whoever raises their
hand first. Many teams that should be on Aerospike never get past that
gate.

**Response:** Every component in this ecosystem supports both Aerospike CE
and EE. Teams ship on CE today with the same operator, the same client,
and the same observability surface — and transparently move to EE later
if and when the contract lands. The ecosystem unblocks adoption without
forcing the EE decision up front.

---

## Ecosystem-wide commitments

Three commitments cut across every project in the ecosystem and override
project-local preferences when they conflict.

### Open-source first, EE-compatible

Every component runs against both Aerospike CE and EE. Integrations, the
operator, observability hooks, and operational tooling work identically on
either edition. Adoption is never gated on procurement: CE today, EE later,
no integration rewrite required.

### Cloud-native by default

Kubernetes is a first-class deployment target, not an afterthought.
Declarative cluster management lives in ACKO (CRDs + reconciliation),
day-2 operations are exposed through a web UI (Cluster Manager) and a CLI
(`ackoctl`), and the data path is OpenTelemetry-instrumented end to end.
None of it requires an Enterprise licence.

### Agent-driven operations

The same operational primitives that humans use through the UI and the CLI
are exposed to autonomous agents. `ackoctl` produces structured output
suitable for parsing, the Claude Code plugin pack ships nine skills covering
deployment, debugging, day-2 ops, and e2e testing, and the project
documentation is structured so agents can navigate the surface area without
human translation.

---

## Per-project goals

### 1. `aerospike-py` — Rust-backed Python client

Detailed goals and reference docs live under
`.claude/skills/project-goals/` in the repository itself; the summary is
restated here so external readers can follow the contract.

1. **Hold the performance gap.** Maintain the throughput and latency
   advantage over the upstream C client. The Rust (PyO3) layer always
   does the heavy lifting; Python is a thin wrapper.
2. **Track `aerospike-client-rust` v2.** Stay current with the upstream
   Rust crate as it evolves; pick up new features behind opt-in flags
   when they land.
3. **NumPy batch surface.** `batch_read_numpy` and `batch_write_numpy`
   keep working at production quality for ML feature-store workloads.
4. **First-class observability.** Logging, Prometheus metrics, and
   OpenTelemetry tracing are kept current. The FastAPI integration is
   verified end-to-end against the `sample-fastapi` example.
5. **Client-side reliability under load.** `batch_write(..., retry=10)`
   and related options shield callers from transient cluster issues
   without leaking partial state.
6. **Type safety.** Public API returns `NamedTuple`s, policies are
   `TypedDict`s, and `.pyi` stubs are complete and aligned with the
   runtime.

### 2. ACKO — Aerospike CE Kubernetes Operator

Operator for Aerospike CE cluster lifecycle on Kubernetes.

1. **Minimal CRD surface.** Cluster state is expressed through Pod,
   StatefulSet, Service, and PVC — standard Kubernetes resources first,
   custom resources only when there is no equivalent. Resist adding
   CRDs that users would not have asked for.
2. **Cluster templates with sharp purposes.** Three templates with
   distinct intent:
   - `minimal` — single-node, for development.
   - `soft-rack` — 1 node, N pods, for staging.
   - `hard-rack` — N nodes, N pods, for production.
   Improvements stay within those purposes.
3. **Helm chart hygiene.** `charts/aerospike-ce-kubernetes-operator/` has
   a clear release pipeline and version-management story.
4. **Broad e2e coverage.** Kind-based e2e scenarios cover scaling,
   rolling upgrades, ACL sync, observability, and the cluster-manager
   integration.
5. **CE constraints enforced at the webhook.** `size ≤ 8`, namespaces
   ≤ 2, no XDR / TLS / EE-only features — all rejected with a clear
   error before the CR is admitted. Honest, early failures over silent
   misconfiguration.

### 3. Cluster Manager — Web UI for cluster operations

FastAPI backend + Next.js frontend. Deployed by ACKO as part of the
Kubernetes stack; can also run standalone against an existing cluster.

1. **Component reuse over duplication.** Shared frontend components live
   in one place; new pages compose them rather than fork them.
2. **Bounded read/write paths.** Data-table queries enforce limits,
   pagination, and timeouts. The UI does not let a curious operator
   accidentally stop-the-world a production cluster.
3. **Tight ACKO integration.** Cluster lifecycle operations (create,
   scale, upgrade, restart) are first-class in the UI.
4. **Stable layout.** Layout and navigation structure are not changed
   without a strong reason. Surprises in this area break operator
   muscle memory.
5. **Wizard-first cluster creation.** Creating a new ACKO cluster
   through the wizard remains the recommended path; we keep its
   ergonomics polished.
6. **Backend ↔ frontend types are in sync.** Backend Pydantic models
   and frontend TypeScript types in `lib/api/types.ts` are updated
   together — changing one requires changing the other in the same PR.
7. **Record browser handles large datasets.** Scans and queries against
   high-cardinality namespaces remain responsive through limits,
   pagination, and timeouts.

### 4. `ackoctl` — CLI for the ACKO stack

Same control plane the UI uses, scriptable from a terminal or an agent.

1. **UI parity.** Any operation a human can do in Cluster Manager has
   a CLI counterpart. The CLI is never strictly more limited than the
   UI.
2. **Scriptable output.** Every list/get command supports a structured
   output mode (`--output json`) suitable for piping into `jq`, agents,
   or other automation.
3. **Stable command grammar.** Verbs and flags follow semver. Removing
   or renaming a public verb requires a deprecation cycle.
4. **Day-2 operations coverage.** Scaling, rolling upgrades, restart
   workflows, ACL management, raw `asinfo`, namespace-level operations,
   and AerospikeCluster CR introspection are all exposed.
5. **Agent-friendly errors.** Failure messages are structured and
   actionable — they identify the layer that failed (CR vs. operator
   vs. data plane) so an agent can route the fix.

### 5. Plugins — Claude Code plugin pack

AI-assistant integration for the ecosystem.

1. **Skills track upstream changes.** When `aerospike-py`'s public API
   changes or ACKO's CRD changes shape, the corresponding skill is
   updated in the same release cycle.
2. **Debugging skill accuracy.** `acko-debugging` reflects real
   troubleshooting decision trees — when an operator follows it, the
   suggestions converge to the actual root cause, not to wallpaper.
3. **Trigger discipline.** Skill descriptions trigger on the right
   intents and do not over-fire. Off-topic triggers waste user
   tokens and erode trust.
4. **Single source of truth.** Skills reference the canonical docs in
   each project rather than restating them; the plugin pack is a
   *router*, not a duplicate of the documentation.
