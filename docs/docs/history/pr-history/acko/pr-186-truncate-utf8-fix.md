---
title: "PR #186: fix: truncateUTF8 respects maxBytes budget including suffix"
description: truncateUTF8 함수가 suffix 포함 시 maxBytes를 초과하지 않도록 수정
sidebar_label: "#186 truncateUTF8 버그 수정"
tags: [acko, go, bugfix, utf-8]
repos: [acko]
last_updated: 2026-03-29
---

# PR #186: fix: truncateUTF8 respects maxBytes budget including suffix

| 항목 | 내용 |
|------|------|
| PR | [#186](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/186) |
| 병합일 | 2026-03-21 |
| 영향 범위 | Go internal controller |

## 변경 사항

- `truncateUTF8()` 함수에서 `"..."` suffix(3바이트)를 위한 공간을 미리 예약하여 전체 출력이 `maxBytes`를 초과하지 않도록 수정
- `TestTruncateUTF8` 테스트 케이스 업데이트

## 기술적 세부사항

PR #184에서 도입된 `truncateUTF8()` 함수에서 suffix(`"..."`)가 truncation **이후에** 추가되어 결과가 `maxBytes + 3` 바이트까지 길어질 수 있는 버그가 발견되었다. 이 PR에서는 truncation 전에 suffix 길이(3바이트)를 maxBytes 예산에서 미리 차감하여, 최종 결과(본문 + suffix)가 항상 `maxBytes` 이내에 들어오도록 수정하였다.

이 수정은 PR #184의 코드 리뷰에서 발견된 후속 fix이다.

## 영향

- Kubernetes status 메시지 길이 제한을 정확히 준수하게 되어, 길이 초과로 인한 API 서버 거부 가능성 제거
- `truncateUTF8()` 함수의 계약(contract)이 명확해짐: 반환값은 항상 `maxBytes` 이하
- 기존 테스트가 올바른 기대값으로 업데이트됨
