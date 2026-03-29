---
title: "PR #201: fix: E2E test reliability -- Podman auto-detect, multi-node cluster, timeout"
description: E2E 테스트 안정성 개선 -- Podman 자동 감지, 멀티 노드 클러스터, 타임아웃 조정
sidebar_label: "#201 E2E 테스트 안정성"
tags: [acko, e2e-test, podman, kind]
repos: [acko]
last_updated: 2026-03-29
---

# PR #201: fix: E2E test reliability -- Podman auto-detect, multi-node cluster, timeout

| 항목 | 내용 |
|------|------|
| PR | [#201](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/201) |
| 병합일 | 2026-03-25 |
| 영향 범위 | E2E 테스트 인프라, Makefile |

## 변경 사항

- `isPodmanOnlyEnvironment` 함수 추가로 Podman 전용 환경 자동 감지 (명시적 `CONTAINER_TOOL=podman` 설정 불필요)
- `KIND_EXPERIMENTAL_PROVIDER` 환경변수도 Podman 감지에 활용
- `kind-config.yaml`을 사용한 멀티 노드 클러스터 생성 (기존 단일 control-plane에서 3 worker + control plane으로 변경)
- E2E 테스트 타임아웃을 기본 10분에서 30분으로 증가 (34개 스펙 실행에 충분한 시간 확보)
- `SAVE_FORMAT_FLAG` 변수 추가로 Podman/Docker 호환성 확보 (`run-local`, `reload-cluster-manager`)
- `CONTAINER_TOOL`과 `KIND_EXPERIMENTAL_PROVIDER`를 `go test` 서브프로세스에 전달
- E2E 테스트 실패 시에도 cleanup이 반드시 실행되도록 보장
- `os.CreateTemp` + remove 대신 `os.MkdirTemp` 사용으로 TOCTOU(Time-of-Check-Time-of-Use) 취약점 제거

## 기술적 세부사항

기존 E2E 테스트는 Docker가 설치된 환경을 가정하고 있어 Podman 전용 환경(예: macOS)에서는 `CONTAINER_TOOL=podman`을 명시해야만 동작했다. `isPodmanOnlyEnvironment` 함수는 Docker 사용 가능 여부를 확인한 뒤, Docker가 없고 Podman이 있는 경우 자동으로 Podman을 선택한다.

또한 단일 control-plane 노드만으로는 rack 분산 배치 등의 시나리오를 테스트할 수 없었으므로, 3개의 worker 노드를 추가한 멀티 노드 Kind 클러스터 구성을 도입하였다.

임시 파일 생성 시 `os.CreateTemp`로 파일을 만든 뒤 삭제하고 같은 경로에 디렉토리를 만드는 기존 패턴은 TOCTOU 경쟁 조건이 있었으며, `os.MkdirTemp`로 대체하여 원자적으로 처리한다.

## 영향

- Podman 전용 환경에서 추가 설정 없이 E2E 테스트 실행 가능
- 멀티 노드 클러스터에서 rack 배치 등 실제 운영에 가까운 시나리오 테스트 가능
- 34개 E2E 스펙이 타임아웃 없이 안정적으로 완료
- 테스트 실패 시에도 리소스가 정리되어 CI 환경의 안정성 향상
- 3라운드 코드 리뷰 완료 후 병합
