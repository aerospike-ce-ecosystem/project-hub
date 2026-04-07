---
title: "ADR-0039: 에코시스템 의존성 체인 및 Merge 순서 원칙"
description: Cross-repo 변경 전파 시 의존성 체인 순서를 ADR로 공식화하고, 점진적 CI 검증을 도입하는 원칙을 정의합니다.
sidebar_position: 39
scope: ecosystem
repos: [aerospike-py, aerospike-ce-kubernetes-operator, aerospike-cluster-manager, aerospike-ce-ecosystem-plugins]
tags: [adr, dependency-chain, merge-order, cross-repo, ci, release]
last_updated: 2026-04-07
---

# ADR-0039: 에코시스템 의존성 체인 및 Merge 순서 원칙

## 상태

**Proposed**

- 제안일: 2026-04-07
- 관련 이슈: aerospike-ce-ecosystem/project-hub#56
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

에코시스템에는 다음과 같은 암묵적 의존성 체인이 존재합니다:

```
aerospike-py (base) → ACKO (operator) → cluster-manager (UI) → plugins (tools)
```

이 순서는 현재 여러 곳에 분산되어 기술되어 있습니다:
- `hub-issue-planner.yml`의 cross-repo planner 프롬프트에 하드코딩
- `hub-issue-dispatcher.yml`의 epic planner 프롬프트에 하드코딩
- `CLAUDE.md`의 "Dependency & Merge Order" 섹션

그러나 이 원칙이 **ADR로 공식 문서화되어 있지 않아** 다음 문제가 발생합니다:

1. **Breaking change 전파 프로세스 미정의**: aerospike-py breaking change 발생 시 cluster-manager/plugins까지의 cascade 업데이트 프로세스가 명확하지 않음
2. **버전 pinning 정책 미정의**: cluster-manager가 aerospike-py 특정 버전을 pin하는지, latest를 사용하는지 불명확
3. **릴리스 순서 미보장**: daily-release가 의존성 체인 순서를 존중하는지 확인 불가 (현재 동시 실행)
4. **의존성 구조 미문서화**: 의존성 체인이 strictly linear인지, branch가 있는지 공식적으로 정의되지 않음

project-design.md §4-3 "Cross-repo Review Process"와 §4-4 "Release Compatibility Matrix"에서 이미 cross-repo 조율의 필요성을 인정하고 있으나, 구체적인 순서 규칙과 실행 메커니즘이 부재합니다. ADR-0008 (IssueOps 기반 CI 워크플로우)이 cross-repo 자동화의 실행 인프라를 제공하지만, 그 실행의 **순서 규칙**은 정의하지 않았습니다.

### 의존성 유형 구분

의존성 체인 내에서 두 가지 유형의 의존성을 구분해야 합니다:

- **Runtime 의존**: cluster-manager → aerospike-py (Python 패키지로서 직접 import)
- **API-level 의존**: cluster-manager → ACKO (K8s CRD/API를 통한 간접 의존)

이 구분에 따라 변경 전파 방식과 검증 방법이 달라져야 합니다.

## 결정 (Decision)

> **의존성 체인과 merge 순서를 ADR로 공식화하고, 기존 skill-impact-notify 파이프라인을 확장하여 점진적 CI 검증을 도입한다.**

### 의존성 체인 정의

```
aerospike-py (base)
    ├── ACKO (operator) ─── API-level 의존
    │       └── cluster-manager (UI) ─── Runtime + API-level 의존
    │               └── plugins (tools) ─── 참조 의존
    └── cluster-manager (UI) ─── Runtime 의존
```

### Merge 순서 원칙

Cross-repo breaking change가 포함된 변경은 다음 순서로 merge합니다:

1. **aerospike-py** — 기반 라이브러리 변경 우선
2. **ACKO** — operator CRD/API 변경
3. **cluster-manager** — UI/Backend 적응
4. **plugins** — 도구 업데이트

### 버전 pinning 정책

- cluster-manager는 aerospike-py를 `>=X.Y.Z` (최소 버전) 방식으로 pin
- Breaking change 발생 시 downstream repo는 해당 변경이 merge된 후 업데이트

### CI 검증 (점진적 도입)

1. **Phase 1**: ADR 문서화 및 기여자 가이드 역할
2. **Phase 2**: skill-impact-notify 파이프라인에 의존성 순서 경고 추가
3. **Phase 3**: Breaking change 감지 시 downstream repo CI에서 호환성 테스트 자동 실행

## 대안 (Alternatives Considered)

### Option A: 암묵적 순서 유지 (현재 상태)

- **장점**: 유연성 최대, 추가 작업 불필요
- **단점**: 새 기여자가 순서를 놓칠 위험, 강제력 없음, breaking change 사고 가능
- **기각 사유**: project-design.md §4-3/§4-4에서 이미 공식 조율의 필요성을 인정했으므로, 암묵적 상태를 유지하는 것은 문서와 실행의 불일치를 지속시킴

### Option B: ADR 공식화 + 점진적 CI 검증 (추천안)

- **장점**: 기여자 가이드로 활용 가능, 기존 인프라(skill-impact-notify, IssueOps) 활용, 점진적 도입으로 리스크 최소화
- **단점**: CI 검증 추가 시 복잡성 증가, 과도한 강제 시 개발 속도 저하 가능

### Option C: Monorepo 전환

- **장점**: 의존성 체인 문제의 근본적 해결, 단일 CI/CD 파이프라인
- **단점**: 대규모 마이그레이션 필요, 각 프로젝트의 독립성 상실
- **기각 사유**: project-design.md §4-1 "독립 배포 가능한 프로젝트 구조" 원칙에 명백히 위배됨

## 결과 (Consequences)

### 긍정적
- Cross-repo 변경 전파 규칙이 명확해져 새 기여자의 onboarding이 용이해짐
- Breaking change 사고(downstream repo가 호환되지 않는 버전과 함께 릴리스되는 상황) 방지
- 릴리스 순서가 예측 가능해져 daily-release 파이프라인의 신뢰성 향상
- ADR-0008 IssueOps 인프라와 결합하여 자동화된 cross-repo 변경 관리 가능

### 부정적
- 과도한 순서 강제 시 독립적인 repo 변경에도 불필요한 대기 발생 가능
- CI 검증 파이프라인 추가로 인한 유지보수 부담 증가
- 순환 의존이 발생할 경우 교착 상태 위험 (현재 체인 구조에서는 발생하지 않으나, 향후 repo 추가 시 주의 필요)
- Breaking change 전파 허용 시간 정책은 팀의 합의가 필요하며, 이 ADR만으로는 결정할 수 없음

## 관련 ADR

- **ADR-0008: IssueOps 기반 CI 워크플로우** — Cross-repo 자동화의 실행 메커니즘을 제공하며, 이 ADR의 순서 규칙이 IssueOps 실행의 가이드라인이 됨
- **ADR-0001: CFFI 대신 Rust/PyO3 선택** — 의존성 체인 최상단인 aerospike-py의 기술 기반 정의
- **ADR-0002: Kubebuilder v4 + controller-runtime 선택** — ACKO의 기술 기반 정의, CRD 버전 관리 방식에 영향
- **ADR-0009: Unified BatchRecords API** — aerospike-py API 변경이 downstream에 미치는 영향의 구체적 사례
