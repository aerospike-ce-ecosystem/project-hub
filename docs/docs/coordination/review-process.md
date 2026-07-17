---
title: 크로스-레포 리뷰 프로세스
description: 단일 레포 및 크로스-레포 변경에 대한 리뷰 프로세스와 체크리스트
sidebar_position: 3
scope: ecosystem
repos:
  - aerospike-py
  - aerospike-ce-kubernetes-operator
  - aerospike-cluster-manager
  - aerospike-ce-ecosystem-plugins
  - project-hub
tags:
  - review
  - coordination
  - process
last_updated: 2026-03-29
---

# 크로스-레포 리뷰 프로세스

여러 repository에 영향을 주는 변경은 구현 순서와 호환성을 함께 확인해야 합니다. 이 문서는 단일 repository 변경과 cross-repo 변경을 구분하고, 각 경우에 필요한 리뷰 절차를 설명합니다.

## 단일 레포 변경

영향 범위가 하나의 repository에만 머무르면 해당 repository의 일반 PR 절차를 따릅니다.

1. 해당 repository에서 PR을 생성합니다.
2. Agentic Workflow 또는 수동 리뷰로 변경 사항을 검증합니다.
3. 필요한 수정과 최종 승인이 끝나면 PR을 merge합니다.

## 크로스-레포 변경

여러 repository에 걸친 변경은 project-hub에서 전체 작업을 조율합니다. 각 repository의 작업은 독립된 issue와 PR로 추적하되, project-hub의 Epic에서 진행 상황과 의존성을 한눈에 확인할 수 있어야 합니다.

### 프로세스

1. **project-hub에 Epic issue를 생성합니다.** `epic`과 `cross-repo` label을 추가합니다.
2. **각 repository에 하위 issue를 생성합니다.** 구현 범위를 구체적으로 적고 project-hub의 Epic에 연결합니다.
3. **각 repository에서 PR을 생성합니다.** 구현과 리뷰는 repository별로 독립적으로 진행합니다.
4. **cross-repo 영향을 검토합니다.** 아래 checklist에 따라 API, CRD, Skill, release compatibility를 확인합니다.
5. **의존성 순서대로 merge합니다.** 앞 단계의 변경이 안정적으로 반영된 뒤 다음 PR을 merge합니다.

### 머지 순서 가이드

특별한 이유가 없다면 아래 의존성 방향에 따라 merge합니다.

```
aerospike-py (하위 레이어)
    → aerospike-ce-kubernetes-operator (ACKO)
        → aerospike-cluster-manager (상위 레이어)
            → aerospike-ce-ecosystem-plugins (도구)
```

## 크로스-레포 리뷰 체크리스트

cross-repo 변경을 리뷰할 때는 다음 항목을 확인합니다.

### API 호환성

- [ ] aerospike-py API 변경이 cluster-manager backend에 영향을 주는지 확인합니다.
- [ ] 공개 API signature를 변경했다면 cluster-manager가 호출하는 method와 호환되는지 확인합니다.
- [ ] 새 API를 추가했다면 cluster-manager에서 활용하거나 문서화해야 하는지 검토합니다.

### CRD 호환성

- [ ] ACKO CRD 변경이 cluster-manager의 K8s 관리 기능에 영향을 주는지 확인합니다.
- [ ] CRD field를 추가·변경·삭제했다면 관련 UI와 backend logic을 함께 검토합니다.
- [ ] CRD version을 변경했다면 backward compatibility와 migration 경로를 확인합니다.

### Plugin Skills 업데이트

- [ ] API 또는 CRD 변경을 plugins의 관련 Skill에 반영해야 하는지 확인합니다.
- [ ] 새 API pattern을 추가했다면 해당 Skill의 예제와 reference를 갱신합니다.
- [ ] CRD 변경이 `acko-deploy` 또는 `acko-config-reference` Skill에 영향을 주는지 확인합니다.

### Release Matrix 업데이트

- [ ] version 변경을 `release-matrix.md`에 반영해야 하는지 확인합니다.
- [ ] 함께 검증한 repository version 조합을 compatibility matrix에 기록합니다.
- [ ] 각 repository가 허용하는 dependency version 범위를 검토합니다.

## 리뷰 책임

| 변경 유형 | 리뷰 책임 |
|-----------|-----------|
| aerospike-py API 변경 | cluster-manager 메인테이너 추가 리뷰 |
| ACKO CRD 변경 | cluster-manager 메인테이너 추가 리뷰 |
| Plugin skill 변경 | 관련 레포 메인테이너 정확성 확인 |
| Release matrix 변경 | 모든 레포 메인테이너 확인 |

:::tip 크로스-레포 변경 제안
아키텍처에 영향을 주는 cross-repo 변경이라면 먼저 project-hub에 ADR Proposal issue를 생성하세요. 결정과 영향 범위를 합의한 뒤 Epic으로 전환하면 구현 단계의 재작업을 줄일 수 있습니다.
:::
