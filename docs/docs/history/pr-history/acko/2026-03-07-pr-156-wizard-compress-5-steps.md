---
title: "PR #156: Compress wizard to 5 steps and simplify template mode to 3 steps"
description: Wizard UI를 9단계에서 5단계로 압축하고 Template 모드를 3단계로 간소화
sidebar_label: "#156 Wizard 5단계 압축"
tags: [acko, ui, wizard, e2e-test]
repos: [acko]
last_updated: 2026-03-29
---

# PR #156: Compress wizard to 5 steps and simplify template mode to 3 steps

| 항목 | 내용 |
|------|------|
| PR | [#156](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator/pull/156) |
| 병합일 | 2026-03-07 |
| 영향 범위 | Frontend Wizard UI, E2E 테스트 |

## 변경 사항

- **Scratch 모드**: 기존 9단계를 5단계로 압축 (Basic+Resources 병합, Advanced에 4개 CollapsibleSection 통합)
- **Template 모드**: 3단계로 간소화 (Creation Mode, Name & Namespace, Review)
- K8s E2E 테스트 4개 추가 (templates CRUD, scratch creation, template creation, cluster operations)
- `waitForClusterPhase`가 operator의 실제 안정 phase인 `"Completed"`를 기대하도록 수정

## 기술적 세부사항

### Scratch 모드 (5 steps)

| Step | 내용 |
|------|------|
| 1 | Creation Mode |
| 2 | Basic & Resources |
| 3 | Namespace & Storage |
| 4 | Advanced (Monitoring, ACL, Rolling Update, Rack Config) |
| 5 | Review |

### Template 모드 (3 steps)

| Step | 내용 |
|------|------|
| 1 | Creation Mode (template 선택) |
| 2 | Name & Namespace |
| 3 | Review |

주요 신규 컴포넌트로 `WizardAdvancedStep.tsx`(4개 옵션을 CollapsibleSection으로 묶은 컴포넌트)와 `WizardTemplateNameStep.tsx`(이름+네임스페이스만 입력하는 간소화 컴포넌트)가 추가되었다. E2E 테스트는 Playwright 기반으로 Page Object Model 패턴을 적용하며, Kind 클러스터 setup/teardown 스크립트를 포함한다.

## 영향

- Scratch 모드의 입력 화면이 5단계로 줄었고, 고급 설정은 한 단계의 접이식 섹션으로 묶였음
- Template 모드에서는 템플릿을 선택한 뒤 이름과 네임스페이스만 입력하고 검토할 수 있음
- 41개 wizard step 단위 테스트와 4개 E2E 테스트가 수정된 흐름을 검증함
- vitest 단위 테스트 및 TypeScript type-check 통과 확인
