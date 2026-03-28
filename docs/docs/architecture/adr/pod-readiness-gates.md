---
title: "ADR-0012: Pod Readiness Gates 도입"
description: Aerospike 클러스터 메시 합류 및 마이그레이션 완료를 보장하기 위해 커스텀 Pod Readiness Gate(acko.io/aerospike-ready)를 도입한 아키텍처 결정 기록.
sidebar_label: "Pod Readiness Gates"
sidebar_position: 13
scope: single-repo
repos: [acko]
tags: [adr, acko, kubernetes, readiness, rolling-update, zero-downtime]
last_updated: 2026-03-29
---

# ADR-0012: Pod Readiness Gates 도입

## 상태

**Accepted**

- 제안일: 2026-02-20
- 승인일: 2026-02-28

## 맥락 (Context)

Kubernetes의 기본 readiness probe(TCP/HTTP)는 Aerospike 프로세스의 포트 응답 여부만 확인합니다. 그러나 Aerospike 노드가 실제로 서비스 가능한 상태가 되려면 추가 조건이 충족되어야 합니다:

- **클러스터 메시 합류**: 새 노드가 기존 클러스터 메시에 완전히 합류해야 함
- **데이터 마이그레이션 완료**: 파티션 마이그레이션이 진행 중인 노드는 불완전한 데이터를 반환할 수 있음
- **Rolling Update 안전성**: 기본 readiness만으로는 StatefulSet rolling update 시 다음 Pod 종료가 너무 빨리 시작됨

이로 인해 rolling update 중 일시적인 데이터 불일치와 클라이언트 오류가 발생했습니다.

## 결정 (Decision)

> **커스텀 Pod Readiness Gate `acko.io/aerospike-ready`를 구현하여, 클러스터 메시 합류 및 마이그레이션 완료 후에만 Pod를 Ready로 표시한다.**

### 구현 세부사항

- Operator가 Pod spec에 `readinessGates` 필드를 주입
- Condition type: `acko.io/aerospike-ready`
- Operator의 reconcile loop에서 주기적으로 `asinfo -v 'cluster-stable'` 확인
- 클러스터 안정 + 마이그레이션 잔여 파티션 0일 때 condition을 `True`로 설정
- Service endpoint에서 해당 condition이 `True`인 Pod만 포함

## 대안 검토 (Alternatives Considered)

### 대안 1: readiness probe에 커스텀 스크립트 사용

- **설명**: exec probe에서 `asinfo` 명령어를 실행하여 클러스터 상태 확인
- **장점**: 추가 controller 로직 불필요
- **단점**: probe timeout 내에 복잡한 검증 로직 수행 어려움, 실패 시 Pod 재시작 위험
- **미선택 사유**: probe는 단순 점검용이며, 클러스터 전체 상태를 개별 Pod에서 판단하기 부적합

### 대안 2: PodDisruptionBudget만 활용

- **설명**: PDB의 minAvailable로 동시 종료 Pod 수 제한
- **장점**: Kubernetes 네이티브 메커니즘, 구현 단순
- **단점**: 마이그레이션 완료 여부를 고려하지 않음
- **미선택 사유**: PDB는 가용 Pod 수만 보장하고 데이터 완전성은 보장하지 않음

## 결과 (Consequences)

### 긍정적 결과

- **Zero-downtime rolling update**: 마이그레이션 완료 전까지 다음 Pod 교체 차단
- **데이터 일관성**: 클라이언트가 항상 완전한 데이터를 가진 노드에만 접근
- **자동화된 안전장치**: 운영자 수동 개입 없이 안전한 업데이트 보장

### 부정적 결과 / 트레이드오프

- **업데이트 시간 증가**: 마이그레이션 대기로 인해 rolling update 소요 시간 증가
- **구현 복잡성**: Operator에 readiness gate 관리 로직 추가 필요
- **디버깅 난이도**: Pod가 Ready가 아닌 원인이 기본 probe와 readiness gate 중 어디인지 구분 필요

### 리스크

- 마이그레이션이 장시간 완료되지 않을 경우 rolling update가 무한 대기할 가능성
- Readiness gate condition 업데이트의 API server 부하 (대규모 클러스터에서)

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `acko` | Readiness gate 주입 로직, condition 업데이트 controller 구현 |
| `plugins` | ACKO 운영 Skill에 readiness gate 관련 트러블슈팅 가이드 추가 |

## 참고 자료

- [Kubernetes Pod Readiness Gates](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-readiness-gate)
- [Aerospike Cluster Stability](https://aerospike.com/docs/operations/manage/cluster_mng/)
