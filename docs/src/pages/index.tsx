import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

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
    name: 'Plugins',
    description: 'Claude Code 에코시스템 플러그인',
    tech: 'Skills / Agents',
    docs: null,
    github: 'https://github.com/aerospike-ce-ecosystem/aerospike-ce-ecosystem-plugins',
  },
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary')} style={{padding: '4rem 0'}}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

function RepoCard({name, description, tech, docs, github}: (typeof repos)[0]) {
  return (
    <div className="col col--3" style={{marginBottom: '1rem'}}>
      <div className="card" style={{height: '100%'}}>
        <div className="card__header">
          <h3>{name}</h3>
        </div>
        <div className="card__body">
          <p>{description}</p>
          <p><small>{tech}</small></p>
        </div>
        <div className="card__footer">
          <a href={github} className="button button--outline button--primary button--sm" style={{marginRight: '0.5rem'}}>
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

export default function Home(): JSX.Element {
  return (
    <Layout description="Aerospike CE Ecosystem Project Hub">
      <HomepageHeader />
      <main>
        <section style={{padding: '2rem 0'}}>
          <div className="container">
            <h2>Core Repositories</h2>
            <div className="row">
              {repos.map((repo) => (
                <RepoCard key={repo.name} {...repo} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
