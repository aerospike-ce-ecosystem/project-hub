---
title: Aerospike CE Ecosystem Hub
description: Central hub for the Aerospike CE Ecosystem, holding the cross-repo architecture, ADRs, roadmap, release compatibility matrix, and coordination docs. Start here to see how the five repositories fit together.
sidebar_position: 1
scope: ecosystem
repos:
  - aerospike-py
  - aerospike-ce-kubernetes-operator
  - aerospike-cluster-manager
  - ackoctl
  - aerospike-ce-ecosystem-plugins
  - project-hub
tags:
  - introduction
  - ecosystem
  - overview
last_updated: 2026-09-02
---

# Aerospike CE Ecosystem Hub

This site is the central hub for the Aerospike CE Ecosystem. It holds the documentation that belongs to no single repository: system architecture, Architecture Decision Records, the quarterly roadmap, the release compatibility matrix, and the conventions every project follows. Work that spans two or more repositories is proposed, planned, and tracked here.

The ecosystem exists because Aerospike Community Edition leaves several gaps for teams running it in production. There is no community-maintained Kubernetes operator, because the official AKO requires Enterprise Edition. The official Python client binds to the C library through CFFI and holds the GIL across the I/O path, which caps throughput in ML feature-store workloads. CE ships no maintained web management interface, and there is no Aerospike-specific tooling for AI-assisted development. The five repositories below close those gaps. [Project Goals](./goals/project-goals.md) explains the reasoning in full.

## Core repositories

| Repository | What it is | Stack |
|------------|------------|-------|
| [aerospike-py](https://github.com/aerospike-ce-ecosystem/aerospike-py) | High-performance sync and async Python client for Aerospike, with NumPy-aware batch APIs and complete type stubs | Rust/PyO3 + Tokio, Python 3.10+ |
| [aerospike-ce-kubernetes-operator](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator) (ACKO) | Kubernetes operator that manages CE clusters declaratively through the `AerospikeCluster` CRD, with CE constraints enforced by an admission webhook | Go, kubebuilder v4, controller-runtime |
| [aerospike-cluster-manager](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager) | Web management UI covering cluster monitoring, a record browser, a query builder, and Kubernetes management | FastAPI + Next.js |
| [ackoctl](https://github.com/aerospike-ce-ecosystem/ackoctl) | CLI that drives Cluster Manager from a terminal: connections, clusters, Kubernetes CRs, records, sets, queries, indexes, users and roles, and UDFs | Go + cobra |
| [aerospike-ce-ecosystem-plugins](https://github.com/aerospike-ce-ecosystem/aerospike-ce-ecosystem-plugins) | Claude Code plugin pack with nine skills for AI-assisted development and operations | Claude Code plugin |

## How the pieces fit

The ecosystem is organized in three layers.

1. **Plugin skills.** Claude Code skills that guide deployment, debugging, day-2 operations, and client API usage.
2. **Tools.** aerospike-py, ACKO, Cluster Manager, and ackoctl.
3. **Infrastructure.** Aerospike CE running on Kubernetes through ACKO, or on bare metal.

Users reach the infrastructure layer either through the tools directly or through an AI assistant loaded with the plugin skills. Every project is usable on its own, so integration is opt-in rather than assumed.

Changes that cross repositories follow the dependency order `aerospike-py` → `ACKO` → `cluster-manager` → `plugins`, which is also the merge order for coordinated releases. [System Architecture Overview](./architecture/overview.mdx) shows the full picture, including both the Kubernetes and bare-metal deployment paths.

## What you will find here

| Section | Contents |
|---------|----------|
| [Architecture](./architecture/overview.mdx) | System diagrams, per-component views, and deployment topology |
| [Architecture Decision Records](./architecture/adr-index.mdx) | Every accepted, proposed, and superseded decision, with the context and trade-offs behind it |
| [Roadmap](./roadmap/current.md) | Goals and priorities for the current quarter, plus per-quarter milestones |
| [Release compatibility matrix](./history/releases/release-matrix.md) | Verified version combinations across all projects, updated on every release |
| [Coordination](./coordination/labels.md) | Shared label taxonomy, [GitHub workflow status](./coordination/agentic-workflow.mdx), and the [cross-repo review process](./coordination/review-process.md) |
| [Goals](./goals/project-goals.md) | Why the ecosystem exists, per-project goals, and the [design philosophy](./goals/project-design.md) behind the technology choices |

## Quick links

- [aerospike-py documentation](https://aerospike-ce-ecosystem.github.io/aerospike-py/)
- [ACKO documentation](https://aerospike-ce-ecosystem.github.io/aerospike-ce-kubernetes-operator/)
- Install the Claude Code plugin pack:

  ```bash
  claude plugin marketplace add aerospike-ce-ecosystem/aerospike-ce-ecosystem-plugins
  claude plugin install aerospike-ce-ecosystem
  ```

## How to contribute

To propose documentation changes or work that touches more than one repository, open an issue here using the template that matches your intent.

### Cross-Repo Issue

Use this for work involving two or more repositories. Mark the repositories affected and link each repository's sub-issue in `org/repo#number` form.

### Epic

Use this for larger work that splits into stages. Record the success criteria and sub-tasks as a checklist, and group the related issues and pull requests under the one Epic.

### ADR Proposal

Use this to propose an architecture decision. Lay out the context, the options considered, the recommendation, and the trade-offs in the same shape every ADR uses, so the discussion stays comparable across decisions.

:::tip Where to open an issue
Issues that concern a single repository belong in that repository. This hub is for work that spans repositories and for ecosystem-level coordination.
:::
