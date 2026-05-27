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
    title: 'Aerospike is fast. Adopting it well, less so.',
    lead: (
      <>
        Aerospike is a high-performance, low-latency NoSQL database, and an
        excellent fit for online feature stores and other low-latency
        serving paths. Three practical gaps make it hard to actually ship
        on Aerospike at production quality today — especially inside large
        organizations and on Kubernetes. The{' '}
        <strong>aerospike-ce-ecosystem</strong> closes those gaps with an
        open-source, cloud-native, agent-friendly toolchain.
      </>
    ),
    problems: [
      {
        tag: '01 · Performance',
        title: 'The Python client cannot carry an ML feature-store workload',
        problem: (
          <>
            Aerospike is a natural fit for online feature stores —
            sub-millisecond point reads, predictable tail latency, native
            list/map types for feature vectors. But Python is the working
            language of ML pipelines, and the official client wraps the C
            library through CFFI: the GIL is held across the I/O path, async
            support is bolted on, and the type stubs drift from the runtime.
            At feature-store throughput, that gap is large enough to
            disqualify Aerospike from otherwise good-fit use cases.
          </>
        ),
        solution: (
          <>
            →&nbsp;<code>aerospike-py</code> — a from-scratch client in
            Rust&nbsp;(PyO3) with native async, GIL release across the I/O
            path, NumPy batch fast-paths, and complete type stubs.
            About <strong>2.4× the throughput</strong> of the official C
            client on standard mixed workloads, with first-class support for
            ML inference servers.
          </>
        ),
      },
      {
        tag: '02 · Cloud-native',
        title: 'No CE-grade Kubernetes story',
        problem: (
          <>
            Aerospike CE ships no community Kubernetes operator — the
            upstream AKO is Enterprise-only. There is no maintained web
            management UI, and most operational tooling assumes bare-metal
            deployments. Day-2 operations on Kubernetes (scaling, rolling
            upgrades, warm restarts, dynamic config) are left to teams to
            reinvent.
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
            large organisation, procurement, legal, finance, and architecture
            sign-offs become their own blocker — a classic <em>bell-the-cat</em>{' '}
            problem where everyone agrees EE would help, but no one owns
            pushing the contract through, and the cost-justification burden
            lands on whoever raises their hand.
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
    ],
    commitmentsTitle: 'What we ship',
    commitments: [
      {
        title: 'Open-source first, EE-compatible',
        body: (
          <>
            Every component runs against both Aerospike CE and EE, so
            adoption is not gated on procurement. CE today, EE later, no
            integration rewrite.
          </>
        ),
      },
      {
        title: 'Cloud-native by default',
        body: (
          <>
            Declarative Kubernetes management via ACKO, a real web UI for
            cluster ops, and an OpenTelemetry-instrumented data path —
            without an EE license.
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
    ],
  },

  ko: {
    eyebrow: '이 ecosystem이 존재하는 이유',
    title: 'Aerospike는 빠르다. 다만 제대로 도입하기는 아직 쉽지 않다.',
    lead: (
      <>
        Aerospike는 고성능·저지연 NoSQL 데이터베이스로, 온라인 피처 스토어를
        비롯한 저지연 서빙 경로에 자연스럽게 들어맞는다. 그러나 실제로 운영
        수준에서 Aerospike에 올라타려고 하면 — 특히 대규모 조직에서, 그리고
        쿠버네티스 위에서 — 현실적인 세 가지 갭이 가로막는다.{' '}
        <strong>aerospike-ce-ecosystem</strong>은 이 세 갭을 오픈소스 ·
        클라우드 네이티브 · 에이전트 친화적인 도구 모음으로 메운다.
      </>
    ),
    problems: [
      {
        tag: '01 · 성능',
        title: 'Python 클라이언트가 ML 피처 스토어 워크로드를 감당하지 못한다',
        problem: (
          <>
            Aerospike는 온라인 피처 스토어에 자연스럽게 어울린다 — 서브
            밀리세컨드 포인트 리드, 예측 가능한 tail latency, 피처 벡터에 잘
            맞는 list/map 네이티브 타입. 하지만 ML 파이프라인의 실무 언어는
            Python이고, 공식 클라이언트는 C 라이브러리를 CFFI로 감싼 구조다.
            I/O 경로 내내 GIL을 붙잡고, async는 외부에서 덧붙인 형태이며,
            배포된 type stub은 런타임과 어긋난다. 피처 스토어 처리량에서는 이
            격차가 충분히 커서, fit이 좋은 use case에서도 Aerospike를
            후보에서 탈락시킨다.
          </>
        ),
        solution: (
          <>
            →&nbsp;<code>aerospike-py</code> — Rust(PyO3) 기반으로 처음부터
            다시 만든 클라이언트. 네이티브 async, I/O 경로 전체에서 GIL
            release, NumPy 배치 fast-path, 완전한 type stub. 표준 mixed
            워크로드에서 공식 C 클라이언트 대비{' '}
            <strong>약 2.4× 처리량</strong>. ML 추론 서버를 1급 지원한다.
          </>
        ),
      },
      {
        tag: '02 · 클라우드 네이티브',
        title: 'CE 등급의 쿠버네티스 스토리가 없다',
        problem: (
          <>
            Aerospike CE에는 커뮤니티 쿠버네티스 오퍼레이터가 없다 — 업스트림
            AKO는 Enterprise 전용이다. 유지보수되는 웹 관리 UI도 없고, 대부분의
            운영 도구가 bare-metal 배포를 전제로 한다. 쿠버네티스 위 day-2
            운영(스케일링, 롤링 업그레이드, warm restart, 동적 설정 변경)은
            팀마다 다시 발명해야 한다.
          </>
        ),
        solution: (
          <>
            →&nbsp;<strong>ACKO</strong>(CE 전용 오퍼레이터) +{' '}
            <strong>Cluster Manager</strong>(FastAPI + Next.js UI) +{' '}
            <code>ackoctl</code>(CLI). 선언적 클러스터 관리, 스케일링과 롤링
            업그레이드, warm-restart 워크플로우, ACL 관리, OpenTelemetry로
            계측된 데이터 경로 — 모두 CRD로 제어하고 UI와 CLI 양쪽에서
            노출한다.
          </>
        ),
      },
      {
        tag: '03 · EE 게이트',
        title: '대규모 조직에서는 Enterprise Edition 도입 자체가 가로막힌다',
        problem: (
          <>
            Aerospike EE 도입은 조직 수준의 계약이 필요하다. 큰 조직에서는
            구매·법무·재무·아키텍처 승인 체인 그 자체가 블로커가 된다 —
            모두가 EE가 도움이 된다는 데에는 동의하지만, 정작 계약을
            밀어붙이는 책임은 아무도 가져가지 않는, 전형적인{' '}
            <em>고양이 목에 방울 달기</em> 문제다. 비용 정당화의 부담은 손을
            든 사람에게 떨어진다.
          </>
        ),
        solution: (
          <>
            →&nbsp;모든 컴포넌트가 <strong>CE와 EE를 동시에 지원</strong>한다.
            동일한 오퍼레이터, 동일한 클라이언트, 동일한 observability 표면을
            그대로 둔 채로 오늘 CE로 ship할 수 있고, 계약이 들어오면 EE로
            그대로 전환한다. 계약 결정을 앞단에서 강제하지 않으면서 도입
            자체를 풀어준다.
          </>
        ),
      },
    ],
    commitmentsTitle: '우리가 ship하는 것',
    commitments: [
      {
        title: '오픈소스 우선, EE 호환',
        body: (
          <>
            모든 컴포넌트가 Aerospike CE와 EE 양쪽에서 동작한다. 도입이 구매
            절차에 묶이지 않는다. 오늘은 CE, 나중에 EE, 통합 코드 재작성 없음.
          </>
        ),
      },
      {
        title: '클라우드 네이티브 기본 채택',
        body: (
          <>
            ACKO를 통한 선언적 쿠버네티스 관리, 실제 쓸 만한 클러스터 운영 웹
            UI, OpenTelemetry로 계측된 데이터 경로 — EE 라이선스 없이.
          </>
        ),
      },
      {
        title: '에이전트 주도 운영',
        body: (
          <>
            동일한 운영 primitive를 <code>ackoctl</code>과 Claude Code 플러그인
            팩으로 노출한다. 에이전트는 사람 운영자가 쓰는 것과 같은 표면에서
            Aerospike 클러스터를 provisioning · 스케일링 · 디버깅 · 운영할 수
            있다.
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
