import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomeStats from '@site/src/components/HomeStats';
import WhySection from '@site/src/components/WhySection';
import styles from './index.module.css';

interface Repo {
  name: string;
  description: string;
  docs: string | null;
  github: string;
}

const aerospikePy: Repo = {
  name: 'aerospike-py',
  description:
    'High-performance Python client built on Rust (PyO3). Native async, GIL release across the I/O path, NumPy batch fast-paths — designed for ML feature-store and inference-serving workloads.',
  docs: 'https://aerospike-ce-ecosystem.github.io/aerospike-py/',
  github: 'https://github.com/aerospike-ce-ecosystem/aerospike-py',
};

const acko: Repo = {
  name: 'ACKO',
  description:
    'CE-focused Kubernetes operator. Declarative cluster management, rolling upgrades, warm restarts, ACL sync, OpenTelemetry-instrumented data path.',
  docs: 'https://aerospike-ce-ecosystem.github.io/aerospike-ce-kubernetes-operator/',
  github: 'https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator',
};

const clusterManager: Repo = {
  name: 'Cluster Manager',
  description:
    'Web UI for cluster operations — namespace browsing, record inspection, query builder, and K8s cluster management. Deployed by ACKO as part of the stack.',
  docs: null,
  github: 'https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager',
};

const ackoctl: Repo = {
  name: 'ackoctl',
  description:
    'CLI surface for cluster-manager and ACKO. The same operational primitives the UI exposes, scriptable from terminals and agents.',
  docs: null,
  github: 'https://github.com/aerospike-ce-ecosystem/ackoctl',
};

const plugins: Repo = {
  name: 'Plugins',
  description:
    'Claude Code plugin pack — nine skills covering deployment, debugging, day-2 operations, e2e testing, and bug routing across the ecosystem.',
  docs: null,
  github: 'https://github.com/aerospike-ce-ecosystem/aerospike-ce-ecosystem-plugins',
};

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.hero)}>
      <div className={clsx('container', styles.heroInner)}>
        <span className={styles.heroEyebrow}>Aerospike CE Ecosystem</span>
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <p className={styles.heroLead}>
          A modern Python client, Kubernetes operator, web UI, CLI, and AI development tooling for Aerospike CE — all in one place.
        </p>
        <div className={styles.heroCtas}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            Get Started
          </Link>
          <Link className="button button--secondary button--lg" to="https://github.com/aerospike-ce-ecosystem">
            GitHub Org
          </Link>
        </div>
      </div>
    </header>
  );
}

function RepoCard({repo, variant = 'default'}: {repo: Repo; variant?: 'default' | 'parent' | 'child'}) {
  const cardClass = clsx(
    'card',
    styles.repoCard,
    variant === 'parent' && styles.repoCardParent,
    variant === 'child' && styles.repoCardChild,
  );
  return (
    <div className={cardClass}>
      <div className="card__header">
        <h3 className={styles.repoName}>{repo.name}</h3>
      </div>
      <div className="card__body">
        <p className={styles.repoDesc}>{repo.description}</p>
      </div>
      <div className={clsx('card__footer', styles.repoFooter)}>
        <a href={repo.github} className="button button--outline button--primary button--sm">
          GitHub
        </a>
        {repo.docs && (
          <a href={repo.docs} className="button button--primary button--sm">
            Docs
          </a>
        )}
      </div>
    </div>
  );
}

function StandaloneGroup({label, note, repos}: {label: string; note: string; repos: Repo[]}) {
  return (
    <div className={styles.group}>
      <div className={styles.groupHead}>
        <span className={styles.groupLabel}>{label}</span>
        <span className={styles.groupNote}>{note}</span>
      </div>
      <div className={styles.standaloneGrid}>
        {repos.map((r) => (
          <RepoCard key={r.name} repo={r} />
        ))}
      </div>
    </div>
  );
}

function AckoStackGroup() {
  return (
    <div className={clsx(styles.group, styles.ackoStack)}>
      <div className={styles.groupHead}>
        <span className={styles.groupLabel}>ACKO Kubernetes stack</span>
        <span className={styles.groupNote}>
          Aerospike CE on Kubernetes, end-to-end. <code>cluster-manager</code> and{' '}
          <code>ackoctl</code> ship as part of the ACKO stack — the operator
          deploys the UI, and the CLI drives the same control plane the UI uses.
        </span>
      </div>

      {/* Parent: ACKO */}
      <div className={styles.ackoParentWrap}>
        <RepoCard repo={acko} variant="parent" />
      </div>

      {/* Containment connector */}
      <div className={styles.ackoConnector} aria-hidden>
        <span className={styles.ackoConnectorLine} />
        <span className={styles.ackoConnectorLabel}>contains</span>
        <span className={styles.ackoConnectorLine} />
      </div>

      {/* Children: Cluster Manager + ackoctl */}
      <div className={styles.ackoChildrenGrid}>
        <RepoCard repo={clusterManager} variant="child" />
        <RepoCard repo={ackoctl} variant="child" />
      </div>
    </div>
  );
}

export default function Home(): React.JSX.Element {
  return (
    <Layout
      title="Aerospike CE Ecosystem Hub"
      description="The Aerospike CE ecosystem — one hub for the Python client, Kubernetes operator, cluster manager, ackoctl, and plugins."
    >
      <HomepageHeader />
      <main className={styles.mainWrap}>
        <WhySection />

        <section className={clsx('container', styles.section)}>
          <div className={styles.sectionHead}>
            <h2>Core repositories</h2>
            <p className={styles.sectionDesc}>
              The ecosystem is organised into three layers — an application-side
              client, an ACKO-driven Kubernetes stack, and an optional AI tooling
              pack. Each layer can be adopted on its own.
            </p>
          </div>

          <StandaloneGroup
            label="Client"
            note="Application-side surface — embeds directly into Python services."
            repos={[aerospikePy]}
          />

          <AckoStackGroup />

          <StandaloneGroup
            label="Developer tooling"
            note="Optional, agent-facing — speeds up day-1 and day-2 work without changing the data plane."
            repos={[plugins]}
          />
        </section>

        <section className={clsx('container', styles.section)}>
          <HomeStats />
        </section>
      </main>
    </Layout>
  );
}
