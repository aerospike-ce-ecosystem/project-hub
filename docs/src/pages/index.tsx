import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomeStats from '@site/src/components/HomeStats';
import styles from './index.module.css';

const repos = [
  {
    name: 'aerospike-py',
    description: 'Rust(PyO3) 기반 고성능 Python 클라이언트',
    tech: 'Python / Rust',
    docs: 'https://aerospike-ce-ecosystem.github.io/aerospike-py/',
    github: 'https://github.com/aerospike-ce-ecosystem/aerospike-py',
  },
  {
    name: 'ACKO',
    description: 'Aerospike CE Kubernetes Operator',
    tech: 'Go / Kubebuilder',
    docs: 'https://aerospike-ce-ecosystem.github.io/aerospike-ce-kubernetes-operator/',
    github: 'https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator',
  },
  {
    name: 'Cluster Manager',
    description: '웹 기반 클러스터 관리 UI',
    tech: 'Next.js / FastAPI',
    docs: null,
    github: 'https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager',
  },
  {
    name: 'ackoctl',
    description: 'cluster-manager CLI · Aerospike 운영 자동화',
    tech: 'Go / cobra',
    docs: null,
    github: 'https://github.com/aerospike-ce-ecosystem/ackoctl',
  },
  {
    name: 'Plugins',
    description: 'Claude Code 에코시스템 플러그인 (9 skills)',
    tech: 'Claude Code',
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
          Aerospike CE를 위한 모던 Python 클라이언트 · Kubernetes Operator · 웹 UI · CLI · AI 개발 도구를 한 곳에서.
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

function RepoCard({name, description, tech, docs, github}: (typeof repos)[0]) {
  return (
    <div className={clsx('col col--4', styles.repoCol)}>
      <div className={clsx('card', styles.repoCard)}>
        <div className="card__header">
          <h3 className={styles.repoName}>{name}</h3>
          <p className={styles.repoTech}>{tech}</p>
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
      description="Aerospike CE 생태계 — Python 클라이언트, Kubernetes Operator, Cluster Manager, ackoctl, Plugins를 위한 단일 허브"
    >
      <HomepageHeader />
      <main className={styles.mainWrap}>
        <section className={clsx('container', styles.section)}>
          <div className={styles.sectionHead}>
            <h2>Core Repositories</h2>
            <p className={styles.sectionDesc}>
              생태계를 구성하는 핵심 리포지토리. 각 프로젝트는 독립적으로 사용할 수 있도록 느슨하게 결합되어 있습니다.
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
