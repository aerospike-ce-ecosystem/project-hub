---
title: "ADR-0020: Cluster Manager API 인증/인가 아키텍처 및 보안 헤더 강화"
description: Cluster Manager API에 JWT 기반 인증/인가(RBAC)를 도입하고 보안 헤더(HSTS, CORS 검증)를 강화하여 프로덕션 배포 가능성을 확보하는 아키텍처 결정.
sidebar_position: 20
scope: single-repo
repos: [cluster-manager]
tags: [adr, security, authentication, authorization, rbac, jwt, cors, hsts]
last_updated: 2026-03-30
---

# ADR-0020: Cluster Manager API 인증/인가 아키텍처 및 보안 헤더 강화

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#34
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Cluster Manager의 모든 API 엔드포인트에 인증/인가가 없어 네트워크 접근 가능한 모든 클라이언트가 클러스터 연결 생성/삭제, 레코드 수정, K8s 클러스터 관리 등 모든 작업을 무제한으로 수행할 수 있는 상태입니다. 이는 프로덕션 환경 배포의 가장 큰 차단 요인입니다.

구체적으로 세 가지 문제가 식별되었습니다:

1. **인증 없는 API 엔드포인트**: `connections.py`, `records.py`, `query.py`, `k8s_clusters.py` 등 모든 라우터에 인증 미들웨어가 없어 무단 접근, 감사 로그 부재, 멀티 사용자 접근 분리 불가 상태
2. **보안 헤더 불완전**: `X-Content-Type-Options`, `X-Frame-Options`은 설정했지만 HSTS 헤더 누락(HTTPS 다운그레이드 공격 취약), CORS wildcard + credentials 동시 설정 시 사양 위반 미검증
3. **Rate Limiting 프록시 호환성**: `rate_limit.py`의 `get_remote_address`가 리버스 프록시 뒤에서 프록시 IP로 식별하여 rate limiting 무효화

ADR-0014 (PostgreSQL 마이그레이션)에서 이미 프로덕션 환경을 고려한 인프라 변경을 진행했으며, 인증/인가는 그 연장선에서 반드시 필요한 보안 레이어입니다.

## 결정 (Decision)

> **3단계(Phase) 접근법으로 Cluster Manager API에 보안 헤더 강화, JWT 기반 인증/인가(RBAC), SSO/OAuth 통합을 순차 도입한다.**

### Phase 1: 보안 헤더 즉시 강화

- **HSTS 헤더 추가**: 프로덕션 환경(HTTPS)에서 `Strict-Transport-Security` 헤더 조건부 추가
- **CORS 설정 검증**: 애플리케이션 startup 시 `CORS_ORIGINS=*`와 `allow_credentials=True` 동시 설정 감지 및 경고/차단
- **Rate limiter 개선**: `X-Forwarded-For` 헤더를 지원하여 리버스 프록시 환경에서 실제 클라이언트 IP 기반 rate limiting 적용

### Phase 2: JWT 기반 인증 및 RBAC 도입

- **JWT 인증 미들웨어**: FastAPI `Depends()` 패턴으로 모든 라우터에 적용
- **RBAC 3단계 역할 모델**:
  - `admin`: 연결 생성/삭제, K8s 클러스터 관리
  - `operator`: 레코드 CRUD, 쿼리 실행
  - `viewer`: 읽기 전용 (클러스터 상태, 레코드 조회)
- **감사 로그**: 모든 변경 작업에 사용자 ID, 타임스탬프, 액션 기록

### Phase 3: SSO/OAuth 통합 (장기)

- OAuth 2.0 / OIDC 지원 (Google, GitHub, LDAP)
- K8s RBAC과 연동 (ServiceAccount 기반 접근)
- Phase 2 안정화 및 실제 사용자 피드백 기반으로 진행 여부 결정

## 대안 (Alternatives Considered)

### 1. API Key 방식
- **장점**: 구현이 간단하고 이해하기 쉬움
- **단점**: 키 관리/로테이션 자동화 없이는 운영 부담 증가. 역할 기반 접근 제어가 자연스럽지 않음
- **결론**: JWT 대비 확장성과 보안 수준 열등

### 2. Basic Auth
- **장점**: 가장 간단한 구현
- **단점**: 매 요청마다 credential 전송, 토큰 기반 인증 대비 보안 및 확장성 부족
- **결론**: 프로덕션 환경에 부적합

### 3. mTLS (Mutual TLS)
- **장점**: 네트워크 레벨에서 강력한 인증 보장
- **단점**: 사용자 수준 인가(RBAC)를 별도로 구현해야 하며, 인증서 관리 복잡도가 높음. CE 환경에서 TLS 사용 불가 제약과 혼동 가능
- **결론**: 보완적 보안 레이어로는 가치 있으나 단독으로는 요구사항 미충족

### 4. JWT 기반 인증 + RBAC (선택됨)
- **장점**: FastAPI 생태계에서 가장 성숙하고 표준적인 접근. Stateless 토큰으로 수평 확장 용이. 역할 기반 접근 제어가 자연스러움
- **단점**: JWT 비밀키 관리 및 토큰 갱신 로직 필요
- **결론**: 보안성, 확장성, 생태계 호환성 측면에서 최적

## 결과 (Consequences)

### 긍정적
- **프로덕션 배포 가능**: 인증/인가 부재로 인한 보안 차단 요인 해소
- **멀티 사용자/멀티 테넌트 지원**: RBAC으로 사용자별 접근 범위 분리
- **감사 추적**: 모든 변경 작업의 책임 소재 명확화
- **규정 준수 기반**: SOC2, ISO 27001 등 보안 인증을 위한 기술적 기반 마련
- **점진적 도입**: 3단계 접근으로 리스크 관리 가능

### 부정적
- **개발 복잡도 증가**: 인증 미들웨어, 역할 모델, 감사 로그 등 신규 모듈 필요 (Large scope)
- **운영 복잡도 증가**: JWT 비밀키 관리, 토큰 로테이션 전략 필요
- **Frontend 변경 필요**: 로그인 UI, 토큰 관리, 권한 기반 UI 분기 구현
- **SSE 인증 고려**: ADR-0016 (SSE 이벤트 스트리밍)의 SSE 엔드포인트에 대한 인증 처리 추가 필요
- **CE 환경 혼동 가능성**: Aerospike CE의 제한적 ACL과 Cluster Manager의 RBAC이 별개임을 문서로 명확히 구분 필요

## 관련 ADR

- [ADR-0014: SQLite → PostgreSQL Migration](/docs/architecture/adr/2026-02-10-postgresql-migration) — 프로덕션 인프라 기반 마련. 감사 로그 저장소로 PostgreSQL 활용 가능
- [ADR-0016: SSE 기반 실시간 이벤트 스트리밍](/docs/architecture/adr/2026-03-29-sse-event-streaming) — SSE 엔드포인트에도 인증 적용 필요
- [ADR-0017: Codegen 타입 동기화](/docs/architecture/adr/2026-03-30-codegen-type-sync) — 인증 관련 API 응답 타입(401, 403)도 codegen 범위에 포함 필요
- [ADR-0018: Graceful Cancellation](/docs/architecture/adr/2026-03-30-graceful-cancellation) — 인증 미들웨어가 요청 취소 흐름에 영향을 주지 않도록 설계 필요
