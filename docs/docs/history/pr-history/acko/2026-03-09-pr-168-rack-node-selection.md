---
title: "PR #168: feat(wizard): rack-specific k8s node selection (Template mode)"
description: Template 모드에서 각 rack을 특정 Kubernetes 노드에 고정할 수 있는 기능 추가
sidebar_label: "#168 Rack 노드 선택"
tags: [acko, ui, wizard, rack, node-affinity]
repos: [acko]
last_updated: 2026-03-29
---

# PR #168: feat(wizard): rack-specific k8s node selection (Template mode)

| 항목 | 내용 |
|------|------|
| PR | [#168](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/168) |
| 병합일 | 2026-03-09 |
| 영향 범위 | Frontend Wizard UI, Config Samples, E2E 테스트 |

## 변경 사항

- Template 모드에 **"Rack & Node"** 스텝 추가 (기존 3단계에서 4단계로 확장)
- **soft-rack** 템플릿: 모든 rack을 동일 노드에 배치하거나 분산 배치 가능 (preferred anti-affinity)
- **hard-rack** 템플릿: 각 rack을 서로 다른 노드에 고정 (required anti-affinity, 중복 노드 선택 시 Next 비활성화)
- `WizardRackConfigStep` 컴포넌트에 Node Assignment 필드 추가 (노드 목록이 있으면 드롭다운+zone 뱃지, 없으면 직접 입력)
- `WizardReviewStep`에서 rack의 `nodeName`을 강조 표시
- Config Samples의 `acko_v1alpha1_template_prod.yaml` 수정: `size: 6 -> 3`, `nodeAffinity` 제거하여 Kind 로컬 테스트 가능

## 기술적 세부사항

CRD/Operator/Backend는 이미 `nodeName`, `nodeSelector`를 완전히 지원하고 있었으므로 변경이 없다. 이번 PR은 Frontend Wizard UI와 Template YAML 2곳에만 집중하여 변경하였다.

주요 구현 사항:
- `canProceed()` step 2에서 hard-rack의 중복 노드 할당 방지 검증 로직 추가
- `handleCreate` 직렬화에서 `nodeName`, `podSpec`, `aerospikeConfig`, `storage` 필드 누락 버그 수정
- `template-prefill`에서 템플릿 선택 시 `rackConfig` 자동 prefill (CE limit `<= 8` 준수)
- E2E 테스트에 `fillNodeSelection()` 헬퍼 추가, 4단계 흐름 반영

## 영향

- UI에서 rack별 노드를 목록에서 선택하거나 직접 입력해 배치 전략을 설정할 수 있음
- hard-rack 모드에서 같은 노드를 중복 선택하면 다음 단계로 진행할 수 없음
- 513개 테스트 통과 및 빌드 성공 확인
- CRD와 Operator를 변경하지 않고 기존 `nodeName` 등의 필드를 UI에서 활용함
