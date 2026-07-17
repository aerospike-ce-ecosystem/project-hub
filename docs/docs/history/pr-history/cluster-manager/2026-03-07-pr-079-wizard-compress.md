---
title: "PR #079: Wizard Compression"
description: Compressed cluster creation wizard from 9 steps to 5 with template mode support
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [feat, wizard, ux, template]
last_updated: 2026-03-29
---

# PR #079: Wizard Compression

| 항목 | 내용 |
|------|------|
| **PR** | [#079](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/79) |
| **날짜** | 2026-03-07 |
| **작성자** | ksr |
| **카테고리** | feat |

## 변경 요약

클러스터 생성 위저드를 9단계에서 5단계로 압축하고 템플릿 모드를 추가했다. 불필요한 단계를 제거하고 관련 설정을 논리적으로 그룹화하여 클러스터 생성 시간을 단축했다.

## 주요 변경 사항

- 위저드 단계 압축: 9단계 -> 5단계
- 템플릿 모드: AerospikeClusterTemplate에서 기본값 로드
- 스텝별 유효성 검증 강화
- 진행 상태 인디케이터 개선

## 영향 범위

Cluster Manager에서 새 클러스터를 만드는 모든 사용자가 영향을 받는다. Wizard 단계가 줄어 초기 설정이 간단해졌고, ACKO의 `AerospikeClusterTemplate`을 선택해 미리 정의한 configuration으로 배포할 수 있다.
