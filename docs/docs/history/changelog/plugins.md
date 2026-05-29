---
title: Plugins Changelog
description: aerospike-ce-ecosystem-plugins (Claude Code 플러그인) 릴리스 변경 이력
sidebar_position: 4
scope: single-repo
repos:
  - plugins
tags:
  - changelog
  - plugins
  - claude-code
  - skills
  - agent
last_updated: 2026-05-29
---

# Plugins Changelog

aerospike-ce-ecosystem-plugins 릴리스별 변경 사항을 기록합니다.

---

## v1.0.0

> Initial release

### Skills

- **acko-deploy**: ACKO 기반 Aerospike 클러스터 배포 가이드
- **acko-operations**: ACKO 클러스터 운영/관리 가이드
- **acko-config-reference**: Aerospike CE 설정 파라미터 레퍼런스
- **acko-debugging**: ACKO 클러스터 트러블슈팅 6단계 진단 절차 (기존 `acko-cluster-debugger` Agent를 Skill로 강등)
- **acko-e2e-test**: ACKO end-to-end 테스트 플레이북 및 릴리스 검증 체크리스트
- **ackoctl**: cluster-manager CLI 사용 가이드 (connections, records, queries, K8s CR, admin, UDF)
- **aerospike-py-api**: aerospike-py API 사용 가이드
- **aerospike-py-fastapi**: aerospike-py + FastAPI 통합 패턴
- **bug-reporter**: 에코시스템 버그를 적절한 레포로 라우팅하고 이슈 컨텍스트 작성

### 벤치마크 결과

| 지표 | 개선 |
|------|------|
| Pass rate | **+12.5%** |
| Token usage | **-30.8%** |
| Time | **-46.3%** |
