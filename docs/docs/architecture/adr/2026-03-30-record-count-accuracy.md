---
title: "ADR-0019: Cluster Manager 레코드 카운트 정확도 개선"
description: Cluster Manager에서 set object count 조회 실패 시 0 대신 None을 반환하여 "알 수 없음" 상태를 명시적으로 표현하고, 프론트엔드 pagination 정상 동작을 보장하는 아키텍처 결정.
sidebar_position: 19
scope: single-repo
repos: [cluster-manager, plugins]
tags: [adr, cluster-manager, record-browser, pagination, api-schema, bug-fix]
last_updated: 2026-03-30
---

# ADR-0019: Cluster Manager 레코드 카운트 정확도 개선

## 상태

**Proposed**

- 제안일: 2026-03-30
- 관련 이슈: aerospike-ce-ecosystem/project-hub#21
- 검토 결과: POSITIVE REVIEW

## 맥락 (Context)

Cluster Manager의 레코드 브라우저에서 `get_set_object_count()` 함수가 Aerospike info 명령 실패 시 `0`을 반환하고 있다. 이 동작은 다음과 같은 문제를 야기한다:

### 현재 동작 (버그)

```python
# routers/records.py:37-58
except Exception:
    logger.debug("Failed to get set object count for %s.%s", ...)
    return 0  # ← 실패 시 0 반환 (실제로는 "알 수 없음")
```

프론트엔드는 `total: 0`을 수신하면:
- `hasMore = false`로 설정 → "더 이상 레코드 없음" 표시
- Pagination 컨트롤 비활성화
- 사용자는 실제 데이터가 존재함에도 "레코드 없음"으로 오인

### 발생 조건

1. Aerospike info 명령 타임아웃 (네트워크 지연, 대규모 클러스터)
2. Set이 방금 생성되어 object count가 클러스터에 전파되지 않은 상태
3. ACL 활성화 클러스터에서 info 권한 없는 유저 접근
4. 필터 적용 시 `scanned` 카운트를 `returned` 값으로 대체 — 추정치를 정확한 값으로 표시

### 영향 범위

- 레코드 브라우저 전체 (scan, query 결과 포함)
- 레코드 export 시 불완전한 데이터 수집 가능
- 모니터링 대시보드의 set 크기 메트릭 왜곡
- 프로젝트 목표 2-8 "Record 브라우저 대용량 데이터 성능"의 전제 조건으로, 정확한 카운트가 pagination/limit 제어의 기반

## 결정 (Decision)

> **set object count 반환 타입을 `int | None`으로 변경하고, `None`은 "알 수 없음" 상태를 명시적으로 표현한다.**

### Backend 변경

1. `get_set_object_count()` 반환 타입: `int` → `int | None`
2. 실패 시 `None` 반환, 성공 시 정확한 값 반환
3. API 응답에 `total_estimated: bool` 필드 추가

```python
# Before
async def get_set_object_count(...) -> int:
    try: ...
    except: return 0

# After
async def get_set_object_count(...) -> int | None:
    try: ...
    except: return None  # "unknown"
```

### Frontend 변경

4. `total: null` 수신 시 "~N+ records" 표시 (N = 현재 로드된 레코드 수)
5. Pagination: 총 개수 미상일 때 "다음 페이지" 버튼 항상 활성화
6. 필터 적용 시 항상 `totalEstimated: true` 표시

### API Response 스키마 변경

```json
{
  "records": [],
  "total": 1234,
  "totalEstimated": true,
  "scanned": 5000,
  "hasMore": true
}
```

`total`이 `null`인 경우 클라이언트는 정확한 레코드 수를 알 수 없으며, 현재 로드된 데이터 기준으로 UI를 표시해야 한다.

## 대안 (Alternatives Considered)

### 대안 1: 실패 시 -1 반환 (sentinel value)

- **장점**: 타입 변경 불필요 (`int` 유지)
- **단점**: magic number 안티패턴. 프론트엔드에서 `-1` 체크 필요. JSON 직렬화 시 의미가 불명확.
- **미선택 사유**: `null/None`이 의미론적으로 "알 수 없음"을 정확히 표현하며, ADR-0004(NamedTuple)와 ADR-0009(BatchRecords)에서 확립한 명시적 타입 표현 원칙과 일치

### 대안 2: count 재시도 후 fallback

- **장점**: 실패를 숨기지 않으면서 정확도 향상
- **단점**: 추가 네트워크 지연 (최대 3회 × 타임아웃). 재시도해도 ACL 권한 부재 등 구조적 실패는 해결 불가.
- **미선택 사유**: 지연 증가가 UX에 부정적이며, `None` 표시가 사용자에게 더 정직한 정보 제공

## 결과 (Consequences)

### 긍정적

- "레코드 없음" 오표시 제거 — 데이터 신뢰도 향상
- 필터링된 결과에 대한 정확한 추정치 표시
- Pagination이 불완전한 count에서도 정상 동작
- ADR-0017(Virtual Scroll)과 결합 시 대용량 레코드 브라우저 안정성 확보
- 프로젝트 목표 2-8 달성의 기반 마련

### 부정적

- API 호환성 변경 (`total` 필드가 `int | null`로 확장). 단, Cluster Manager는 pre-release 단계이므로 breaking change 비용이 낮음
- 프론트엔드에서 "알 수 없음" 상태를 위한 추가 UI 분기 필요
- `totalEstimated` 필드 추가로 API 표면 소폭 확장

## 관련 ADR

- [ADR-0004: Dict 대신 NamedTuple 반환 선택](/docs/architecture/adr/2026-02-10-namedtuple-over-dict) — 명시적 타입 표현 원칙의 선례
- [ADR-0009: Unified BatchRecords API](/docs/architecture/adr/2026-03-20-unified-batch-records-api) — per-record 성공/실패 상태 명시적 표현 패턴
- [ADR-0017: Cluster Manager 레코드 브라우저 가상 스크롤 도입](/docs/architecture/adr/2026-03-30-virtual-scroll-record-browser) — 레코드 브라우저 성능 개선의 연장선
- [ADR-0017: Backend↔Frontend 타입 동기화 자동화](/docs/architecture/adr/2026-03-30-codegen-type-sync) — API 스키마 변경이 codegen으로 자동 반영 가능
