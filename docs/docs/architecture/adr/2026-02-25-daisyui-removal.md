---
title: "ADR-0005: DaisyUI 제거 및 Pure Tailwind CSS 4 전환"
description: Cluster Manager에서 DaisyUI를 제거하고 Tailwind CSS 4 + Radix UI로 전환한 아키텍처 결정 기록.
scope: single-repo
repos: [cluster-manager]
tags: [adr, tailwind, daisyui, radix-ui, frontend, cluster-manager]
last_updated: 2026-03-29
---

# ADR-0005: DaisyUI 제거 및 Pure Tailwind CSS 4 전환

## 상태

**Accepted**

- 제안일: 2026-02-25
- 승인일: 2026-03-01

## 맥락 (Context)

Aerospike Cluster Manager의 프론트엔드는 초기에 Tailwind CSS 3 + DaisyUI를 기반으로 구축되었습니다. DaisyUI는 Tailwind 위에 구축된 컴포넌트 라이브러리로, 빠른 프로토타이핑에 유용했으나 프로젝트가 성장하면서 다음과 같은 문제가 발생했습니다:

### DaisyUI의 한계

- **커스터마이제이션 한계**: DaisyUI의 사전 정의된 테마 시스템이 Aerospike 브랜드 디자인 시스템과 충돌. 색상, 간격, 타이포그래피를 세밀하게 제어하기 어려움
- **스타일 충돌**: DaisyUI의 내부 CSS와 커스텀 Tailwind 유틸리티가 specificity 충돌을 일으켜 `!important` 남발 필요
- **접근성 부족**: DaisyUI 컴포넌트는 WAI-ARIA 패턴을 완전히 구현하지 않아 스크린 리더, 키보드 내비게이션 지원이 불완전
- **번들 크기**: 사용하지 않는 DaisyUI 컴포넌트 스타일이 번들에 포함되어 CSS 크기 증가 (약 45KB gzipped 추가)
- **Tailwind CSS 4 비호환**: Tailwind CSS 4의 새로운 엔진(Oxide)과 DaisyUI의 호환성이 불안정

### 전환 동기

Cluster Manager는 Aerospike 클러스터의 모니터링 및 관리 도구로, 복잡한 데이터 테이블, 실시간 차트, 다단계 폼 등 고급 UI 패턴이 필요했습니다. 이를 위해 디자인 시스템의 완전한 제어가 필수적이었습니다.

## 결정 (Decision)

> **DaisyUI를 완전히 제거하고, Tailwind CSS 4 + Radix UI Primitives 기반으로 자체 컴포넌트 시스템을 구축한다.**

### 구현 전략

1. **Tailwind CSS 4 마이그레이션**: Oxide 엔진 기반의 Tailwind CSS 4로 업그레이드하여 성능 및 CSS 변수 기반 테마 활용
2. **Radix UI Primitives 도입**: 14개 핵심 UI primitives를 Radix UI에서 가져와 접근성 기반 컴포넌트 구축
3. **자체 디자인 토큰**: CSS 변수 기반의 Aerospike 디자인 토큰 시스템 정의

### 도입된 Radix UI Primitives (14개)

```
Dialog, DropdownMenu, Popover, Tooltip, Tabs,
Select, Checkbox, RadioGroup, Switch, Slider,
Toast, AlertDialog, Collapsible, NavigationMenu
```

### 컴포넌트 구조

```
src/components/ui/
├── button.tsx          # Tailwind CSS 4 variants
├── dialog.tsx          # Radix Dialog + Tailwind 스타일링
├── dropdown-menu.tsx   # Radix DropdownMenu + 키보드 내비게이션
├── data-table.tsx      # 커스텀 테이블 (가상 스크롤)
├── toast.tsx           # Radix Toast + 애니메이션
└── ...                 # 총 24개 기본 컴포넌트
```

### 디자인 토큰 체계

```css
/* Tailwind CSS 4 - CSS 변수 기반 테마 */
@theme {
  --color-aero-primary: #4B7BF5;
  --color-aero-surface: #1A1D23;
  --color-aero-border: #2A2D35;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}
```

## 대안 검토 (Alternatives Considered)

### 대안 1: shadcn/ui 도입

- **설명**: Radix UI + Tailwind CSS 기반의 Copy-paste 컴포넌트 라이브러리인 shadcn/ui를 사용
- **장점**: 높은 품질의 사전 빌드 컴포넌트, 활발한 커뮤니티, Radix 기반 접근성
- **단점**: shadcn/ui의 디자인 언어를 따라야 함 (재커스터마이제이션 필요), 업데이트 시 Copy-paste 특성으로 인한 수동 병합 필요, 불필요한 의존성 포함
- **미선택 사유**: Aerospike 고유의 디자인 시스템과 shadcn/ui의 디자인 언어 간 충돌이 예상되었고, Radix Primitives를 직접 사용하면 동일한 접근성 이점을 더 적은 코드로 확보 가능

### 대안 2: Chakra UI

- **설명**: React 접근성 중심의 풀 컴포넌트 라이브러리
- **장점**: 내장 접근성, 일관된 API, 풍부한 컴포넌트
- **단점**: Tailwind CSS와의 이중 스타일링 시스템 운영 필요, 런타임 CSS-in-JS 오버헤드, 번들 크기 대폭 증가 (약 120KB gzipped)
- **미선택 사유**: Tailwind CSS 기반 프로젝트에 CSS-in-JS 라이브러리를 추가하면 스타일링 시스템이 이중화되어 유지보수 비용이 증가

### 대안 3: DaisyUI 유지 + 부분 커스터마이제이션

- **설명**: DaisyUI를 유지하면서 문제가 되는 컴포넌트만 오버라이드
- **장점**: 마이그레이션 비용 없음, 기존 코드 유지
- **단점**: 근본적인 커스터마이제이션 한계와 스타일 충돌 문제 해결 불가, Tailwind CSS 4 호환성 이슈 지속
- **미선택 사유**: 단기적으로는 비용이 적으나 장기적으로 기술 부채가 누적되어 결국 전면 교체가 불가피할 것으로 판단

## 결과 (Consequences)

### 긍정적 결과

- **완전한 디자인 제어**: 모든 컴포넌트의 스타일, 애니메이션, 인터랙션을 Aerospike 디자인 시스템에 맞게 세밀 조정 가능
- **접근성 기본 탑재**: Radix UI Primitives의 WAI-ARIA 완전 구현으로 키보드 내비게이션, 스크린 리더, 포커스 관리 자동 지원
- **번들 크기 감소**: DaisyUI 제거로 CSS 번들 약 45KB 감소, Tree-shaking으로 사용하는 Radix 컴포넌트만 포함
- **Tailwind CSS 4 호환**: Oxide 엔진의 성능 향상 (빌드 시간 약 4배 단축)과 CSS 변수 기반 네이티브 테마 활용
- **유지보수 단순화**: 단일 스타일링 시스템 (Tailwind CSS 4)으로 통일되어 specificity 충돌 근절

### 부정적 결과 / 트레이드오프

- **초기 개발 비용 증가**: 24개 기본 컴포넌트를 자체 구축하는 데 약 2주의 추가 개발 시간 소요
- **DaisyUI 대비 빠른 프로토타이핑 어려움**: 새로운 UI 요소가 필요할 때 컴포넌트를 직접 구축해야 함
- **팀 학습 비용**: Radix UI Primitives의 Compound Component 패턴과 비제어(uncontrolled) 컴포넌트 모델 학습 필요

### 리스크

- Radix UI의 major version 업데이트 시 breaking change 대응 필요 (Radix는 semver를 엄격히 준수하므로 낮은 확률)
- 자체 컴포넌트의 접근성 테스트 커버리지를 지속적으로 유지해야 함 (Radix가 기본 제공하지만 커스텀 레이어 테스트 필요)

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `cluster-manager` | 프론트엔드 전체 컴포넌트 시스템 교체, DaisyUI 의존성 제거, Tailwind CSS 4 + Radix UI 도입 |
| `plugins` | Cluster Manager 관련 Skill에서 UI 컴포넌트 가이드 업데이트 필요 |

## 참고 자료

- [PR #153 - DaisyUI 제거 및 Tailwind CSS 4 + Radix UI 전환](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager/pull/153)
- [Tailwind CSS v4.0 공식 문서](https://tailwindcss.com/docs)
- [Radix UI Primitives 공식 문서](https://www.radix-ui.com/primitives)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
