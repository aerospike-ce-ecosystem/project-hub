---
title: "ADR-0017: Cluster Manager Backend↔Frontend 타입 동기화 자동화 (Codegen)"
description: Cluster Manager에서 FastAPI OpenAPI 스키마를 기반으로 TypeScript 타입을 자동 생성하여 Backend↔Frontend 타입 동기화를 자동화하는 아키텍처 결정.
sidebar_position: 17
scope: single-repo
repos: [cluster-manager]
tags: [adr, codegen, openapi, typescript, cluster-manager, type-safety]
last_updated: 2026-03-30
---

# ADR-0017: Cluster Manager Backend↔Frontend 타입 동기화 자동화 (Codegen)

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#6
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Cluster Manager는 FastAPI(Pydantic v2) 백엔드와 Next.js(TypeScript) 프론트엔드로 구성됩니다. 현재 API 타입은 개발자가 수동으로 동기화하고 있으며, 이는 프로젝트 목표 2-7에 "수동 동기화 필수"로 명시되어 있습니다.

### 현재 문제점

1. **타입 불일치 리스크**: 백엔드 Pydantic 모델 변경 시 프론트엔드 TypeScript 타입 업데이트 누락 가능. 실제로 `backend/main.py`에 타입 레벨에서 미반영된 TODO가 존재
2. **개발 속도 저하**: 모든 API 변경마다 `backend/src/.../schemas/`와 `frontend/src/lib/api/types.ts` 두 곳을 수정해야 함
3. **런타임 에러**: 컴파일 타임에 잡히지 않는 필드 이름/타입 불일치가 런타임까지 전파
4. **CI 미검증**: 타입 동기화 여부를 검증하는 자동화가 없어 불일치가 merge될 수 있음

### 배경 요인

- ADR-0016에서 SSE 기반 실시간 이벤트 스트리밍을 도입하면서 백엔드-프론트엔드 간 계약(contract)이 더 복잡해지고 있음
- ADR-0014에서 PostgreSQL로 마이그레이션하면서 스키마 변경이 프론트엔드에 영향을 주는 패턴이 빈번해짐
- FastAPI가 이미 `/openapi.json` 엔드포인트를 자동 생성하고 있어 활용 가능한 인프라가 존재

## 결정 (Decision)

> **OpenAPI → TypeScript Codegen 파이프라인을 도입하여 Backend↔Frontend 타입 동기화를 자동화한다.**

FastAPI가 자동 생성하는 OpenAPI 3.1 JSON 스키마를 `openapi-typescript`로 변환하여 TypeScript 타입을 자동 생성합니다.

```
FastAPI (Pydantic v2) → OpenAPI 3.1 JSON → openapi-typescript → types.generated.ts
```

### 구현 방안

1. **OpenAPI 스키마 추출**: FastAPI 앱에서 `/openapi.json`을 파일로 export하는 스크립트 작성
2. **타입 자동 생성**: `openapi-typescript`를 사용하여 OpenAPI 스키마에서 TypeScript 타입 파일 생성
3. **기존 타입 전환**: `frontend/src/lib/api/types.ts` → `types.generated.ts`로 전환
4. **CI 검증**: codegen 실행 후 `git diff`로 생성된 파일이 최신인지 검증하는 CI step 추가
5. **개발 편의 명령어**: `make generate-types` 또는 `npm run codegen` 커맨드 제공

## 대안 (Alternatives Considered)

### Option B: Pydantic → TypeScript 직접 변환

`pydantic2ts` 또는 `datamodel-code-generator`를 사용하여 Pydantic 모델에서 직접 TypeScript 인터페이스를 생성하는 방안.

- **장점**: OpenAPI 중간 단계 불필요, 직접적인 변환
- **단점**: Pydantic v2 호환 도구가 제한적이고 유지보수 리스크 존재. 커뮤니티 지원이 `openapi-typescript` 대비 부족
- **기각 사유**: 도구 성숙도와 Pydantic v2 호환성 문제

### Option C: 공유 JSON Schema (Single Source of Truth)

`schemas/` 디렉토리에 JSON Schema를 정의하고, 백엔드(Pydantic)와 프론트엔드(TypeScript) 모두를 생성하는 방안.

- **장점**: 언어 독립적인 스키마 정의, 다양한 언어로 확장 가능
- **단점**: 기존 Pydantic 모델을 전면 리팩토링해야 하며, Pydantic의 자연스러운 모델 정의 방식을 포기해야 함
- **기각 사유**: 리팩토링 비용이 이점 대비 과도하며, FastAPI의 Pydantic 통합 이점을 상실

### Option D: 현재 유지 + CI 검증만 추가

수동 타입 동기화를 유지하되, `tsc --noEmit`과 API integration test로 불일치를 감지하는 방안.

- **장점**: 최소 변경, 기존 워크플로우 유지
- **단점**: 근본적 해결이 아닌 감지 수준에 머무름. 불일치 발생 후 감지이므로 개발 속도 개선 없음
- **기각 사유**: 문제를 예방하지 않고 사후 감지만 하므로 DX 개선 효과 제한적

## 결과 (Consequences)

### 긍정적

- **타입 안전성 강화**: 백엔드 모델 변경이 자동으로 프론트엔드 타입에 반영되어 런타임 타입 불일치 제거
- **개발 속도 향상**: API 변경 시 백엔드만 수정하면 타입이 자동 생성되어 2곳 수정 → 1곳으로 감소
- **CI 기반 보장**: codegen diff check로 동기화되지 않은 코드가 merge되는 것을 방지
- **DX 향상**: 프로젝트 목표 2-7의 "타입 동기화" 요구사항을 자동화로 강화
- **SSE 도입 대비**: ADR-0016의 SSE 이벤트 타입도 자동 생성 대상에 포함 가능
- **업계 표준**: OpenAPI + codegen은 검증된 접근법으로 도구 생태계가 풍부

### 부정적

- **생성된 타입의 가독성**: `openapi-typescript`가 생성하는 타입은 수동 작성 대비 가독성이 낮을 수 있음
- **빌드 의존성 추가**: codegen 도구가 빌드 파이프라인에 추가되어 복잡도 증가
- **초기 전환 비용**: 기존 `types.ts`의 import 경로를 `types.generated.ts`로 변경해야 함
- **OpenAPI 스키마 품질 의존**: 생성된 타입의 품질이 Pydantic 모델의 OpenAPI 스키마 생성 품질에 의존

## 관련 ADR

- [ADR-0016: SSE 기반 실시간 이벤트 스트리밍 도입](./2026-03-29-sse-event-streaming.md) — SSE 도입으로 백엔드-프론트엔드 간 계약이 복잡해지면서 자동 타입 동기화의 필요성 증가
- [ADR-0014: SQLite에서 PostgreSQL로 마이그레이션](./2026-02-10-postgresql-migration.md) — 백엔드 스키마 변경이 프론트엔드에 영향을 주는 패턴의 선례
- [ADR-0008: IssueOps 기반 CI 워크플로우](./2026-03-10-issueops-ci-workflow.md) — CI 자동화의 선례, codegen diff check 추가가 자연스러운 확장
- [ADR-0005: DaisyUI 제거 및 Pure Tailwind CSS 4 전환](./2026-02-25-daisyui-removal.md) — Cluster Manager 프론트엔드 개선 결정의 선례
