import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

interface Problem {
  tag: string;
  title: string;
  problem: React.ReactNode;
  solution: React.ReactNode;
}

const PROBLEMS: Problem[] = [
  {
    tag: '01 · Performance',
    title: 'The Python client cannot carry an ML feature-store workload',
    problem: (
      <>
        Aerospike is a natural fit for online feature stores — sub-millisecond
        point reads, predictable tail latency, native list/map types for
        feature vectors. But Python is the working language of ML pipelines,
        and the official client wraps the C library through CFFI:
        the GIL is held across the I/O path, async support is bolted on,
        and the type stubs drift from the runtime. At feature-store
        throughput, that gap is large enough to disqualify Aerospike from
        otherwise good-fit use cases.
      </>
    ),
    solution: (
      <>
        →&nbsp;<code>aerospike-py</code> — a from-scratch client in
        Rust&nbsp;(PyO3) with native async, GIL release across the I/O path,
        NumPy batch fast-paths, and complete type stubs. About <strong>2.4×
        the throughput</strong> of the official C client on standard mixed
        workloads, with first-class support for ML inference servers.
      </>
    ),
  },
  {
    tag: '02 · Cloud-native',
    title: 'No CE-grade Kubernetes story',
    problem: (
      <>
        Aerospike CE ships no community Kubernetes operator — the upstream
        AKO is Enterprise-only. There is no maintained web management UI,
        and most operational tooling assumes bare-metal deployments.
        Day-2 operations on Kubernetes (scaling, rolling upgrades, warm
        restarts, dynamic config) are left to teams to reinvent.
      </>
    ),
    solution: (
      <>
        →&nbsp;<strong>ACKO</strong> (CE-focused operator)
        +&nbsp;<strong>Cluster Manager</strong> (FastAPI + Next.js UI)
        +&nbsp;<code>ackoctl</code> (CLI). Declarative cluster management,
        scaling and rolling upgrades, warm-restart workflows, ACL
        management, OpenTelemetry-instrumented data path — all driven by
        CRDs and exposed through a UI and a CLI.
      </>
    ),
  },
  {
    tag: '03 · EE gate',
    title: 'Enterprise Edition is often out of reach inside large orgs',
    problem: (
      <>
        Adopting Aerospike EE requires an org-level contract. Inside a
        large organization, procurement, legal, finance, and architecture
        sign-offs become their own blocker — a classic <em>bell the
        cat</em> problem where everyone agrees EE would help, but no one
        owns pushing the contract through, and the cost-justification
        burden lands on whoever raises their hand.
      </>
    ),
    solution: (
      <>
        →&nbsp;Every component supports <strong>both CE and EE</strong>.
        Teams ship on CE today, with the same operator, the same client,
        the same observability surface — and transparently move to EE
        later if and when the contract lands. The ecosystem unblocks
        adoption without forcing the contract decision up front.
      </>
    ),
  },
];

const COMMITMENTS: {title: string; body: React.ReactNode}[] = [
  {
    title: 'Open-source first, EE-compatible',
    body: (
      <>
        Every component runs against both Aerospike CE and EE, so adoption
        is not gated on procurement. CE today, EE later, no integration
        rewrite.
      </>
    ),
  },
  {
    title: 'Cloud-native by default',
    body: (
      <>
        Declarative Kubernetes management via ACKO, a real web UI for cluster
        ops, and an OpenTelemetry-instrumented data path — without an EE
        license.
      </>
    ),
  },
  {
    title: 'Agent-driven operations',
    body: (
      <>
        The same operational primitives are exposed through{' '}
        <code>ackoctl</code> and a Claude Code plugin pack. Agents can
        provision, scale, debug, and operate Aerospike clusters with the
        same surface a human operator uses.
      </>
    ),
  },
];

export default function WhySection(): React.JSX.Element {
  return (
    <section className={clsx('container', styles.section)}>
      <div className={styles.intro}>
        <span className={styles.eyebrow}>Why this ecosystem exists</span>
        <h2 className={styles.title}>
          Aerospike is fast. Adopting it well, less so.
        </h2>
        <p className={styles.lead}>
          Aerospike is a high-performance, low-latency NoSQL database, and an
          excellent fit for online feature stores and other low-latency
          serving paths. Three practical gaps make it hard to actually ship
          on Aerospike at production quality today — especially inside large
          organizations and on Kubernetes. The <strong>aerospike-ce-ecosystem</strong> closes
          those gaps with an open-source, cloud-native, agent-friendly toolchain.
        </p>
      </div>

      <div className={clsx('row', styles.problemRow)}>
        {PROBLEMS.map((p) => (
          <div key={p.tag} className={clsx('col col--4', styles.problemCol)}>
            <article className={styles.problemCard}>
              <div className={styles.problemTag}>{p.tag}</div>
              <h3 className={styles.problemTitle}>{p.title}</h3>
              <p className={styles.problemBody}>{p.problem}</p>
              <p className={styles.problemSolution}>{p.solution}</p>
            </article>
          </div>
        ))}
      </div>

      <div className={styles.commitmentsBlock}>
        <h3 className={styles.commitmentsTitle}>What we ship</h3>
        <ul className={styles.commitmentsList}>
          {COMMITMENTS.map((c) => (
            <li key={c.title}>
              <strong>{c.title}.</strong> {c.body}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
