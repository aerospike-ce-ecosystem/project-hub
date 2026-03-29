---
title: "ADR-0011: CRD 이름 AerospikeCluster로 변경"
description: AerospikeCECluster CRD를 AerospikeCluster로 리네이밍한 아키텍처 결정 기록. 중복된 CE 접두사 제거로 API 표면 단순화.
scope: single-repo
repos: [acko]
tags: [adr, acko, crd, kubernetes, api, breaking-change]
last_updated: 2026-03-29
---

# ADR-0011: CRD 이름 AerospikeCluster로 변경

## 상태

**Accepted**

- 제안일: 2026-03-10
- 승인일: 2026-03-15

## 맥락 (Context)

ACKO(Aerospike CE Kubernetes Operator)의 초기 CRD는 `AerospikeCECluster`라는 이름을 사용했습니다. 이 이름에는 다음과 같은 문제가 있었습니다:

- **중복 접두사**: Operator 자체가 CE(Community Edition) 전용이므로 CRD 이름에 "CE"를 포함하는 것은 불필요한 중복
- **긴 리소스명**: `kubectl get aerospikececlusters`와 같이 명령어가 지나치게 길어져 운영 편의성 저하
- **짧은 이름 부재**: 별도의 short name이 정의되지 않아 매번 전체 이름을 입력해야 함
- **커뮤니티 혼동**: CE와 Enterprise 구분이 CRD 이름이 아닌 Operator 레벨에서 이루어져야 한다는 사용자 피드백

## 결정 (Decision)

> **CRD 이름을 `AerospikeCluster`로 변경하고, short name으로 `asc`와 `ascluster`를 등록한다.**

### 구현 세부사항

- CRD Kind: `AerospikeCluster` (Group: `acko.io`, Version: `v1`)
- Short names: `asc`, `ascluster`
- 기존 `AerospikeCECluster` 리소스에 대한 마이그레이션 스크립트 제공
- Webhook에서 구 CRD 요청 시 deprecation warning 반환

## 대안 검토 (Alternatives Considered)

### 대안 1: 기존 이름 유지 (AerospikeCECluster)

- **설명**: 변경 없이 short name만 추가
- **장점**: 기존 사용자에게 breaking change 없음
- **단점**: 근본적인 네이밍 불일치 미해결
- **미선택 사유**: 장기적으로 API 표면의 일관성이 더 중요하다고 판단

### 대안 2: AerospikeCommunityCluster

- **설명**: "CE"를 풀어서 "Community"로 명시
- **장점**: CE 에디션임을 명확히 표시
- **단점**: 이름이 더 길어지며, Operator 스코프로 이미 CE가 명확
- **미선택 사유**: 길이 문제를 악화시키고 근본 이슈 미해결

## 결과 (Consequences)

### 긍정적 결과

- **간결한 API**: `kubectl get asc`로 클러스터 조회 가능
- **명확한 네이밍**: Operator 스코프와 CRD 이름 간 중복 제거
- **커뮤니티 친화적**: Helm chart, 문서, 예제 코드 모두 간결해짐

### 부정적 결과 / 트레이드오프

- **Breaking change**: 기존 CR manifest를 모두 수정해야 함
- **마이그레이션 비용**: 운영 중인 클러스터에 대한 마이그레이션 절차 필요
- **문서 업데이트**: 모든 가이드와 예제의 CRD 이름 일괄 변경 필요

### 리스크

- 마이그레이션 스크립트 실행 중 일시적 서비스 중단 가능성 (낮은 확률)
- GitOps 파이프라인에서 구 CRD 이름 참조 시 배포 실패

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `acko` | CRD 정의, controller, webhook 전체 리네이밍 |
| `cluster-manager` | ACKO 연동 시 CRD 이름 참조 업데이트 |
| `plugins` | ACKO 관련 Skill의 CRD 예제 업데이트 |

## 참고 자료

- [Kubernetes CRD Naming Conventions](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
- ACKO GitHub Issue: CRD 리네이밍 요청
