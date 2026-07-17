---
title: "PR #184: improve: cleanup internal APIs, fix UTF-8 truncation, and update UI docs"
description: 내부 API 정리, UTF-8 안전 truncation 추가, Aerospike 클라이언트 연결 통합, 미사용 코드 제거
sidebar_label: "#184 내부 API 정리"
tags: [acko, go, refactoring, utf-8, performance]
repos: [acko]
last_updated: 2026-03-29
---

# PR #184: improve: cleanup internal APIs, fix UTF-8 truncation, and update UI docs

| 항목 | 내용 |
|------|------|
| PR | [#184](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/184) |
| 병합일 | 2026-03-21 |
| 영향 범위 | Go internal packages, Docs, Helm chart |

## 변경 사항

- `aero_info.go`의 패키지 내부 전용 함수 5개를 unexport 처리
- `truncateUTF8()` 함수 추가 -- 멀티바이트 문자를 깨뜨리지 않고 에러 메시지를 지정된 바이트 길이로 자름
- `enrichStatusWithAerospikeInfo`에서 3개의 별도 Aerospike 클라이언트 연결을 1개로 통합 (성능 개선)
- 미사용 코드 제거: `TransientError` 타입, `NewValidation()`, deprecated `DeleteOrphanedPVCs`, `ParseImageVersion`/`CompareVersions`
- `TestTruncateUTF8` 테스트 추가 (한국어 문자 경계 테스트 포함)
- UI 가이드 문서 업데이트: Cluster List, Edit Dialog, Config Drift 섹션 추가

## 기술적 세부사항

### UTF-8 안전 truncation

Kubernetes status 메시지의 길이 제한을 맞추려면 긴 에러 메시지를 잘라야 한다. 기존의 바이트 단위 처리는 한국어 같은 멀티바이트 문자 중간을 잘라 유효하지 않은 UTF-8 문자열을 만들 수 있었다. `truncateUTF8()`는 UTF-8 문자 경계에서만 메시지를 잘라 이 문제를 피한다.

### 클라이언트 연결 통합

`enrichStatusWithAerospikeInfo`가 node, namespace, set info를 조회할 때 각각 새로 만들던 Aerospike 클라이언트 연결을 하나로 통합했다. 세 조회가 같은 연결을 공유하므로 불필요한 연결 생성이 줄어든다.

### 코드 정리

`internal/errors`, `internal/storage`, `internal/utils` 패키지에서 미사용 코드를 제거하였다. 특히 `version.go`의 `ParseImageVersion`/`CompareVersions`와 관련 테스트 80줄, `pvc.go`의 `DeleteOrphanedPVCs` 28줄이 완전히 삭제되었다.

## 영향

- 한국어 등 멀티바이트 문자가 포함된 status 메시지도 유효한 UTF-8로 유지됨
- `enrichStatusWithAerospikeInfo`의 Aerospike 클라이언트 연결 수가 3개에서 1개로 줄어듦
- 내부 API 표면이 축소되어 유지보수성 향상
- 10개 Go 패키지 테스트 전체 통과
