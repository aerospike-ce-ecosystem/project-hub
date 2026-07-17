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

This page explains **why the Aerospike CE Ecosystem exists** and **what each
project aims to achieve**. It is the shared reference for the ecosystem. Each
repository links here, and new design decisions should support these goals.

---

## Why this ecosystem exists

Aerospike is a high-performance, low-latency NoSQL database. It is well suited
to online feature stores and other latency-sensitive services. Three gaps,
however, make production adoption difficult—especially for large organizations
running on Kubernetes. This ecosystem addresses those gaps.

### 1. The official Python client cannot sustain ML feature-store workloads

The official Python client binds to the C library through CFFI. It holds the
GIL across the I/O path, does not provide native async I/O, and ships type
stubs that can drift from the runtime. These limitations matter in ML serving,
where Python feature-store reads must keep pace with model inference. The
overhead can rule out Aerospike even when the database itself is a good fit.

**Response:** `aerospike-py` is built in Rust with PyO3. It provides native
async I/O, releases the GIL throughout the I/O path, supports NumPy-aware batch
operations, and includes complete `.pyi` stubs. On the standard mixed-workload
benchmark, it delivers approximately **2.4× the throughput** of the official C
client.

### 2. Aerospike has no community-maintained cloud-native ecosystem

Aerospike does not provide a community-maintained Kubernetes operator; the
official AKO requires Enterprise Edition. CE also lacks a maintained web
management interface, and most operational tools assume bare-metal
deployments. Each team must therefore build its own Kubernetes day-2 workflows
for scaling, rolling upgrades, warm restarts, ACL synchronization, and dynamic
configuration.

**Response:** **ACKO** provides the CE-focused Kubernetes operator, **Cluster
Manager** provides the FastAPI/Next.js web interface, and `ackoctl` provides the
CLI. Together they cover declarative lifecycle management, rolling upgrades,
warm restarts, ACL management, and an OpenTelemetry-instrumented data path.
Operators can use the same capabilities through CRDs, the UI, or the CLI.

### 3. Enterprise Edition adoption is not an individual-level decision

Aerospike Enterprise Edition is licensed at the organization level. Adoption
usually involves procurement, legal, finance, and architecture review, so an
individual engineer or team cannot make the decision alone. Community Edition
therefore becomes the practical production baseline for many teams, even when
Enterprise features would help them.

**Response:** Every component exposes one stable interface for both CE and
Enterprise Edition. Teams can start with CE and keep the same operator, client,
and observability stack if the organization later adopts Enterprise Edition.
Application integration code and operational tooling do not need to change.

---

## Ecosystem-wide commitments

The following commitments apply to every project. When a local preference
conflicts with one of them, the ecosystem-wide commitment takes priority.

### Open-source first, Enterprise-Edition compatible

Every component works with Aerospike CE and Enterprise Edition. Integrations,
the operator, observability hooks, and operational tools use the same interface
for both editions. Teams can use CE now and move to Enterprise Edition later
without rewriting their integration.

### Cloud-native advancement

Kubernetes is a first-class deployment target. ACKO provides declarative
cluster management through CRDs and reconciliation. Cluster Manager and
`ackoctl` expose the same day-2 operations through a web UI and CLI, while
OpenTelemetry covers the data path end to end. None of these capabilities
requires an Enterprise Edition license.

### Agent-driven operations

Agents can use the same operational primitives as human operators. `ackoctl`
returns structured output for automation, and the Claude Code plugin pack
provides nine Skills for deployment, debugging, day-2 operations, and E2E
testing. The documentation is also organized so agents can navigate it without
an additional translation layer.

---

## Per-project goals

### 1. `aerospike-py` — Rust-backed Python client

The repository contains detailed goals and references under
`.claude/skills/project-goals/`. The summary below makes the same contract
available to readers outside the repository.

1. **Preserve the performance advantage.** Maintain better throughput and
   latency than the official C client. Rust/PyO3 handles the expensive work;
   Python remains a thin wrapper.
2. **Track `aerospike-client-rust` v2.** Stay current with the upstream
   `aerospike-client-rust` crate as it evolves; pick up new features
   behind opt-in flags when they land.
3. **Maintain production-ready NumPy batch APIs.** Keep `batch_read_numpy`
   and `batch_write_numpy` reliable for ML feature-store workloads.
4. **First-class observability.** Logging, Prometheus metrics, and
   OpenTelemetry tracing are kept current. The FastAPI integration is
   verified end-to-end against the `sample-fastapi` example.
5. **Remain reliable under load.** `batch_write(..., retry=10)` and related
   options should handle transient cluster failures without exposing partial
   state to callers.
6. **Type safety.** Public API returns `NamedTuple`s, policies are
   `TypedDict`s, and `.pyi` stubs are complete and aligned with the
   runtime.

### 2. ACKO — Aerospike CE Kubernetes Operator

ACKO manages the Aerospike CE cluster lifecycle on Kubernetes.

1. **Keep the CRD surface small.** Express cluster state with standard
   Kubernetes resources such as Pods, StatefulSets, Services, and PVCs. Add a
   custom resource only when Kubernetes has no suitable equivalent.
2. **Cluster templates with sharp purposes.** Three templates with
   distinct intent:
   - `minimal` — single-node, for development.
   - `soft-rack` — 1 node, N pods, for staging.
   - `hard-rack` — N nodes, N pods, for production.
   Improvements stay within those purposes.
3. **Keep the Helm chart releasable.** Give
   `charts/aerospike-ce-kubernetes-operator/` a clear release pipeline and
   versioning policy.
4. **Broad e2e coverage.** Kind-based e2e scenarios cover scaling,
   rolling upgrades, ACL sync, observability, and the cluster-manager
   integration.
5. **Enforce CE constraints in the webhook.** Reject `size > 8`, more than two
   namespaces, XDR, TLS, and other Enterprise-only features before admitting
   the CR. Return a clear error instead of accepting a configuration that
   cannot work.

### 3. Cluster Manager — Web UI for cluster operations

Cluster Manager combines a FastAPI backend with a Next.js frontend. ACKO can
deploy it as part of the Kubernetes stack, or it can run independently against
an existing cluster.

1. **Component reuse over duplication.** Shared frontend components live
   in one place; new pages compose them rather than fork them.
2. **Bound every read and write path.** Data-table queries enforce limits,
   pagination, and timeouts so an exploratory action cannot overwhelm a
   production cluster.
3. **Tight ACKO integration.** Cluster lifecycle operations (create,
   scale, upgrade, restart) are first-class in the UI.
4. **Keep the layout stable.** Change layout or navigation only when the
   benefit outweighs the cost of disrupting operator habits.
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

`ackoctl` exposes the same control plane as the UI in a form that scripts and
agents can use from a terminal.

1. **UI parity.** Any operation a human can do in Cluster Manager has
   a CLI counterpart. The CLI is never strictly more limited than the
   UI.
2. **Provide scriptable output.** Every list/get command supports
   `--output json` for `jq`, agents, and other automation.
3. **Stable command grammar.** Verbs and flags follow semver. Removing
   or renaming a public verb requires a deprecation cycle.
4. **Day-2 operations coverage.** Scaling, rolling upgrades, restart
   workflows, ACL management, raw `asinfo`, namespace-level operations,
   and AerospikeCluster CR introspection are all exposed.
5. **Return actionable errors.** A failure identifies the layer that failed—CR,
   operator, or data plane—so a human or agent can choose the right fix.

### 5. Plugins — Claude Code plugin pack

AI-assistant integration for the ecosystem.

1. **Skills track upstream changes.** When `aerospike-py`'s public API
   changes or ACKO's CRD changes shape, the corresponding skill is
   updated in the same release cycle.
2. **Keep debugging guidance accurate.** `acko-debugging` follows real
   troubleshooting decision trees and narrows the problem toward a likely root
   cause instead of offering generic advice.
3. **Use precise triggers.** Skill descriptions should match the intended user
   request without firing on unrelated tasks.
4. **Keep one source of truth.** Skills link to each project's canonical
   documentation instead of copying it. The plugin pack acts as a *router*, not
   a second documentation set.
