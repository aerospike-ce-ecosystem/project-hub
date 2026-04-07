---
title: "ADR-0001: CFFI 대신 Rust/PyO3 선택"
description: aerospike-py에서 C FFI(CFFI) 대신 Rust/PyO3를 바인딩 기술로 선택한 아키텍처 결정 기록.
sidebar_position: 1
scope: single-repo
repos: [aerospike-py]
tags: [adr, pyo3, rust, cffi, aerospike-py, performance]
last_updated: 2026-03-29
---

# ADR-0001: CFFI 대신 Rust/PyO3 선택

## 상태

**Accepted**

- 제안일: 2026-01-15
- 승인일: 2026-01-20

## 맥락 (Context)

aerospike-py는 Python에서 Aerospike Server CE에 접속하기 위한 클라이언트 라이브러리입니다. Aerospike의 기존 공식 Python 클라이언트(`aerospike` PyPI 패키지)는 C 클라이언트(aerospike-client-c)를 CFFI로 감싸는 방식이었습니다.

이 방식에는 다음과 같은 문제가 있었습니다:

- **빌드 복잡성**: C 클라이언트 의존성으로 인해 플랫폼별 빌드가 복잡
- **메모리 안전성**: C 코드의 메모리 관리 이슈 (segfault, memory leak 가능성)
- **비동기 지원 부재**: C 클라이언트는 동기 API만 제공하여 Python asyncio 통합이 어려움
- **유지보수 부담**: C와 Python 두 언어의 인터페이스 코드 관리 필요

한편, Aerospike CE Ecosystem에서는 이미 Rust 기반 `aerospike-client-rust v2`를 개발 중이었으며, 이를 Python에서 활용할 방법이 필요했습니다.

## 결정 (Decision)

> **aerospike-py는 Rust/PyO3를 사용하여 aerospike-client-rust v2를 Python에 바인딩한다.**

PyO3를 통해 Rust 코드를 Python 네이티브 모듈로 컴파일하고, maturin으로 wheel을 빌드하여 배포합니다.

### 구현 구조

```
Python (Client/AsyncClient)
    ↓ PyO3 #[pyclass], #[pymethods]
Rust (aerospike-client-rust v2)
    ↓ tokio runtime
Aerospike Server CE
```

## 대안 검토 (Alternatives Considered)

### 대안 1: CFFI (C Foreign Function Interface)

- **설명**: 기존 aerospike-client-c를 CFFI로 감싸는 전통적 방식
- **장점**: 기존 C 클라이언트의 검증된 안정성, 넓은 플랫폼 지원
- **단점**: 빌드 복잡성, 메모리 안전성 이슈, 비동기 지원 어려움
- **미선택 사유**: 메모리 안전성과 비동기 지원이 핵심 요구사항이었으나 CFFI로는 충족 불가

### 대안 2: ctypes

- **설명**: Python 표준 라이브러리의 ctypes를 사용한 C 바인딩
- **장점**: 추가 의존성 불필요, 순수 Python
- **단점**: CFFI보다 성능 저하, 타입 안전성 부족, 동일한 C 의존성 문제
- **미선택 사유**: CFFI의 단점에 더해 성능까지 저하

### 대안 3: gRPC/REST Wrapper

- **설명**: Rust 서버를 별도 프로세스로 실행하고 gRPC/REST로 통신
- **장점**: 언어 독립적, 프로세스 격리
- **단점**: IPC 오버헤드, 배포 복잡성 증가 (사이드카 패턴 필요)
- **미선택 사유**: 네트워크 레이턴시 오버헤드가 고성능 DB 클라이언트에 부적합

## 결과 (Consequences)

### 긍정적 결과

- **네이티브 성능**: Rust의 제로코스트 추상화로 C 클라이언트와 동등한 성능
- **메모리 안전성**: Rust의 소유권 시스템으로 segfault, memory leak 원천 차단
- **비동기 지원**: tokio 런타임 기반으로 Python asyncio와 자연스럽게 통합
- **단일 언어 코어**: aerospike-client-rust v2를 Rust/Python 양쪽에서 공유
- **간편한 배포**: maturin으로 빌드한 wheel 배포로 사용자는 `pip install`만 하면 됨

### 부정적 결과 / 트레이드오프

- **Rust 학습 곡선**: 팀원들의 Rust 숙련도 필요
- **PyO3 제약**: 일부 Python 패턴(다중 상속 등)을 Rust에서 직접 표현하기 어려움
- **디버깅 복잡성**: Python-Rust 경계에서의 디버깅이 순수 Python보다 어려움

### 리스크

- PyO3의 major version 업데이트 시 바인딩 코드 수정 필요 (낮은 확률)
- aerospike-client-rust v2의 API 변경이 Python API에 직접 영향

## 영향받는 레포지토리 (Affected Repos)

| 레포 | 영향 내용 |
|------|----------|
| `aerospike-py` | 전체 아키텍처를 PyO3 기반으로 설계 및 구현 |
| `cluster-manager` | Backend에서 aerospike-py를 클라이언트로 사용 (간접 영향) |
| `plugins` | aerospike-py-api Skill이 PyO3 기반 API를 가이드 |

## 참고 자료

- [PyO3 공식 문서](https://pyo3.rs/)
- [maturin 빌드 도구](https://www.maturin.rs/)
- [aerospike-client-rust v2 레포](https://github.com/aerospike-ce-ecosystem/aerospike-client-rust)
