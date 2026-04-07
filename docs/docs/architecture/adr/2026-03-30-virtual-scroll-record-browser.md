---
title: "ADR-0017: Cluster Manager 레코드 브라우저 가상 스크롤 도입"
description: Cluster Manager 레코드 브라우저에 TanStack Virtual 기반 가상 스크롤을 도입하여 대용량 레코드 렌더링 성능을 개선하는 아키텍처 결정.
sidebar_position: 20
scope: single-repo
repos: [cluster-manager]
tags: [adr, virtual-scroll, performance, frontend, cluster-manager, tanstack]
last_updated: 2026-03-30
---

# ADR-0017: Cluster Manager 레코드 브라우저 가상 스크롤 도입

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#7
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Cluster Manager의 레코드 브라우저는 scan/query 결과를 테이블로 표시하며, OOM 방지를 위해 `MAX_QUERY_RECORDS = 10,000` 하드 리밋이 적용되어 있다. 그러나 프론트엔드에서 전체 결과를 DOM에 한 번에 렌더링하고 있어 다음과 같은 성능 문제가 발생한다:

1. **DOM 노드 폭증**: 10,000 레코드 × 다수 bin 데이터(JSON, bytes, nested map 등)로 인해 DOM 노드가 100,000개 이상으로 증가하여 메인 스레드 블로킹 발생
2. **초기 렌더링 지연**: First Contentful Paint 2-5초 지연으로 사용자 체감 성능 저하
3. **스크롤 성능 저하**: 대량 행 스크롤 시 리페인트 비용으로 10-20fps까지 하락
4. **검색/필터 반응성 저하**: 10K 행 필터링 시 1-3초간 UI 프리징
5. **메모리 사용량 급증**: 브라우저 탭 메모리 ~500MB+ 사용으로 OOM 크래시 위험 재현

백엔드에서 하드 리밋을 적용했음에도 프론트엔드의 비효율적 렌더링이 성능 병목으로 남아 있어, 프로젝트 목표 2-8("Record 브라우저 대용량 데이터 성능")을 충족하기 위한 프론트엔드 최적화가 필요하다.

## 결정 (Decision)

> **TanStack Virtual(`@tanstack/react-virtual` v3)을 사용하여 레코드 브라우저 테이블에 가상 스크롤을 도입한다.**

가시 영역과 overscan 범위의 행만 DOM에 렌더링하는 가상화(virtualization) 방식을 적용하여, 대량 레코드 조회 시에도 일정한 DOM 노드 수를 유지한다.

### 선택 근거

1. **Headless 철학 일관성**: ADR-0005에서 DaisyUI를 제거하고 headless UI 컴포넌트 방향을 확립했으며, TanStack Virtual은 렌더링 로직 없이 위치 계산만 제공하는 headless 라이브러리로 이 철학에 정확히 부합
2. **최소 번들 오버헤드**: ~4KB gzipped로 번들 크기 영향 최소화
3. **기존 구조 유지**: 기존 Tailwind CSS 4 + 커스텀 테이블 컴포넌트 구조를 유지하면서 가상화 래퍼만 추가
4. **점진적 확장 가능**: 향후 ADR-0014의 cursor 기반 PostgreSQL 쿼리와 결합하여 하이브리드(페이지네이션 + 가상 스크롤) 방식으로 확장 가능

## 대안 (Alternatives Considered)

### Option A: TanStack Virtual + 기존 테이블 (채택)
- `@tanstack/react-virtual` v3 기반으로 가시 영역 ± overscan만 렌더링
- **장점**: 번들 크기 최소(~4KB), 기존 스타일 유지, headless 방식으로 ADR-0005와 일관
- **단점**: 가변 높이 행(nested JSON) 처리에 `measureElement` 활용 필요

### Option B: react-window + react-window-infinite-loader
- FixedSizeList 기반 가상 스크롤 + 서버 커서 기반 점진적 로딩
- **장점**: 검증된 라이브러리, 무한 스크롤 지원
- **단점**: 고정 높이 제약이 Aerospike 레코드의 가변 bin 데이터와 비호환, 현재 테이블 구조 리팩토링 필요

### Option C: 서버 사이드 페이지네이션만 적용
- offset/limit 기반 전통적 페이지네이션
- **장점**: 구현 단순, 메모리 사용 예측 가능
- **단점**: 전체 결과 한눈에 보기 불가, 정렬/필터 제약, 사용자 경험 저하

### Option D: 하이브리드 (페이지네이션 + 가상 스크롤)
- 서버: cursor 기반 50~100건씩 fetch, 프론트: TanStack Virtual + 스크롤 하단 도달 시 추가 로드
- **장점**: 최적의 메모리/UX 조합
- **단점**: 구현 복잡도 높음, 정렬 시 전체 재fetch 필요. Option A 적용 후 점진적으로 이 방식으로 확장하는 것이 위험 관리에 적절

## 결과 (Consequences)

### 긍정적
- DOM 노드 수 ~100,000+ → ~500 (가시 영역)으로 대폭 감소
- 초기 렌더링 2-5초 → 200ms 미만으로 개선
- 메모리 사용 ~500MB+ → ~50MB로 감소, OOM 크래시 위험 해소
- 스크롤 FPS 10-20fps → 60fps로 개선
- 검색/필터 반응 1-3초 → 100ms 미만으로 개선
- `MAX_QUERY_RECORDS` 하드 리밋을 향후 완화할 수 있는 기반 마련
- ADR-0014(PostgreSQL cursor 쿼리), ADR-0016(SSE 이벤트 스트리밍)과 결합 시 실시간 대용량 데이터 브라우징 UX 향상

### 부정적
- 가변 높이 행(nested JSON, bytes 데이터) 처리를 위한 `measureElement` 로직 구현 복잡도 증가
- 기존 정렬/필터 기능의 가상화 환경 호환성 검증 필요
- 프론트엔드 의존성 1개 추가 (`@tanstack/react-virtual`)
- 접근성(a11y) 테스트에서 가상화된 테이블의 스크린 리더 호환성 추가 검증 필요

## 관련 ADR

- [ADR-0005: DaisyUI 제거 및 Pure Tailwind CSS 4 전환](/docs/architecture/adr/2026-02-25-daisyui-removal) — headless UI 컴포넌트 방향 확립, TanStack Virtual 선택의 근거
- [ADR-0014: SQLite에서 PostgreSQL로 마이그레이션](/docs/architecture/adr/2026-02-10-postgresql-migration) — cursor 기반 쿼리 인프라로 향후 하이브리드 방식 확장 지원
- [ADR-0016: SSE 기반 실시간 이벤트 스트리밍](/docs/architecture/adr/2026-03-29-sse-event-streaming) — 가상 스크롤과 결합 시 실시간 데이터 업데이트 UX 시너지
