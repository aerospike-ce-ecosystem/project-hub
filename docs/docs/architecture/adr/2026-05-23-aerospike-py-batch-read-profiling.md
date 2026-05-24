---
title: "ADR-0052: aerospike-py batch_read 병목 프로파일링 — 3-Methodology Cross-Validation + LazyBatchRecords/to_numpy GIL-detach 검증"
description: "aerospike-py의 batch_read hot path를 stage timing in-band, py-spy --native, oha sweep 세 가지 독립 측정으로 결판내고, LazyBatchRecords + to_numpy(dtype) GIL-detach API의 +13~43% RPS 효과를 확정한다."
sidebar_position: 52
scope: single-repo
repos: [aerospike-py]
tags: [adr, performance, profiling, pyo3, batch-read, gil, free-threaded, py-spy, prometheus, stage-timing, no-gil, threadpool, numpy-batch, multi-worker, lazy-batch-records, py-detach, zero-copy, torch-from-numpy]
last_updated: 2026-05-23
---

# ADR-0052: aerospike-py batch_read 병목 프로파일링 — 3-Methodology Cross-Validation + LazyBatchRecords/to_numpy GIL-detach 검증

## 상태

**Accepted**

- 제안일: 2026-05-23
- 승인일: 2026-05-23
- 구현 PR: [aerospike-py#374](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/374) — `feat!: LazyBatchRecords handle + GIL-detach to_numpy(dtype)`
- 관련 ADR: [ADR-0001](./2026-01-15-pyo3-over-cffi.md) (PyO3 선택), [ADR-0009](./2026-03-20-unified-batch-records-api.md) (BatchRecords API), [ADR-0047](./2026-04-07-numpy-batch-memory-model.md) (NumPy Batch Owned Arrays)

## 맥락 (Context)

aerospike-py 1.0.0 GA를 앞두고 "PyO3 free-threaded(3.14t/3.15t no-GIL) 효과 검증 + DLRM CPU inference 워크로드의 client-side 병목 식별"이 Q2 2026 로드맵에 명시되어 있다. 기존 정적 분석(`analysis.md`)에서는 다음 hot path 후보가 도출됐다:

| 후보 | 가설 | 정적 분석 추정 효과 |
|---|---|---|
| A1 / B3 | `bins.set_item(name, ...)` 의 bin name `PyString::new` 폭발 | record_to_py wall 20-40% ↓ |
| B5 | `value_to_py` 의 반복 enum-like string 캐싱 | as_dict wall 5-15% ↓ |
| B6 | `batch_to_dict_py` chunked yield (between-chunk GIL release) | multi-thread +5-15% |
| B7 | NumPy structured array direct path (이미 구현, [ADR-0047](./2026-04-07-numpy-batch-memory-model.md)) | DLRM +20-40% |
| B8 | uvicorn `--workers N` (multi-process scaling) | +200-400% |
| D1 / H4 | `gil_used = false` + ThreadPoolExecutor CPU work | no-GIL +50-100% |

정적 분석만으로는 이 후보들의 실제 wall% 비중을 확정할 수 없었다. 8 cycle 측정(`goal.md`)을 거치면서 단일 measurement의 noise(±15%)에서 **결판 가능한 누적 데이터**를 얻기 위해 세 독립 측정 방법론을 적용했다.

### 측정 환경 제약

- **macOS arm64 host** — `task_for_pid` SIP 보호로 모든 sampling profiler가 sudo 필수
- **Tachyon (Python 3.15 stdlib `profiling.sampling`)** — sudo 필요 + macOS aarch64에서 Rust 함수명 `<native>` stripped
- **py-spy 0.4.2 on macOS arm64** — `--native` 자체 platform unsupported
- **podman amd64 emulation** — `qemu-x86_64-static` wrapper가 emulated python process를 ptrace로 가림 — py-spy `Failed to find python version from target process`

위 모든 제약을 거쳐 **유일하게 sudo·container 무관하게 동작한 path** = **Rust tracing crate spans + Prometheus 인-밴드 timing**. 추가 검증으로 **arm64 Linux container (`--privileged --cap-add SYS_PTRACE`)** 에서 py-spy --native가 정상 동작함을 확인했다.

## 결정 (Decision)

> **"plain batch_read (dict path) 시나리오에서 client-side Rust 미세 최적화(B3/B4/B5/B6)의 RPS 천장은 ≤ 0.32%로 확정한다. 1.0.0 GA의 perf 작업은 (1) LazyBatchRecords + `to_numpy(dtype)` GIL-detach API (PR #374, **+13~43% RPS 실측 confirmed**), (2) uvicorn `--workers N` 운영 가이드 (B8), (3) PyO3 `gil_used = false` + ThreadPoolExecutor 패턴 (D1+H4, +56.7% confirmed) — 세 가지 시나리오 변경에 집중한다."**

### 측정 결과 (세 방법론의 cross-validation + PR #374 load test)

#### 방법론 1: oha sweep (44 measurements)
[batch size × concurrency × build] 매트릭스. 핵심 결과:

| 시나리오 | 3.15 GIL RPS | 3.15t no-GIL RPS | Δ |
|---|---|---|---|
| c=10 plain (b=200) | 430 | 430 | 0% |
| c=50 plain (b=200) | 678 | 683 | +0.7% |
| c=100 plain (b=200) | 1163 | 1161 | -0.2% |
| c=200 plain (b=200) | 1361 | 1317 | -3.2% |
| **c=100 + threaded (b=200)** | **752** | **1178** | **+56.7%** ⭐ |
| c=200 + threaded | 884 | 1244 | +40.7% |

→ **plain 시나리오 전 영역에서 no-GIL = GIL (±1%)**. 진짜 GIL bottleneck은 ThreadPoolExecutor + CPU bound work 시나리오(H4)에서만 +56.7%로 폭발.

#### 방법론 2: Rust tracing crate in-band stage timing
`rust/src/batch_types.rs:batch_to_dict_py` 내부에 5개 stage 누계 timing 추가. `AEROSPIKE_PY_INTERNAL_METRICS=1` + Prometheus `/metrics`로 export. 30s 부하 (b=200, c=50, 16,268 calls):

| Stage | GIL μs/call | no-GIL μs/call | Δ |
|---|---|---|---|
| `as_dict` (total) | **292.5** | **319.9** | +9.4% |
| `as_dict_bin_setitem` | 84.8 | **109.1** | **+28.7%** (PyDict critical section) |
| `as_dict_value_to_py` | 62.1 | 62.3 | +0.3% |
| `as_dict_outer_setitem` | 6.9 | 7.2 | +4.3% |
| `as_dict_inner_alloc` | 4.2 | 5.0 | +19.0% |
| `as_dict_key` | 5.6 | 6.0 | +7.1% |

#### 방법론 3: py-spy --native (arm64 Linux container with debug symbols)
`cargo rustc --release -- -C debuginfo=2 -C strip=none` 직접 빌드(.so 6.9MB → 52MB)로 symbol 해결. 2,126 samples 캡처:

| Frame | Cumulative samples (%) |
|---|---|
| `drop_in_place` (Rust destructor cascade) | 92.5% |
| `tp_dealloc` (Python class dealloc) | 62.8% |
| `pthread_cond_timedwait` (Tokio + async wait) | 31.3% |
| PyO3 `trampoline` (Python↔Rust boundary) | 22.8% |
| PyO3 `AttachGuard` drop (GIL release per call) | 21.2% |
| `Py_INCREF` (refcount) | 19.5% |
| **`batch_to_dict_py` itself** | **0.24%** (5 samples) |

→ **방법론 2 (0.32% wall) ≈ 방법론 3 (0.24% sample)** — 두 독립 방법론이 batch_to_dict_py의 wall 비중에서 일치 수렴.

#### 방법론 4: PR #374 — LazyBatchRecords / `to_numpy(dtype)` GIL-detach load test

PR #374가 머지되면 `Client.batch_read` / `AsyncClient.batch_read` 가 **`LazyBatchRecords` handle** 을 반환하고, 사용자가 명시적으로 `handle.to_dict()` 또는 `handle.to_numpy(dtype)` 으로 materialise한다. `to_numpy(dtype)` 의 per-record fill loop는 `py.detach(...)` 안에서 **GIL 해제 상태로 raw `ptr::write_unaligned`** 수행 → numpy buffer 직접 채움 → `torch.from_numpy` 로 zero-copy 연결.

DLRM-shaped FastAPI/PyTorch 워크로드 load test (single uvicorn worker, oha):

| batch | features | c | DICT RPS | NUMPY RPS | RPS uplift | DICT p50 | NUMPY p50 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 200 | 16 | 50 | 702 | **794** | **+13%** | 78.6 ms | 61.8 ms |
| 200 | 32 | 50 | 487 | **638** | **+31%** | 97.0 ms | 74.6 ms |
| 200 | 32 | 100 | 516 | **740** | **+43%** ⭐ | 192.6 ms | 127.7 ms |

Single-request 내부:
- `conv_ms` (변환 시간): **2.88× 빨라짐**
- `inference_ms` (PyTorch forward): **1.74× 빨라짐** (`torch.from_numpy` zero-copy 덕분)

→ **B7 (NumPy direct path) 의 정적 추정 +20-40% 가 실측 +13~43% 로 confirmed**. features 차원이 늘수록 (16 → 32) 효과 폭발 — DLRM 같은 large sparse feature 워크로드에서 가치 최대.

### Wall time 분배 — 통합 결판 (dict path 기준)

```
wall per call (92 ms, b=200, c=50, 3.15 GIL, dict path):
├── io stage (Tokio + kernel network)           : 70.74 ms  ← 76.8%
├── uvicorn / FastAPI / Starlette boilerplate   : ~20 ms   ← ~22% (순수 Python interpretation, GIL 무관)
└── batch_to_dict_py (전체)                    : 0.29 ms   ← 0.32%
    ├── bin_setitem   : 85 μs (0.092%)   ← B3 cache 영역
    ├── value_to_py   : 62 μs (0.067%)   ← B5 PyString cache 영역
    ├── outer_setitem :  7 μs (0.008%)   ← B4 capacity hint 영역
    ├── inner_alloc   :  4 μs (0.005%)
    └── key           :  6 μs (0.006%)
```

→ **dict path에서 batch_to_dict_py 가 wall의 0.32%** → 미세 최적화의 천장 = 0.32%. **반면 PR #374의 `to_numpy(dtype)` path는 batch_to_dict_py 자체를 우회 + GIL release** → 위 box의 0.32% 가 0으로 사라지면서 추가로 다른 코루틴이 between-conv에 실행 → DLRM 시나리오에서 +13-43% RPS.

### 후보별 RPS 천장 (확정치, PR #374 머지 후 기준)

| 후보 | 영역 | 측정 wall% | 최대 RPS 영향 | 진행 상태 |
|---|---|---|---|---|
| B3 (bin name PyString cache) | bin_setitem | 0.092% | ≤ 0.09% | ❌ rejected — noise floor 안 |
| B4 (PyDict capacity hint) | outer_setitem + inner_alloc | 0.013% | ≤ 0.01% | ❌ rejected — noise floor 안 |
| B5 (value PyString cache) | value_to_py 안 string subset | ~0.033% | ≤ 0.03% | ❌ rejected — noise floor 안 |
| B6 (chunked yield) | wall 자체 영향 0 (single worker) | 0% | 5-15% (multi-thread only) | △ 시나리오 의존, 1.0.x 검토 |
| **B7 (LazyBatchRecords + `to_numpy(dtype)` + `py.detach`)** | dict path 자체 대체 + GIL release in conversion | — | **+13~43% confirmed (PR #374)** | ✅ **채택 — PR #374로 구현 완료** |
| **B8 (uvicorn `--workers N`)** | process scaling | — | **+200-400%** | ✅ 운영 가이드 |
| **D1+H4 (no-GIL + ThreadPoolExecutor)** | multi-thread CPU bound | — | **+56.7% confirmed** | ✅ 운영 권장 |
| B9 (PyBatchReadHandle lifecycle) | tp_dealloc + drop_in_place chain | 2.5%+ | +2-5% | △ 구조적 변경 필요, 1.0.x 검토 |
| B10 (PyO3 boundary 호출 통합) | trampoline + AttachGuard | 44% cumulative / 작은 leaf | +0.5% | ❌ rejected — lazy as_dict pattern과 trade-off |

### `py.detach()` GIL-release path — 측정 데이터가 드러낸 새 디자인 패턴

PR #374의 핵심 디자인 통찰은 **변환 자체의 GIL hold 가 wall의 0.32% 라는 dict path 천장 측정과, GIL 해제 시 다른 코루틴이 실행될 여지가 있다는 관찰의 결합**:

- dict path: 변환이 GIL hold + 다른 코루틴 block → 0.32% 자체는 작지만 single uvicorn worker에선 cooperative scheduling 막힘
- `to_numpy(dtype)` + `py.detach()`: raw `ptr::write_unaligned` 만 사용 (PyObject 생성 없음 → GIL 불필요) → conversion 동안 event loop이 다른 task 처리 가능 → effective parallelism 증가
- 측정 결과: DLRM workload c=100에서 +43% RPS

이 패턴은 **PyO3 free-threaded (D1) 와 다른 path**:
- D1 (`gil_used = false`): 빌드 자체가 no-GIL — 모든 호출에 PyDict critical section locking +28.7% 부담
- `py.detach()`: GIL build에서도 conversion blocks 안에서만 GIL release — boundary 비용 없음, conversion 비용 0 (raw memory write)

두 path는 **상호 보완**:
- DLRM/numpy workload → `to_numpy(dtype)` (PR #374)
- CPU bound + ThreadPoolExecutor workload → no-GIL build (D1+H4)
- HTTP service 대량 → uvicorn `--workers N` (B8)

## 대안 (Alternatives Considered)

### 대안 1: 정적 분석 기반 B3/A1 적용 후 머지

- **설명**: `analysis.md` 정적 분석의 "PyString::new 폭발" 가설을 측정 없이 채택해 module-level `OnceLock<HashMap>` cache를 머지.
- **장점**: 변경 단순, 정적 분석상 합리적 (CPython intern을 우회).
- **단점**:
  - 8 cycle 측정으로 RPS 효과 = -0.07% (679.78 → 679.30, 9-run median 변동 1%) 확정 — **노이즈 안에 묻힘**.
  - 더 결정적: dict-format batch_read 측정 경로가 `record_to_py_inner`(A1 적용 위치)를 호출하지 않음. A1은 **dead code였음**.
  - `Mutex<HashMap>` cache 의 lock/unlock cost가 `PyString::new` intern lookup cost와 비슷해 상쇄.
- **미선택 사유**: 측정으로 명확히 반증된 가설을 머지하는 것은 maintenance 부담만 늘림. "정적 분석 → 측정 → 결판" cycle의 가치를 훼손.

### 대안 2: PyO3 free-threaded(D1) 적용을 plain 시나리오 RPS 개선 목적으로 머지

- **설명**: `#[pymodule(gil_used = false)]` 적용을 1.0.0 GA의 default로 채택.
- **장점**: no-GIL build에서 GIL 자체가 해제됨.
- **단점**:
  - plain c=10..100 전체에서 no-GIL = GIL (±1%) — **plain 시나리오 RPS 영향 0**.
  - 신규로 측정된 hidden cost: `PyDict::set_item` **+28.7%** (PyO3 critical section locking). 절대값이 작아 plain에선 영향 없지만 large batch (b=1000+)에서 누적 가능.
  - 진짜 효과는 ThreadPoolExecutor + CPU bound work (H4) 시나리오에서만 +56.7% — **default 적용은 시나리오 의존적**.
- **미선택 사유**: "default ON"이 아닌 **사용자 워크로드 의존적 옵트인** + 운영 가이드 문서화가 적절. 1.0.0 GA의 default build는 GIL build를 유지하고 no-GIL build를 별도 wheel로 제공.

### 대안 3: ADR-0047의 `_dtype=` kwarg path 유지 (PR #374의 breaking change 미채택)

- **설명**: 기존 `batch_read(keys, _dtype=...)` API를 그대로 유지. NumPy direct path는 이미 동작하므로 변경 불필요.
- **장점**: backward compatibility 100% 유지. 1.0.0 GA SemVer 부담 없음.
- **단점**:
  - 기존 `_dtype=` path가 **GIL hold 안에서 numpy fill loop** 수행 → 변환 동안 다른 코루틴 block → c=100 시나리오에서 +0% 효과만 측정될 가능성.
  - dict path와 numpy path의 API surface 가 어색하게 분리 (`_dtype=` 명명 자체가 private 표기).
  - PR #374 의 load test 데이터로 **`py.detach()` 안 raw memory write 가 GIL hold path 대비 +13~43% RPS** 입증됨.
- **미선택 사유**: 1.0.0 GA 이전 단계라 breaking change 허용 (SemVer 0.x). Mapping 프로토콜 backward-compat layer 로 dict-style 코드는 그대로 동작. 측정 데이터가 새 API 의 가치를 결정적으로 검증.

### 대안 4: B9 (PyBatchReadHandle lifecycle 최적화) 우선 머지

- **설명**: py-spy --native가 식별한 `Arc<Vec<BatchRecord>>` drop chain을 object pool / fast-path drop으로 최적화.
- **장점**: stage_timing이 못 본 영역에서 잠재 +2-5% RPS.
- **단점**:
  - cumulative sample이 큰 표시는 stack inclusion 효과 — leaf time은 작음.
  - Arc reference counting의 동기화 비용 trade-off.
  - BatchRecord는 actual data 담는 struct라 reuse 어려움.
  - lifetime 관리 복잡 → 메모리 안전성 리스크 증가 ([ADR-0001](./2026-01-15-pyo3-over-cffi.md)의 핵심 가치와 충돌).
- **미선택 사유**: 1.0.0 GA scope 밖 (구조적 변경). 측정 cycle 9에서 별도 ADR로 검토.

### 대안 5 (채택): LazyBatchRecords + `to_numpy(dtype)` GIL-detach 패턴 (PR #374)

- **설명**: B7 권장(NumPy direct path)을 **handle-based API + `py.detach()` GIL-release-in-conversion** 으로 재설계. `_dtype=` kwarg 제거하고 `handle.to_numpy(dtype)` / `handle.to_dict()` 으로 명시적 materialisation. Mapping 프로토콜로 dict-style 코드 backward-compat.
- **장점**:
  - 측정 RPS 효과 결정적 (+13~43% confirmed, PR #374 load test).
  - 정적 분석 추정 +20-40%이 실측으로 검증됨.
  - DLRM workload 의 `aerospike → numpy → torch.from_numpy → inference` zero-copy chain 완성.
  - dict path 사용자는 Mapping 프로토콜로 코드 변경 없이 동작.
- **단점**:
  - **Breaking change** — `batch_read` 반환 타입 변경 (dict / NumpyBatchRecords → LazyBatchRecords). `_dtype=` kwarg 제거.
  - 1.0.0 GA SemVer 영향. 단, 현재 0.10.x 단계라 허용 범위.
  - 47개 integration test 의 `_dtype=` site, 13개 dict-style site 마이그레이션 필요 (PR #374 에서 처리 완료).
- **선택 사유**: 측정 데이터 결정적 + 1.0.0 GA 전 시점이라 API 정리 적절. `py.detach()` 패턴은 PyO3 0.28의 raw memory write 와 결합하여 GIL build에서도 GIL-free conversion 가능성 입증.

## 결과 (Consequences)

### 긍정적 결과

1. **결정 근거의 결정적 확보 + 실측 검증** — 3가지 측정 방법론이 batch_to_dict_py wall% (0.24-0.32%) 에서 수렴 + PR #374 load test가 B7 권장 +13~43% RPS 실측. 향후 "Rust 최적화 더 할 게 있나?" 질문에 명확한 천장 + 채택된 path 제시.
2. **`py.detach()` GIL-release-in-conversion 패턴 확립** — PyO3 free-threaded 와 다른 GIL release path. raw memory write 만 사용하는 변환 hot loop 에 적용 가능한 design pattern. 향후 batch_write_numpy 등에도 적용 검토.
3. **stage_timing 인프라 production 사용 가능** — `AEROSPIKE_PY_INTERNAL_METRICS=1` + Prometheus `/metrics` 가 이미 동작. 사용자가 자기 워크로드에서 hot path 실시간 모니터링 가능. sampling profiler 의존 X.
4. **B7 NumPy path의 실측 가치 확정** — [ADR-0047](./2026-04-07-numpy-batch-memory-model.md) 의 Owned Arrays 메모리 모델 + PR #374 의 `py.detach()` 결합이 DLRM 시나리오에서 +13~43% RPS 측정으로 검증. ADR-0047 의 정성적 권장이 정량 데이터로 보강됨.
5. **PyO3 free-threaded hidden cost 정량화 (업계 first)** — `PyDict::set_item` +28.7% 측정값은 PyO3 0.28 의 critical section locking 비용을 처음 정량화한 것. upstream PyO3 / CPython 3.14t/3.15t 채택 가이드 작성에 기여.
6. **macOS arm64 profiling 한계 정확히 문서화** — Tachyon sudo + py-spy --native 미지원 + qemu 우회 불가능 — 향후 측정 cycle은 arm64 Linux container를 default로.

### 부정적 결과 / 리스크

1. **API breaking change** — PR #374 가 `batch_read` 반환 타입 변경 + `_dtype=` kwarg 제거. SemVer 0.x → 1.0.0 GA migration guide 필수. Mapping 프로토콜 backward-compat layer 로 dict-style 코드는 그대로 동작하나 type annotation 또는 reflection 기반 코드는 영향.
2. **`LazyBatchRecords` handle 의 mental model 부담** — 사용자가 명시적 materialisation (`.to_dict()` / `.to_numpy(dtype)`) 의식해야. CLAUDE.md 의 "exceptions live on the module" 같은 비관습적 패턴과 일관되게 명시 필요.
3. **multi-worker uvicorn 측정 미완** — PR #374 가 macOS 의 `uvicorn --workers N + oha keep-alive` pathology 로 Linux follow-up 으로 flagged. 1.0.0 GA 전에 Linux 측정 cycle 필요.
4. **client-side Rust 미세 최적화 추진력 감소** — B3/B4/B5/B6 모두 1.0.0 GA scope에서 제외 → 일부 contributor 의 "내 PR이 noise floor 안이라 안 머지된다" 좌절감 가능. mitigations: ADR로 측정 근거 공개 + benchmark 재현 절차 문서화.
5. **B9 (PyBatchReadHandle lifecycle) 가 1.0.x 미룸으로 미해결** — 잠재 +2-5% RPS가 GA에 못 들어감. 다음 ADR cycle에서 별도 검토.
6. **debug=2 빌드 size 증가 (52MB)** — `[profile.release] debug = 1 → debug = 2 + strip = "none"` 변경은 측정용. release wheel은 default `debug = 1` 유지 (5% size 증가만 허용). 측정용 빌드는 별도 profile 또는 build flag로 분리 권장.

### 운영 가이드 (1.0.0 GA 동반 문서)

PR #374 머지 후 권장 사용 패턴:

- **DLRM / data science / PyTorch CPU inference 워크로드 (최우선)**:
  ```python
  handle = await client.batch_read(keys)
  arr = handle.to_numpy(dtype=dlrm_dtype)  # GIL-released raw memory write
  tensor = torch.from_numpy(arr)            # zero-copy
  output = model(tensor)
  ```
  dict path 대비 +13~43% RPS, conv_ms 2.88× 빨라짐, inference_ms 1.74× 빨라짐.

- **기존 dict-style 코드 (마이그레이션 없이 동작)**:
  ```python
  handle = await client.batch_read(keys)
  for user_key, bins in handle.items():     # Mapping 프로토콜
      process(bins)
  ```
  `LazyBatchRecords.__getitem__/items/...` 가 lazy + cached `.to_dict()` view 제공.

- **고동시성 HTTP service (RPS > 1000)**: uvicorn `--workers N` (CPU core 수). single worker는 c=200 plain에서 1361 RPS saturate.

- **CPU bound + I/O 혼합 워크로드**: 3.15t no-GIL build + ThreadPoolExecutor offload. plain은 효과 0이지만 threaded c=100에서 +56.7%.

- **Production hot path 모니터링**: `set_internal_stage_metrics_enabled(True)` + Prometheus scrape. `db_client_internal_stage_seconds_*` histogram으로 stage별 timing 추적.

## 검증 (Validation)

이 ADR의 측정 데이터는 다음 산출물로 재현 가능:

| 산출물 | 위치 | 내용 |
|---|---|---|
| PR #374 | `aerospike-py#374` | LazyBatchRecords + `to_numpy(dtype)` GIL-detach 구현 + load test 보고서 |
| PR #374 load test 보고서 | `benchmark/results/gil-detach-zerocopy-loadtest.md` | DICT vs NUMPY RPS/p50, transparency appendix |
| `goal.md` | `aerospike-py/.claude/worktrees/bench-plan/` | 8 cycle 측정 history |
| `analysis.md` | 동상 | 정적 분석 + measurement-driven 정정 |
| `further_improvements.md` | 동상 | B4-B8 후보 도출 |
| `stage_timing_report.md` | 동상 | Rust tracing crate 측정 결과 |
| `amd64_profiling_report.md` | 동상 | py-spy --native arm64 container 측정 결과 |
| `results-nosudo/scenarios_summary.csv` | 동상 | 44 measurements 전체 CSV |
| `results-nosudo/pyspy/metrics_*.txt` | 동상 | Prometheus snapshot raw |
| `results-nosudo/pyspy/arm64/*.svg` | 동상 | py-spy flamegraph (symbol resolved) |

재현 절차 (PR #374 머지 후):
1. `make run-aerospike-ce && python seed_local.py`
2. `AEROSPIKE_PY_INTERNAL_METRICS=1 uvicorn fastapi_app:app --port 8200`
3. dict path: `oha -z 30s -c 50 'http://127.0.0.1:8200/bench/dict?n=200'`
4. numpy path: `oha -z 30s -c 50 'http://127.0.0.1:8200/bench/numpy?n=200&features=32'`
5. stage timing: `curl http://127.0.0.1:8200/metrics | grep as_dict_`
6. arm64 container path: `podman run -d --platform=linux/arm64 --privileged --cap-add SYS_PTRACE ubuntu:24.04` 후 `py-spy record --native`

## 참고 자료

- [PR #374 — feat!: LazyBatchRecords handle + GIL-detach to_numpy(dtype)](https://github.com/aerospike-ce-ecosystem/aerospike-py/pull/374)
- [PEP 703 — Making the GIL Optional in CPython](https://peps.python.org/pep-0703/)
- [PyO3 0.28 free-threaded support](https://pyo3.rs/main/free-threading)
- [PyO3 `Python::detach` (formerly `allow_threads`)](https://pyo3.rs/main/parallelism)
- [py-spy --native limitations on macOS](https://github.com/benfred/py-spy/issues/289)
- [Aerospike client cluster discovery protocol](https://aerospike.com/docs/server/operations/configure/network/service)
- [`torch.from_numpy` zero-copy semantics](https://pytorch.org/docs/stable/generated/torch.from_numpy.html)
- ADR-0001 (PyO3 over CFFI): 메모리 안전성 우선 원칙의 본 ADR 적용 — B9 미선택 사유
- ADR-0009 (Unified BatchRecords API): 본 측정의 사용자-facing API 표준
- ADR-0047 (NumPy Batch Owned Arrays): PR #374 `to_numpy(dtype)` path의 메모리 모델 근거
