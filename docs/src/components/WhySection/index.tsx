import React, {useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type Lang = 'en' | 'ko';

interface Problem {
  tag: string;
  title: string;
  problem: React.ReactNode;
  solution: React.ReactNode;
}

interface Commitment {
  title: string;
  body: React.ReactNode;
}

interface Content {
  eyebrow: string;
  title: string;
  lead: React.ReactNode;
  problems: Problem[];
  commitmentsTitle: string;
  commitments: Commitment[];
}

const CONTENT: Record<Lang, Content> = {
  en: {
    eyebrow: 'Why this ecosystem exists',
    title: 'Project overview',
    lead: (
      <>
        Aerospike is a high-performance, low-latency NoSQL database and a
        natural fit for online feature stores and other low-latency
        serving paths. In real-world production environments, however,
        three structural constraints come into play — particularly in
        large organizations and on Kubernetes. The{' '}
        <strong>aerospike-ce-ecosystem</strong> exists to address those
        constraints with an open-source, cloud-native, agent-friendly
        toolchain.
      </>
    ),
    problems: [
      {
        tag: '01 · Client performance',
        title: 'The official Python client cannot sustain ML feature-store workloads',
        problem: (
          <ul>
            <li>CFFI binding to the C client — the GIL is held across the entire I/O path.</li>
            <li>Asynchronous I/O is not natively supported; the published type stubs drift from the runtime.</li>
            <li>At feature-store throughput, the overhead excludes Aerospike from workloads where it would otherwise be a strong fit.</li>
          </ul>
        ),
        solution: (
          <>
            →&nbsp;<code>aerospike-py</code> — Rust&nbsp;(PyO3) client with native
            async, GIL release across the I/O path, and NumPy-aware batch
            interfaces. Approximately <strong>2.4× the throughput</strong> of
            the official C client on standard mixed workloads.
          </>
        ),
      },
      {
        tag: '02 · Cloud-native gap',
        title: 'Aerospike has no community-maintained cloud-native ecosystem',
        problem: (
          <ul>
            <li>No community Kubernetes operator — the official AKO is Enterprise-only.</li>
            <li>No maintained web management interface; most tooling assumes bare-metal deployments.</li>
            <li>Day-2 operations (scaling, rolling upgrades, warm restarts, dynamic config) are left to each team to reimplement.</li>
          </ul>
        ),
        solution: (
          <>
            →&nbsp;<strong>ACKO</strong> (operator) +{' '}
            <strong>Cluster Manager</strong> (UI) +{' '}
            <code>ackoctl</code> (CLI). Declarative cluster lifecycle,
            rolling upgrades, warm-restart workflows, ACL management, and
            an OpenTelemetry-instrumented data path — all CRD-driven.
          </>
        ),
      },
      {
        tag: '03 · License model',
        title: 'Enterprise Edition adoption is not an individual decision',
        problem: (
          <ul>
            <li>Enterprise Edition is licensed at the organization level — adoption requires a commercial agreement.</li>
            <li>Procurement, legal, finance, and architecture review are involved by design.</li>
            <li>The decision sits above any individual engineer or team, so CE becomes the practical production baseline.</li>
          </ul>
        ),
        solution: (
          <>
            →&nbsp;Every component supports both <strong>CE and Enterprise
            Edition</strong> through a single, consistent API. Build on CE
            today, migrate to EE if and when the organizational decision is
            made — without changes to application code or operational
            tooling.
          </>
        ),
      },
    ],
    commitmentsTitle: 'What we ship',
    commitments: [
      {
        title: 'Supports CE & EE',
        body: (
          <>
            Every component operates against both Aerospike CE and the
            Enterprise Edition through a single, consistent API. Adoption
            is not tied to the procurement timeline — CE today, EE later,
            with no integration changes.
          </>
        ),
      },
      {
        title: 'Cloud-native advancement',
        body: (
          <>
            We continuously advance the cloud-native story for Aerospike
            CE — ACKO for declarative Kubernetes management, a maintained
            web management interface for cluster operations, and an
            OpenTelemetry-instrumented data path. None of these require
            an Enterprise Edition license.
          </>
        ),
      },
      {
        title: 'Agent-driven operations',
        body: (
          <>
            The same operational primitives are exposed through{' '}
            <code>ackoctl</code> and a Claude Code plugin pack. Autonomous
            agents can provision, scale, debug, and operate Aerospike
            clusters through the same surface a human operator would use.
          </>
        ),
      },
    ],
  },

  ko: {
    eyebrow: '이 ecosystem이 존재하는 이유',
    title: '프로젝트 개요',
    lead: (
      <>
        Aerospike는 고성능·저지연 NoSQL 데이터베이스로, 온라인 feature
        store를 비롯한 저지연 서빙 경로에 자연스럽게 들어맞는다. 그러나
        실제 운영 환경에는 세 가지 구조적 제약이 존재한다 — 특히
        대규모 조직과 쿠버네티스 환경에서 두드러진다.{' '}
        <strong>aerospike-ce-ecosystem</strong>은 오픈소스 · 클라우드
        네이티브 · 에이전트 친화적인 도구로 이 제약을 해소한다.
      </>
    ),
    problems: [
      {
        tag: '01 · 클라이언트 성능',
        title: '공식 Python 클라이언트로는 ML feature store 워크로드를 감당하기 어렵다',
        problem: (
          <ul>
            <li>C 클라이언트에 대한 CFFI 바인딩 — I/O 경로 전반에서 GIL이 유지된다.</li>
            <li>비동기 I/O가 네이티브로 지원되지 않고, 게시된 type stub은 런타임과 일치하지 않는다.</li>
            <li>feature store 처리량 수준에서 본래 적합한 워크로드조차 Aerospike가 채택 후보에서 제외된다.</li>
          </ul>
        ),
        solution: (
          <>
            →&nbsp;<code>aerospike-py</code> — Rust(PyO3) 기반 클라이언트.
            네이티브 비동기 I/O, I/O 경로 GIL release, NumPy 친화 배치
            인터페이스 제공. 표준 mixed 워크로드 기준 공식 C 클라이언트
            대비 <strong>약 2.4배의 처리량</strong>.
          </>
        ),
      },
      {
        tag: '02 · 클라우드 네이티브 갭',
        title: 'Aerospike에는 커뮤니티 수준의 cloud-native 생태계가 없다',
        problem: (
          <ul>
            <li>커뮤니티가 유지보수하는 쿠버네티스 오퍼레이터 없음 — 공식 AKO는 Enterprise Edition 전용.</li>
            <li>유지보수되는 웹 관리 인터페이스 없음, 대부분의 운영 도구는 bare-metal 배포 전제.</li>
            <li>스케일링·롤링 업그레이드·warm restart 등 day-2 운영을 팀마다 개별적으로 재구현해야 한다.</li>
          </ul>
        ),
        solution: (
          <>
            →&nbsp;<strong>ACKO</strong>(오퍼레이터) +{' '}
            <strong>Cluster Manager</strong>(UI) +{' '}
            <code>ackoctl</code>(CLI). 선언적 클러스터 라이프사이클, 롤링
            업그레이드, warm-restart 워크플로우, ACL 관리, OpenTelemetry로
            계측된 데이터 경로 — 모두 CRD 기반.
          </>
        ),
      },
      {
        tag: '03 · 라이선스 모델',
        title: 'Enterprise Edition 도입은 개인 차원에서 결정할 수 있는 사안이 아니다',
        problem: (
          <ul>
            <li>Enterprise Edition은 조직 단위 라이선스 — 상업 계약이 필요하다.</li>
            <li>구매·법무·재무·아키텍처 검토를 설계상 수반한다.</li>
            <li>결정 권한이 개별 엔지니어나 팀의 범위를 벗어나, 해당 팀에는 CE가 실질적인 프로덕션 기준이 된다.</li>
          </ul>
        ),
        solution: (
          <>
            →&nbsp;모든 컴포넌트가 단일하고 일관된 API를 통해{' '}
            <strong>CE와 Enterprise Edition을 동시에 지원</strong>한다.
            오늘은 CE로 구축·운영하고, 조직 차원의 결정이 이루어지는
            시점에 EE로 이전한다 — 애플리케이션 코드나 운영 도구의 변경
            없이.
          </>
        ),
      },
    ],
    commitmentsTitle: 'What we ship',
    commitments: [
      {
        title: 'Support CE & EE',
        body: (
          <>
            모든 컴포넌트가 단일하고 일관된 API를 통해 Aerospike CE와
            Enterprise Edition 양쪽에서 동작한다. 도입이 구매 절차의 일정에
            묶이지 않는다 — 오늘은 CE, 추후 EE, 통합 코드 변경 없이.
          </>
        ),
      },
      {
        title: 'Cloud-native by default',
        body: (
          <>
            ACKO를 통한 선언적 쿠버네티스 관리, 유지보수되는 클러스터
            운영 웹 인터페이스, OpenTelemetry로 계측된 데이터 경로 —
            Enterprise Edition 라이선스 없이.
          </>
        ),
      },
      {
        title: 'Agent-driven operations',
        body: (
          <>
            동일한 운영 primitive를 <code>ackoctl</code>과 Claude Code
            플러그인 팩을 통해 노출한다. 자율 에이전트는 운영자와 동일한
            표면에서 Aerospike 클러스터를 프로비저닝 · 스케일링 · 디버깅 ·
            운영할 수 있다.
          </>
        ),
      },
    ],
  },
};

function LangTabs({lang, onChange}: {lang: Lang; onChange: (l: Lang) => void}): React.JSX.Element {
  return (
    <div className={styles.langTabs} role="tablist" aria-label="Content language">
      <button
        type="button"
        role="tab"
        aria-selected={lang === 'en'}
        className={clsx(styles.langTab, lang === 'en' && styles.langTabActive)}
        onClick={() => onChange('en')}
      >
        EN
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={lang === 'ko'}
        className={clsx(styles.langTab, lang === 'ko' && styles.langTabActive)}
        onClick={() => onChange('ko')}
      >
        한국어
      </button>
    </div>
  );
}

export default function WhySection(): React.JSX.Element {
  const [lang, setLang] = useState<Lang>('en');
  const c = CONTENT[lang];

  return (
    <section
      className={clsx('container', styles.section)}
      lang={lang === 'ko' ? 'ko' : 'en'}
    >
      <div className={styles.introRow}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>{c.eyebrow}</span>
          <h2 className={styles.title}>{c.title}</h2>
          <p className={styles.lead}>{c.lead}</p>
        </div>
        <LangTabs lang={lang} onChange={setLang} />
      </div>

      <div className={styles.problemRow}>
        {c.problems.map((p) => (
          <article key={p.tag} className={styles.problemCard}>
            <div className={styles.problemTag}>{p.tag}</div>
            <h3 className={styles.problemTitle}>{p.title}</h3>
            <div className={styles.problemBody}>{p.problem}</div>
            <p className={styles.problemSolution}>{p.solution}</p>
          </article>
        ))}
      </div>

      <div className={styles.commitmentsBlock}>
        <h3 className={styles.commitmentsTitle}>{c.commitmentsTitle}</h3>
        <ul className={styles.commitmentsList}>
          {c.commitments.map((cm) => (
            <li key={cm.title}>
              <strong>{cm.title}.</strong> {cm.body}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
