---
title: "PR #170: bytes key digest 호환성 수정"
description: bytes 타입 키의 digest 계산을 공식 클라이언트와 호환되도록 수정
scope: single-repo
repos: [aerospike-py]
tags: [fix, digest, bytes, compatibility]
last_updated: 2026-03-29
---

# PR #170: fix: bytes key digest compatibility with official client

| 항목 | 내용 |
|------|------|
| **PR** | [#170](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/170) |
| **날짜** | 2026-02-28 |
| **작성자** | ksr |
| **카테고리** | fix |

## 변경 요약

bytes 타입 키의 digest 계산 방식을 공식 Aerospike 클라이언트와 호환되도록 수정했다. 기존에는 bytes 키를 사용할 때 digest가 공식 클라이언트와 다르게 계산되어, 동일한 키로 저장된 레코드를 서로 다른 클라이언트에서 접근할 수 없는 문제가 있었다.

## 주요 변경 사항

- bytes 타입 키의 digest 계산 로직을 공식 클라이언트 스펙에 맞게 수정
- 공식 클라이언트와 동일한 RIPEMD-160 해시 입력 형식 적용
- bytes 키를 사용하는 멀티 클라이언트 환경에서의 상호 운용성 보장

## 영향 범위

bytes 타입 키를 사용하는 모든 워크로드에 영향을 미친다. 특히 공식 Aerospike 클라이언트(Java, C, Go 등)와 aerospike-py를 혼용하는 환경에서 동일한 레코드에 정상 접근할 수 있게 된다. 기존에 aerospike-py로만 bytes 키를 사용하던 환경에서는 이 변경 후 기존 레코드의 digest가 달라지므로 마이그레이션이 필요할 수 있다.
