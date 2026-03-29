---
title: "ADR-0003: Docker 대신 Podman 선택"
description: 로컬 개발 환경의 컨테이너 런타임으로 Docker 대신 Podman을 선택한 아키텍처 결정 기록.
scope: ecosystem
repos: [cluster-manager, acko]
tags: [adr, podman, docker, container, rootless, oci]
last_updated: 2026-03-29
---

# ADR-0003: Docker 대신 Podman 선택

## 상태

**Accepted**

- 제안일: 2026-02-01
- 승인일: 2026-02-05

## 맥락 (Context)

Aerospike CE Ecosystem의 로컬 개발 환경에서 컨테이너 런타임이 필요합니다. Cluster Manager의 로컬 실행, Aerospike Server CE의 로컬 테스트, CI/CD 파이프라인 등에서 컨테이너를 사용합니다.

고려 사항:

- **보안**: 개발 환경에서의 컨테이너 보안 (rootless 실행 가능 여부)
- **라이선스**: 상업적 사용 시 라이선스 비용
- **호환성**: OCI 표준 준수, 기존 Dockerfile/Compose 호환성
- **아키텍처**: 데몬 프로세스 의존성 여부
- **Kubernetes 호환**: CRI-O 및 K8s 워크플로우와의 자연스러운 연계

## 결정 (Decision)

> **Aerospike CE Ecosystem은 컨테이너 런타임으로 Podman을 사용한다.**

모든 레포의 문서, 스크립트, CI/CD에서 Podman 용어와 명령어를 사용합니다. `podman compose`를 로컬 개발 환경 구성에 사용합니다.

## 대안 검토 (Alternatives Considered)

### 대안 1: Docker (Docker Desktop)

- **설명**: 가장 널리 사용되는 컨테이너 런타임
- **장점**: 가장 큰 커뮤니티, 풍부한 문서, Docker Desktop GUI
- **단점**:
  - Docker Desktop은 상업적 사용 시 유료 라이선스 필요 (Docker Business Subscription)
  - 데몬 프로세스(`dockerd`) 상시 실행 필요
  - Root 권한 기본 요구 (rootless 모드는 실험적)
- **미선택 사유**: 라이선스 이슈와 데몬 의존성이 오픈소스 CE 프로젝트에 부적합

### 대안 2: nerdctl + containerd

- **설명**: containerd를 직접 사용하는 Docker 호환 CLI
- **장점**: 경량, Docker CLI 호환, containerd 직접 사용
- **단점**: Compose 지원 미성숙, rootless 설정 복잡, 커뮤니티 규모 작음
- **미선택 사유**: Podman 대비 생태계와 안정성에서 열세

### 대안 3: Lima + Docker CLI

- **설명**: macOS에서 Linux VM을 실행하여 Docker CLI를 사용하는 방식
- **장점**: macOS에서 가벼운 Linux VM, Docker 호환
- **단점**: VM 관리 오버헤드, 추가 레이어 복잡성
- **미선택 사유**: Podman이 macOS를 네이티브로 지원하여 불필요한 추상화

## 결과 (Consequences)

### 긍정적 결과

- **Rootless 컨테이너**: Root 권한 없이 컨테이너 실행 가능, 보안 향상
- **데몬 불필요**: 백그라운드 데몬 프로세스 없이 직접 컨테이너 실행 (fork/exec 모델)
- **OCI 호환**: OCI 이미지 및 런타임 표준 완벽 준수
- **라이선스 무료**: Apache 2.0 라이선스, 상업적 사용에 제한 없음
- **Kubernetes 친화적**: CRI-O와 동일한 기반(containers/image, containers/storage), Pod 개념 네이티브 지원
- **Docker CLI 호환**: `alias docker=podman`으로 대부분의 기존 Docker 명령어 호환

### 부정적 결과 / 트레이드오프

- **인지도 차이**: Docker 대비 인지도가 낮아 신규 기여자의 학습 비용
- **일부 비호환**: Docker Compose의 일부 고급 기능이 `podman compose`에서 미지원 가능
- **CI/CD 환경**: GitHub Actions 등에서 Podman 설정이 Docker보다 추가 단계 필요

### 리스크

- 특정 CI 환경에서 Podman 미지원 시 Docker 폴백 필요 (낮은 확률)
- `podman compose` 플러그인의 기능 격차가 워크플로우에 영향 (낮은 확률)

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `cluster-manager` | 로컬 개발 환경의 `podman compose` 설정, 문서에서 Podman 용어 사용 |
| `acko` | 로컬 테스트용 Kind/Minikube 클러스터에서 Podman을 컨테이너 런타임으로 사용 |
| `project-hub` | 모든 문서에서 Podman 용어 사용 (Docker 대신) |

## 참고 자료

- [Podman 공식 사이트](https://podman.io/)
- [Podman vs Docker 비교](https://podman.io/whatis)
- [Podman Compose](https://github.com/containers/podman-compose)
- [Rootless Containers](https://rootlesscontaine.rs/)
