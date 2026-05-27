import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomeStats from '@site/src/components/HomeStats';
import WhySection from '@site/src/components/WhySection';
import styles from './index.module.css';

const repos = [
  {
    name: 'aerospike-py',
    description:
      'High-performance Python client built on Rust (PyO3). Native async, GIL release across the I/O path, NumPy batch fast-paths — designed for ML feature-store and inference-serving workloads.',
    docs: 'https://aerospike-ce-ecosystem.github.io/aerospike-py/',
    github: 'https://github.com/aerospike-ce-ecosystem/aerospike-py',
  },
  {
    name: 'ACKO',
    description:
      'CE-focused Kubernetes operator. Declarative cluster management, rolling upgrades, warm restarts, ACL sync, OpenTelemetry-instrumented data path.',
    docs: 'https://aerospike-ce-ecosystem.github.io/aerospike-ce-kubernetes-operator/',
    github: 'https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator',
  },
  {
    name: 'Cluster Manager',
    description:
      'Web UI for cluster operations — namespace browsing, record inspection, query builder, and Kubernetes cluster management on top of ACKO.',
    docs: null,
    github: 'https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager',
  },
  {
    name: 'ackoctl',
    description:
      'CLI surface for cluster-manager and ACKO. The same operational primitives the UI exposes, scriptable from terminals and agents.',
    docs: null,
    github: 'https://github.com/aerospike-ce-ecosystem/ackoctl',
  },
  {
    name: 'Plugins',
    description:
      'Claude Code plugin pack — nine skills covering deployment, debugging, day-2 operations, e2e testing, and bug routing for the ecosystem.',
    docs: null,
    github: 'https://github.com/aerospike-ce-ecosystem/aerospike-ce-ecosystem-plugins',
  },
];

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

function RepoCard({name, description, docs, github}: (typeof repos)[0]) {
  return (
    <div className={clsx('col col--4', styles.repoCol)}>
      <div className={clsx('card', styles.repoCard)}>
        <div className="card__header">
          <h3 className={styles.repoName}>{name}</h3>
        </div>
        <div className="card__body">
          <p className={styles.repoDesc}>{description}</p>
        </div>
        <div className={clsx('card__footer', styles.repoFooter)}>
          <a href={github} className="button button--outline button--primary button--sm">
            GitHub
          </a>
          {docs && (
            <a href={docs} className="button button--primary button--sm">
              Docs
            </a>
          )}
        </div>
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
              The repositories that make up the ecosystem. Each project is loosely coupled so it can be adopted on its own.
            </p>
          </div>
          <div className="row">
            {repos.map((repo) => (
              <RepoCard key={repo.name} {...repo} />
            ))}
          </div>
        </section>

        <section className={clsx('container', styles.section)}>
          <HomeStats />
        </section>
      </main>
    </Layout>
  );
}
