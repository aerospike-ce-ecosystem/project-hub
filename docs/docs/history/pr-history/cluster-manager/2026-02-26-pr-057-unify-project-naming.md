---
title: "PR #057: Unify Project Naming to aerospike-cluster-manager"
description: 레포지토리, 패키지, 설정 전반에서 프로젝트 명칭을 aerospike-cluster-manager로 통일
scope: single-repo
repos: [aerospike-cluster-manager]
tags: [refactor, naming, cleanup]
last_updated: 2026-03-29
---

# PR #057: Unify Project Naming to aerospike-cluster-manager

| 항목 | 내용 |
|------|------|
| **PR** | [#057](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/57) |
| **날짜** | 2026-02-26 |
| **작성자** | ksr |
| **카테고리** | refactor |

## 변경 요약

프로젝트 전반에 걸쳐 사용되던 다양한 명칭(aerospike-manager, aero-cluster-ui 등)을 `aerospike-cluster-manager`로 통일했다. package.json, Podman 이미지 태그, 환경 변수, 문서 제목 등 모든 곳에서 일관된 네이밍을 적용한다.

## 주요 변경 사항

- package.json의 name 필드를 aerospike-cluster-manager로 변경
- Podman 이미지 및 컨테이너 이름 통일
- 환경 변수 접두사 정리
- README 및 문서 내 프로젝트명 일괄 수정
- CI/CD 파이프라인 참조 경로 업데이트

## 영향 범위

프로젝트 전체에 걸친 네이밍 변경으로, 이후 모든 PR과 문서에서 통일된 명칭이 사용되는 기반을 마련했다. 기능적 변경은 없으나 운영 및 배포 스크립트에서 참조 경로가 변경되었다.
