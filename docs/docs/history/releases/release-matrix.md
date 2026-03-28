---
title: Release Compatibility Matrix
description: Aerospike CE Ecosystem 전체 릴리스 호환성 매트릭스
sidebar_position: 1
scope: ecosystem
repos:
  - aerospike-py
  - acko
  - cluster-manager
  - plugins
tags:
  - releases
  - compatibility
  - matrix
  - versioning
last_updated: 2026-03-29
---

# Release Compatibility Matrix

Aerospike CE Ecosystem 각 프로젝트 간 릴리스 호환성 매트릭스입니다. 동일 행에 있는 버전들은 함께 테스트되었으며 호환성이 검증되었습니다.

---

| aerospike-py | ACKO | cluster-manager | plugins | Aerospike CE | Notes |
|:---:|:---:|:---:|:---:|:---:|:---|
| 0.0.1.beta2 | 0.1.0 | 0.1.0 | 1.0.0 | 8.1 | Initial release |

---

## 버전 관리 규칙

- **aerospike-py**: SemVer + pre-release (`beta`, `rc`)
- **ACKO**: SemVer
- **cluster-manager**: SemVer
- **plugins**: SemVer
- **Aerospike CE**: Aerospike Community Edition 서버 버전

## 호환성 보장 범위

- 동일 행의 버전 조합은 통합 테스트 완료
- 다른 행 간 교차 사용은 보장하지 않음
- Aerospike CE 서버 버전은 최소 요구 버전을 의미
