---
title: "PR #147: Drop CE 7.x, Enforce CE 8+ Minimum"
description: "BREAKING: CE 7.x 지원을 중단하고 CE 8+ 최소 버전을 webhook으로 강제"
scope: single-repo
repos: [aerospike-ce-kubernetes-operator]
tags: [feature, breaking-change, version-policy, webhook, ce8]
last_updated: 2026-03-29
---

# PR #147: Drop CE 7.x, Enforce CE 8+ Minimum

| 항목 | 내용 |
|------|------|
| **PR** | [#147](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/147) |
| **날짜** | 2026-03-03 |
| **작성자** | ksr |
| **카테고리** | feature |

## 변경 요약

**BREAKING CHANGE**: Aerospike CE 7.x 지원을 공식 중단하고, CE 8+ 버전만 허용하도록 webhook 검증을 추가했다. CE 7.x 이미지를 참조하는 CR 생성/업데이트 요청은 admission webhook에서 거부된다. CE 8에서 도입된 설정 변경(memory-size → data-size 등)에 맞춰 오퍼레이터 로직을 단순화했다.

## 주요 변경 사항

- Admission webhook에 CE 이미지 버전 검증 로직 추가
- CE 7.x 이미지 태그 감지 시 명확한 에러 메시지와 함께 거부
- CE 7.x 전용 호환성 코드 및 분기 로직 제거
- CE 8+ 전용 설정 파라미터로 기본값 업데이트
- 마이그레이션 가이드 문서 포함

## 영향 범위

CE 7.x를 사용 중인 환경은 ACKO를 업그레이드하기 전에 Aerospike를 CE 8+로 먼저 업그레이드해야 한다. 오퍼레이터에서 CE 7.x 호환성 분기가 제거되고, 기본 설정은 CE 8+ 파라미터를 기준으로 적용된다.
