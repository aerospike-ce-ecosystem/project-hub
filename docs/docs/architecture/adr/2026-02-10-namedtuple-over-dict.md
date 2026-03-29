---
title: "ADR-0004: Dict 대신 NamedTuple 반환 선택"
description: aerospike-py에서 레코드 결과를 dict 대신 NamedTuple로 반환하도록 선택한 아키텍처 결정 기록.
scope: single-repo
repos: [aerospike-py]
tags: [adr, namedtuple, type-safety, aerospike-py, python]
last_updated: 2026-03-29
---

# ADR-0004: Dict 대신 NamedTuple 반환 선택

## 상태

**Accepted**

- 제안일: 2026-02-10
- 승인일: 2026-02-14

## 맥락 (Context)

aerospike-py에서 `get()`, `query()`, `batch_get()` 등의 operation이 반환하는 레코드 결과의 형식을 결정해야 했습니다.

기존 Aerospike 공식 Python 클라이언트(`aerospike` PyPI 패키지)는 결과를 `(key, meta, bins)` tuple 또는 dict를 혼합하여 반환했습니다. 이 방식에는 다음과 같은 문제가 있었습니다:

- **위치 기반 접근의 모호함**: `result[0]`, `result[1]`, `result[2]`와 같은 인덱스 기반 접근은 코드 가독성을 심각하게 저해
- **타입 안전성 부재**: 반환값이 plain tuple/dict이므로 IDE 자동완성, 타입 체커(pyright, mypy)가 내부 구조를 추론 불가
- **meta 접근의 불편함**: generation count, TTL 등 메타데이터에 접근하려면 `result[1]['gen']`과 같은 중첩 딕셔너리 접근 필요
- **일관성 없는 반환 형식**: operation마다 tuple, dict, None 등 반환 형식이 달라 학습 비용 증가

aerospike-py는 Rust/PyO3 기반으로 새롭게 설계되었으므로, 기존 공식 클라이언트와의 하위 호환성 제약 없이 반환 형식을 자유롭게 결정할 수 있었습니다.

### 요구사항

1. IDE 자동완성(autocomplete)과 타입 체커가 필드를 인식할 것
2. 속성(attribute) 접근 방식으로 가독성을 높일 것
3. PyO3에서 자연스럽게 구현 가능할 것
4. 직렬화(serialization)가 용이할 것

## 결정 (Decision)

> **aerospike-py의 모든 레코드 반환값에 `NamedTuple` 패턴을 사용한다. `record.bins`, `record.meta.gen`, `record.meta.ttl`과 같은 속성 접근을 표준으로 한다.**

### 구현 구조

```python
# 반환 타입 정의 (PyO3 #[pyclass])
class RecordMeta:
    gen: int      # generation count
    ttl: int      # time-to-live (초)

class Record:
    key: RecordKey
    meta: RecordMeta
    bins: dict[str, Any]

class RecordKey:
    namespace: str
    set_name: str | None
    key: str | int | bytes | None
    digest: bytes
```

### 사용 예시

```python
# aerospike-py (새로운 NamedTuple 방식)
record = await client.get(key)
print(record.bins["name"])       # bin 접근
print(record.meta.gen)           # generation 접근
print(record.meta.ttl)           # TTL 접근
print(record.key.namespace)      # namespace 접근

# 기존 공식 클라이언트 (비교)
key, meta, bins = client.get(("ns", "set", "pk"))
print(bins["name"])              # bin 접근
print(meta["gen"])               # generation 접근 (dict 키)
```

### 적용 범위

- `get()`, `exists()`: 단일 `Record` 반환
- `query()`, `scan()`: `AsyncIterator[Record]` 반환
- `batch_get()`: `list[Record | RecordNotFound]` 반환
- `operate()`, `operate_ordered()`: `Record` 반환

## 대안 검토 (Alternatives Considered)

### 대안 1: Raw Dict 반환

- **설명**: `{"key": {...}, "meta": {"gen": 1, "ttl": 300}, "bins": {"name": "Alice"}}` 형태의 plain dict 반환
- **장점**: 유연성 높음, JSON 직렬화 직접 가능, 추가 클래스 정의 불필요
- **단점**: 타입 안전성 없음, IDE 자동완성 불가, 키 오타 런타임까지 미발견 (`result["metta"]` 같은 오타)
- **미선택 사유**: 타입 안전성이 핵심 요구사항이었으며 dict는 이를 전혀 충족하지 못함

### 대안 2: dataclass

- **설명**: Python `@dataclass`를 사용한 구조화된 반환 타입
- **장점**: 타입 안전성, IDE 지원, mutable 속성 변경 가능
- **단점**: PyO3에서 Python dataclass를 직접 생성하기 어려움 (Rust 측에서 `#[pyclass]`로 구현 후 Python dataclass 프로토콜을 에뮬레이션해야 함), 불필요한 mutability
- **미선택 사유**: PyO3에서의 구현 복잡도가 높고, 레코드 결과는 immutable이 적합

### 대안 3: TypedDict

- **설명**: `TypedDict`를 사용하여 dict 키에 타입 힌트 추가
- **장점**: dict의 유연성 유지, 타입 체커 지원
- **단점**: 런타임 타입 검증 없음 (타입 힌트만 제공), 속성 접근 불가 (여전히 `result["bins"]`), PyO3에서 TypedDict 생성이 까다로움
- **미선택 사유**: 속성 접근이라는 UX 목표를 달성하지 못하며 런타임 안전성도 부족

## 결과 (Consequences)

### 긍정적 결과

- **타입 안전성**: pyright, mypy에서 `record.bins`, `record.meta.gen` 등의 타입을 완전히 추론하여 컴파일 타임에 오류 감지
- **IDE 자동완성**: VS Code, PyCharm 등에서 `.` 입력 시 사용 가능한 필드 목록 자동 표시
- **코드 가독성**: `record.meta.gen`은 `result[1]["gen"]`보다 의미가 명확
- **immutability**: NamedTuple 스타일의 frozen 객체로 의도치 않은 수정 방지
- **PyO3 호환성**: Rust `#[pyclass]`로 자연스럽게 구현 가능하며 성능 오버헤드 없음

### 부정적 결과 / 트레이드오프

- **기존 공식 클라이언트와 비호환**: `(key, meta, bins)` tuple unpacking 패턴에 익숙한 사용자의 마이그레이션 비용 발생
- **직렬화 추가 단계**: JSON으로 직렬화 시 `.to_dict()` 호출이 필요 (plain dict와 달리 `json.dumps()`에 직접 전달 불가)
- **학습 비용**: aerospike-py 고유의 반환 타입 구조를 새로 학습해야 함

### 리스크

- 기존 공식 클라이언트에서 마이그레이션하는 사용자가 혼동할 수 있음 (마이그레이션 가이드로 완화)
- Python 생태계에서 NamedTuple보다 dataclass가 표준으로 자리잡을 경우 재검토 필요 (낮은 확률)

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `aerospike-py` | 모든 read operation의 반환 타입을 Record NamedTuple로 구현 |
| `cluster-manager` | Backend에서 aerospike-py 호출 시 NamedTuple 속성 접근 패턴 사용 |
| `plugins` | aerospike-py-api Skill에서 NamedTuple 반환 패턴을 가이드 |

## 참고 자료

- [PR #127 - Record NamedTuple 타입 도입](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/127)
- [PR #205 - batch operation NamedTuple 통일](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/205)
- [PyO3 #[pyclass] 문서](https://pyo3.rs/latest/class.html)
- [Python typing.NamedTuple 문서](https://docs.python.org/3/library/typing.html#typing.NamedTuple)
