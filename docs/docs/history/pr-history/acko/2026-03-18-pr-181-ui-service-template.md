---
title: "PR #181: feat(helm): add missing UI Service template and pin image tag"
description: 누락된 UI Service 템플릿 추가 및 이미지 태그를 v0.3.6으로 고정
sidebar_label: "#181 UI Service 추가"
tags: [acko, helm, service, ui]
repos: [acko]
last_updated: 2026-03-29
---

# PR #181: feat(helm): add missing UI Service template and pin image tag

| 항목 | 내용 |
|------|------|
| PR | [#181](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/181) |
| 병합일 | 2026-03-18 |
| 영향 범위 | Helm chart (Service), values.yaml, Docs |

## 변경 사항

- 누락되었던 `templates/ui/service.yaml` 추가 -- frontend(3000)와 backend(8000) 포트를 노출하는 Kubernetes Service
- `ui.enabled` 조건 게이팅 적용 (비활성 시 Service 렌더링 안 됨)
- `values.yaml`에서 `ui.image.tag`를 `latest`에서 `v0.3.6`으로 고정
- Docs에 migration status UI 섹션 추가

## 기술적 세부사항

PR #151에서 UI를 별도 컨테이너로 분리하면서 Deployment는 생성되었으나, 이를 노출하는 Kubernetes Service 매니페스트가 누락되어 있었다. 이로 인해 `kubectl port-forward svc/<release>-ui` 명령이 실패하고, Ingress 라우팅 및 ServiceMonitor 디스커버리가 불가능했다.

Service selector는 UI Deployment의 Pod 라벨과 정확히 매칭되도록 구성하였으며, `ui.enabled=false` 시 Service가 렌더링되지 않도록 조건부 생성을 적용하였다.

이미지 태그를 `latest`에서 `v0.3.6`으로 고정하여 비제어 이미지 업데이트로 인한 예기치 않은 동작 변경을 방지한다.

## 영향

- `kubectl port-forward svc/<release>-ui` 정상 동작 (이전에는 Service 부재로 실패)
- Ingress를 통한 UI Service 라우팅 가능
- ServiceMonitor를 통한 UI 엔드포인트 디스커버리 가능
- 이미지 태그 고정으로 재현 가능한 배포 보장
- 기존 Helm 릴리스 업그레이드 시 새로운 Service 리소스가 자동 생성됨
