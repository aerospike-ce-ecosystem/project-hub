---
title: "PR #151: feat(helm): split UI into separate frontend/backend containers"
description: Helm 차트에서 UI를 단일 통합 이미지 대신 frontend/backend 별도 사이드카 컨테이너로 분리
sidebar_label: "#151 UI 컨테이너 분리"
tags: [acko, helm, ui, architecture]
repos: [acko]
last_updated: 2026-03-29
---

# PR #151: feat(helm): split UI into separate frontend/backend containers

| 항목 | 내용 |
|------|------|
| PR | [#151](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/151) |
| 병합일 | 2026-03-03 |
| 영향 범위 | Helm chart, Deployment, Makefile |

## 변경 사항

- Helm 차트에서 `aerospike-cluster-manager` frontend와 backend를 동일 Pod 내 별도 사이드카 컨테이너로 분리
- `values.yaml`에 `ui.backendImage` 섹션 및 `backendResources` 추가
- Health probe 분리: frontend `GET /` (port 3000), backend `GET /api/health` (port 8000)
- ConfigMap에 `BACKEND_URL=http://localhost:<backendPort>` 추가하여 Next.js proxy가 사이드카 backend에 접근 가능
- `_helpers.tpl`에 `ui.backendImage` helper 추가, `toString` 필터 적용으로 숫자 태그 전달 시 int64 파싱 오류 방지
- Makefile에 `date +%s` 타임스탬프 태그 및 `kubectl set image` 방식 도입

## 기술적 세부사항

기존에는 frontend(Next.js)와 backend(API 서버)가 하나의 통합 이미지로 배포되었으나, 이를 같은 Pod 내 두 개의 컨테이너로 분리하였다. 이를 통해 각 컨테이너의 리소스를 독립적으로 관리하고, 개별 health check를 수행할 수 있다.

Kind 환경에서 `imagePullPolicy: IfNotPresent`와 고정 `:local` 태그 조합으로 발생하던 이미지 캐시 미갱신 문제를 타임스탬프 태그 방식으로 해결하였다. `--set ui.image.tag=1234567890` 같은 숫자 태그 전달 시 Helm이 int64로 파싱하는 문제는 `toString` 필터로 방어한다.

## 영향

- Pod 구조가 2 컨테이너(frontend + postgres)에서 3 컨테이너(frontend + backend + postgres)로 변경
- frontend와 backend를 독립적으로 스케일링 및 모니터링 가능
- 로컬 개발 환경(Kind)에서 이미지 갱신이 안정적으로 동작
- 기존 `values.yaml`에서 `ui.backendImage` 설정이 추가되므로 Helm 업그레이드 시 주의 필요
