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

레포 간 변경이 발생할 때 일관성과 호환성을 보장하기 위한 리뷰 프로세스입니다.

## 단일 레포 변경

단일 레포에 국한된 변경은 해당 레포에서 표준 PR 리뷰를 진행합니다.

1. 해당 레포에서 PR 생성
2. Agentic Workflow 또는 수동 리뷰 진행
3. 리뷰 완료 후 머지

## 크로스-레포 변경

여러 레포에 걸친 변경은 project-hub에서 조율합니다.

### 프로세스

1. **project-hub에 Epic 이슈 생성** -- `epic` + `cross-repo` 라벨 추가
2. **서브-레포 이슈 생성** -- 각 레포에 구체적인 이슈를 생성하고 Epic에 링크
3. **서브-레포 PR 생성** -- 각 레포에서 독립적으로 PR 진행
4. **크로스-레포 리뷰** -- 아래 체크리스트에 따라 호환성 검증
5. **조율된 머지** -- 의존성 순서에 따라 PR을 순차적으로 머지

### 머지 순서 가이드

일반적인 머지 순서는 의존성 방향을 따릅니다:

```
aerospike-py (하위 레이어)
    → aerospike-ce-kubernetes-operator (ACKO)
        → aerospike-cluster-manager (상위 레이어)
            → aerospike-ce-ecosystem-plugins (도구)
```

## 크로스-레포 리뷰 체크리스트

크로스-레포 변경 시 반드시 확인해야 할 항목입니다:

### API 호환성

- [ ] **aerospike-py API 변경** -- cluster-manager 백엔드 업데이트 필요 여부 확인
- [ ] aerospike-py의 공개 API 시그니처 변경 시 cluster-manager에서 사용하는 메서드가 영향받는지 확인
- [ ] 새로운 API 추가 시 cluster-manager에서 활용 가능한지 검토

### CRD 호환성

- [ ] **ACKO CRD 변경** -- cluster-manager K8s 관리 기능 업데이트 필요 여부 확인
- [ ] CRD 필드 추가/변경/삭제 시 cluster-manager의 K8s 관련 UI/로직 검토
- [ ] CRD 버전 변경 시 하위 호환성 확인

### Plugin Skills 업데이트

- [ ] **API/CRD 변경** -- plugins의 skills 업데이트 필요 여부 확인
- [ ] 새로운 API 패턴이 추가되면 관련 skill 문서 반영
- [ ] CRD 변경이 acko-deploy 또는 acko-config-reference skill에 영향을 주는지 확인

### Release Matrix 업데이트

- [ ] **버전 변경** -- release-matrix.md 업데이트 필요 여부 확인
- [ ] 레포 간 버전 호환성 매트릭스 갱신
- [ ] 의존성 버전 범위 검토

## 리뷰 책임

| 변경 유형 | 리뷰 책임 |
|-----------|-----------|
| aerospike-py API 변경 | cluster-manager 메인테이너 추가 리뷰 |
| ACKO CRD 변경 | cluster-manager 메인테이너 추가 리뷰 |
| Plugin skill 변경 | 관련 레포 메인테이너 정확성 확인 |
| Release matrix 변경 | 모든 레포 메인테이너 확인 |

:::tip 크로스-레포 변경 제안
크로스-레포 변경이 필요한 경우, 먼저 project-hub에 ADR Proposal 이슈를 생성하여 아키텍처 영향을 논의한 후 Epic으로 전환하는 것을 권장합니다.
:::
