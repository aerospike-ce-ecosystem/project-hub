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
    title: 'Production-grade fundamentals, an incomplete adoption surface',
    lead: (
      <>
        Aerospike is a high-performance, low-latency NoSQL database with strong
        fit for online feature stores and other low-latency serving paths.
        However, three structural gaps make production adoption difficult
        today — particularly in large organizations and on Kubernetes. The{' '}
        <strong>aerospike-ce-ecosystem</strong> addresses these gaps with an
        open-source, cloud-native, agent-friendly toolchain.
      </>
    ),
    problems: [
      {
        tag: '01 · Client performance',
        title: 'The upstream Python client cannot sustain ML feature-store workloads',
        problem: (
          <>
            Aerospike maps cleanly to the online feature store profile —
            sub-millisecond point reads, predictable tail latency, and native
            list/map types for feature vectors. However, Python is the primary
            language of ML pipelines, and the upstream client is a CFFI binding
            to the C library: the GIL is held across the I/O path, asynchronous
            I/O is not natively supported, and the published type stubs are not
            kept in sync with the runtime. At feature-store throughput, the
            resulting overhead is significant enough to exclude Aerospike from
            workloads where it would otherwise be a strong fit.
          </>
        ),
        solution: (
          <>
            →&nbsp;<code>aerospike-py</code> — a client implemented from the
            ground up in Rust&nbsp;(PyO3), exposing native asynchronous I/O,
            GIL release across the entire I/O path, NumPy-aware batch
            interfaces, and complete type stubs. Approximately{' '}
            <strong>2.4× the throughput</strong> of the upstream C client on
            standard mixed workloads, with first-class support for ML
            inference servers.
          </>
        ),
      },
      {
        tag: '02 · Cloud-native gap',
        title: 'Aerospike CE has no community Kubernetes story',
        problem: (
          <>
            Aerospike CE does not ship with a community-maintained Kubernetes
            operator — the upstream AKO is restricted to the Enterprise
            Edition. There is no maintained web management interface, and
            most operational tooling is designed for bare-metal deployments.
            Day-2 operations on Kubernetes — scaling, rolling upgrades,
            warm restarts, dynamic configuration changes — must be
            implemented independently by each team.
          </>
        ),
        solution: (
          <>
            →&nbsp;<strong>ACKO</strong> (a CE-focused Kubernetes operator),{' '}
            <strong>Cluster Manager</strong> (a FastAPI + Next.js management
            interface), and <code>ackoctl</code> (a CLI surface). Declarative
            cluster lifecycle management, rolling upgrades, warm-restart
            workflows, ACL management, and an OpenTelemetry-instrumented data
            path — all defined through CRDs and exposed via both UI and CLI.
          </>
        ),
      },
      {
        tag: '03 · License model',
        title: 'Enterprise Edition adoption is not an individual-level decision',
        problem: (
          <>
            Aerospike Enterprise Edition is licensed at the organization
            level. Adoption requires a commercial agreement that involves
            procurement, legal, finance, and architecture review — by design,
            the decision sits above the individual engineer or team. As a
            result, teams that would benefit from Enterprise Edition features
            cannot adopt them on their own initiative, and Community Edition
            becomes the practical production baseline for those teams.
          </>
        ),
        solution: (
          <>
            →&nbsp;Every component in this ecosystem supports both Aerospike
            CE and the Enterprise Edition through a single, stable surface.
            Teams can build and operate on CE today with the same operator,
            client, and observability stack, and migrate to EE if and when
            the organizational decision is made — without changes to
            application integration code or operational tooling.
          </>
        ),
      },
    ],
    commitmentsTitle: 'What we ship',
    commitments: [
      {
        title: 'Open-source first, Enterprise-Edition compatible',
        body: (
          <>
            Every component operates against both Aerospike CE and the
            Enterprise Edition. Adoption is not gated on the procurement
            timeline — CE today, EE later, with no integration changes
            required.
          </>
        ),
      },
      {
        title: 'Cloud-native by default',
        body: (
          <>
            Declarative Kubernetes management via ACKO, a maintained web
            management interface for cluster operations, and an
            OpenTelemetry-instrumented data path — without an Enterprise
            Edition license.
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
    title: '견고한 기반, 미완성된 도입 표면',
    lead: (
      <>
        Aerospike는 고성능·저지연 NoSQL 데이터베이스로, 온라인 피처
        스토어를 비롯한 저지연 서빙 경로에 적합한 특성을 가진다. 그러나
        실제 운영 환경에서의 도입을 가로막는 세 가지 구조적 갭이 존재한다
        — 특히 대규모 조직과 쿠버네티스 환경에서 두드러진다.{' '}
        <strong>aerospike-ce-ecosystem</strong>은 오픈소스 · 클라우드
        네이티브 · 에이전트 친화적 도구를 통해 이 갭을 해소한다.
      </>
    ),
    problems: [
      {
        tag: '01 · 클라이언트 성능',
        title: '업스트림 Python 클라이언트로는 ML 피처 스토어 워크로드를 감당하기 어렵다',
        problem: (
          <>
            Aerospike는 온라인 피처 스토어의 요구 사항에 잘 부합한다 —
            서브밀리세컨드 포인트 리드, 예측 가능한 tail latency, 피처
            벡터에 적합한 list/map 네이티브 타입. 그러나 ML 파이프라인의
            주 언어는 Python이며, 업스트림 클라이언트는 C 라이브러리에
            대한 CFFI 바인딩으로 구현되어 있다. I/O 경로 전반에서 GIL이
            유지되고, 비동기 I/O가 네이티브로 지원되지 않으며, 게시된
            type stub은 런타임과 일치하지 않는다. 피처 스토어 처리량
            수준에서는 이 오버헤드가 충분히 커서, fit이 좋은 워크로드에서
            조차 Aerospike가 채택 후보에서 제외되는 결과로 이어진다.
          </>
        ),
        solution: (
          <>
            →&nbsp;<code>aerospike-py</code> — Rust(PyO3) 기반으로 처음부터
            다시 구현한 클라이언트. 네이티브 비동기 I/O, I/O 경로 전체에서의
            GIL release, NumPy 인지 배치 인터페이스, 완전한 type stub을
            제공한다. 표준 mixed 워크로드 기준으로 업스트림 C 클라이언트
            대비 <strong>약 2.4배의 처리량</strong>을 보이며, ML 추론
            서버를 1급으로 지원한다.
          </>
        ),
      },
      {
        tag: '02 · 클라우드 네이티브 갭',
        title: 'Aerospike CE에는 커뮤니티 수준의 쿠버네티스 스토리가 없다',
        problem: (
          <>
            Aerospike CE는 커뮤니티가 유지보수하는 쿠버네티스 오퍼레이터를
            제공하지 않으며, 업스트림 AKO는 Enterprise Edition에만
            한정된다. 유지보수되는 웹 관리 인터페이스도 없고, 대부분의
            운영 도구는 bare-metal 배포를 전제로 설계되어 있다. 쿠버네티스
            위에서의 day-2 운영 — 스케일링, 롤링 업그레이드, warm restart,
            동적 설정 변경 등 — 은 팀마다 개별적으로 구현해야 한다.
          </>
        ),
        solution: (
          <>
            →&nbsp;<strong>ACKO</strong>(CE 전용 쿠버네티스 오퍼레이터),{' '}
            <strong>Cluster Manager</strong>(FastAPI + Next.js 기반 관리
            인터페이스), <code>ackoctl</code>(CLI 표면). 선언적 클러스터
            라이프사이클 관리, 롤링 업그레이드, warm-restart 워크플로우,
            ACL 관리, OpenTelemetry로 계측된 데이터 경로 — 모두 CRD로
            정의하고 UI와 CLI 양쪽에서 노출한다.
          </>
        ),
      },
      {
        tag: '03 · 라이선스 모델',
        title: 'Enterprise Edition 도입은 개인 차원에서 결정할 수 있는 사안이 아니다',
        problem: (
          <>
            Aerospike Enterprise Edition은 조직 단위로 라이선스가
            발급된다. 도입을 위해서는 구매·법무·재무·아키텍처 검토를
            수반하는 상업 계약이 필요하며, 결정 권한은 설계상 개별
            엔지니어나 팀의 범위를 벗어난다. 그 결과, EE 기능의 이점을
            누릴 수 있는 팀이라 하더라도 자체 판단으로 도입하기는 어렵고,
            해당 팀에는 Community Edition이 실질적인 프로덕션 기준이
            된다.
          </>
        ),
        solution: (
          <>
            →&nbsp;이 ecosystem의 모든 컴포넌트는 단일한 안정 표면을 통해
            Aerospike CE와 Enterprise Edition을 동시에 지원한다. 동일한
            오퍼레이터, 클라이언트, observability 스택을 그대로 사용하면서
            오늘은 CE로 구축·운영하고, 조직 차원의 결정이 이루어지는
            시점에 EE로 이전한다 — 애플리케이션 통합 코드나 운영 도구의
            변경 없이.
          </>
        ),
      },
    ],
    commitmentsTitle: 'What we ship',
    commitments: [
      {
        title: '오픈소스 우선, Enterprise Edition 호환',
        body: (
          <>
            모든 컴포넌트가 Aerospike CE와 Enterprise Edition 양쪽에서
            동작한다. 도입이 구매 절차의 일정에 묶이지 않는다 — 오늘은
            CE, 추후 EE, 통합 코드 변경 없이.
          </>
        ),
      },
      {
        title: '클라우드 네이티브 우선',
        body: (
          <>
            ACKO를 통한 선언적 쿠버네티스 관리, 유지보수되는 클러스터
            운영 웹 인터페이스, OpenTelemetry로 계측된 데이터 경로 —
            Enterprise Edition 라이선스 없이.
          </>
        ),
      },
      {
        title: '에이전트 주도 운영',
        body: (
          <>
            동일한 운영 primitive를 <code>ackoctl</code>과 Claude Code
            플러그인 팩을 통해 노출한다. 자율 에이전트는 사람 운영자와
            동일한 표면에서 Aerospike 클러스터를 provisioning · 스케일링 ·
            디버깅 · 운영할 수 있다.
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
            <p className={styles.problemBody}>{p.problem}</p>
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
