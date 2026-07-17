---
title: "ADR-0015: asinfo 기반 Health Check 도입"
description: ACKO에서 TCP probe 대신 asinfo 명령어 기반 liveness/readiness check를 도입하여 정확한 Aerospike 노드 상태를 감지하도록 한 아키텍처 결정 기록.
sidebar_position: 15
scope: single-repo
repos: [acko]
tags: [adr, acko, kubernetes, health-check, asinfo, liveness, readiness]
last_updated: 2026-03-29
---

# ADR-0015: asinfo 기반 Health Check 도입

## 상태

**Accepted**

- 제안일: 2026-03-05
- 승인일: 2026-03-12

## 맥락 (Context)

ACKO가 관리하는 Aerospike Pod는 TCP socket probe로 liveness와 readiness를 확인했습니다. 이 방식은 port 연결 여부만 확인하므로 다음 상태를 구분할 수 없었습니다.

- **Port open과 service health의 차이**: Aerospike process가 port를 열었더라도 storage 장애나 memory 부족으로 정상 동작하지 않을 수 있습니다.
- **Cluster 상태 미반영**: TCP probe는 개별 node의 port만 확인하므로 cluster membership에서 이탈했는지 알 수 없습니다.
- **부정확한 재시작 판단**: 실제로 요청을 처리할 수 없는 node도 `healthy`로 표시되어 traffic을 받을 수 있습니다.
- **장애 감지 지연**: Storage device 오류 같은 Aerospike 고유 장애를 감지할 수 없습니다.

이로 인해 장애 상황에서 클라이언트가 비정상 노드로 요청을 보내 타임아웃이 발생하는 문제가 있었습니다.

## 결정 (Decision)

> **TCP probe를 제거하고, asinfo 명령어 기반의 health check를 도입한다.**

### 구현 세부사항

- **Liveness probe**: `exec` probe로 `asinfo -v 'build'` 실행
  - 정상 응답 시 프로세스가 살아있고 명령어 처리 가능한 상태로 판단
  - 타임아웃 또는 에러 시 kubelet이 Pod 재시작
- **Readiness probe**: `exec` probe로 `asinfo -v 'cluster-size'` 실행
  - 반환된 cluster_size가 기대값과 일치하는지 확인하는 wrapper 스크립트 사용
  - 클러스터에서 이탈한 노드는 자동으로 Service endpoint에서 제외
- **컨테이너 이미지 요구사항**: Aerospike container image에 `asinfo` binary가 포함되어 있어야 합니다.
- **Probe 설정**: `initialDelaySeconds=10`, `periodSeconds=10`, `failureThreshold=3`을 사용합니다.

## 대안 검토 (Alternatives Considered)

### 대안 1: HTTP health endpoint 구현

- **설명**: Aerospike 사이드카에서 health 상태를 HTTP로 노출
- **장점**: Kubernetes httpGet probe와 자연스럽게 연동, 상세한 상태 정보 반환 가능
- **단점**: 추가 사이드카 컨테이너 필요, 리소스 오버헤드
- **미선택 사유**: 사이드카 추가는 Pod 복잡성과 리소스 소비를 불필요하게 증가시킴

### 대안 2: Operator에서 주기적으로 health 체크

- **설명**: Operator가 외부에서 각 노드의 상태를 주기적으로 확인
- **장점**: 컨테이너 이미지 변경 불필요
- **단점**: Operator 장애 시 health check 전체 중단, 확인 주기에 따른 지연
- **미선택 사유**: kubelet의 probe 메커니즘이 더 안정적이고 분산적

## 결과 (Consequences)

### 긍정적 결과

- **정확한 상태 감지**: Aerospike 프로세스의 실제 동작 상태를 직접 확인
- **빠른 장애 격리**: 비정상 노드가 즉시 Service endpoint에서 제거되어 클라이언트 영향 최소화
- **클러스터 인식**: cluster_size 기반 readiness로 네트워크 파티션 등 클러스터 레벨 이상 감지
- **운영 가시성**: probe 실패 이벤트가 Kubernetes 이벤트로 기록되어 모니터링 용이

### 부정적 결과 / 트레이드오프

- **이미지 의존성**: Aerospike 컨테이너 이미지에 asinfo 바이너리가 반드시 포함되어야 함
- **exec probe 오버헤드**: 매 probe마다 프로세스를 fork하므로 TCP probe보다 리소스 소비 증가
- **스크립트 유지보수**: readiness check wrapper 스크립트의 추가 관리 필요

### 리스크

- asinfo 명령어의 응답 지연이 probe timeout을 초과하면 불필요한 Pod 재시작 발생
- Aerospike 버전 업그레이드 시 asinfo 출력 형식 변경 가능성

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `acko` | Pod spec의 probe 설정 변경, health check 스크립트 ConfigMap 관리 |
| `plugins` | ACKO 배포 Skill에 health check 커스터마이징 가이드 추가 |

## 참고 자료

- [Kubernetes Probe Configuration](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Aerospike asinfo 도구](https://aerospike.com/docs/tools/asinfo/)
