---
title: "ADR-0052: aerospike-py batch_read 병목 프로파일링 — 3-Methodology Cross-Validation + LazyBatchRecords/to_numpy GIL-detach 검증"
description: "세 가지 독립된 방법으로 batch_read 병목을 분석하고, LazyBatchRecords와 to_numpy(dtype)의 RPS 개선 효과를 검증한 결정"
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

aerospike-py 1.0.0 GA를 준비하면서 두 가지를 확인해야 했습니다. 하나는 PyO3 free-threaded build(Python 3.14t/3.15t no-GIL)의 실제 효과이고, 다른 하나는 DLRM CPU inference workload에서 발생하는 client-side 병목입니다. 기존 정적 분석(`analysis.md`)은 다음 hot path 후보를 제시했습니다.

| 후보 | 가설 | 정적 분석 추정 효과 |
|---|---|---|
| A1 / B3 | `bins.set_item(name, ...)` 의 bin name `PyString::new` 폭발 | record_to_py wall 20-40% ↓ |
| B5 | `value_to_py` 의 반복 enum-like string 캐싱 | as_dict wall 5-15% ↓ |
| B6 | `batch_to_dict_py` chunked yield (between-chunk GIL release) | multi-thread +5-15% |
| B7 | NumPy structured array direct path (이미 구현, [ADR-0047](./2026-04-07-numpy-batch-memory-model.md)) | DLRM +20-40% |
| B8 | uvicorn `--workers N` (multi-process scaling) | +200-400% |
| D1 / H4 | `gil_used = false` + ThreadPoolExecutor CPU work | no-GIL +50-100% |

정적 분석만으로는 각 후보가 전체 wall time에서 차지하는 비중을 알 수 없었습니다. 단일 측정의 noise가 ±15%에 이르렀기 때문에, 8개 측정 cycle(`goal.md`)에 걸쳐 서로 독립적인 세 가지 방법을 사용해 결과를 교차 검증했습니다.

### 측정 환경 제약

- **macOS arm64 host**: `task_for_pid`를 SIP가 보호하므로 모든 sampling profiler 실행에 `sudo`가 필요했습니다.
- **Tachyon(Python 3.15 standard library의 `profiling.sampling`)**: `sudo`가 필요했고, macOS aarch64에서는 Rust function name이 `<native>`로만 표시됐습니다.
- **macOS arm64의 py-spy 0.4.2**: platform 자체가 `--native` option을 지원하지 않았습니다.
- **Podman amd64 emulation**: `qemu-x86_64-static` wrapper 때문에 py-spy가 emulated Python process를 `ptrace`하지 못했고, `Failed to find python version from target process` error가 발생했습니다.

이 환경에서 권한이나 container에 의존하지 않고 사용할 수 있었던 방법은 Rust `tracing` span과 Prometheus를 결합한 in-band timing이었습니다. 별도의 arm64 Linux container를 `--privileged --cap-add SYS_PTRACE`로 실행했을 때는 `py-spy --native`도 정상적으로 작동했습니다.

## 결정 (Decision)

> **plain `batch_read`의 dict path에서는 client-side Rust 미세 최적화(B3/B4/B5/B6)가 개선할 수 있는 RPS의 상한을 0.32% 이하로 본다. 1.0.0 GA의 성능 작업은 `LazyBatchRecords.to_numpy(dtype)`의 GIL-detached 변환, uvicorn multi-worker 운영 지침, free-threaded Python과 `ThreadPoolExecutor`를 함께 쓰는 CPU-bound pattern에 집중한다.**

PR #374의 load test에서 `to_numpy(dtype)`는 RPS를 13~43% 개선했습니다. CPU-bound 작업을 `ThreadPoolExecutor`로 분리한 시나리오에서는 free-threaded Python이 RPS를 56.7% 개선했습니다.

### 측정 결과 (세 방법론의 cross-validation + PR #374 load test)

#### 방법론 1: oha sweep (44 measurements)

batch size, concurrency, Python build 조합을 바꿔 가며 측정했습니다. 핵심 결과는 다음과 같습니다.

| 시나리오 | 3.15 GIL RPS | 3.15t no-GIL RPS | Δ |
|---|---|---|---|
| c=10 plain (b=200) | 430 | 430 | 0% |
| c=50 plain (b=200) | 678 | 683 | +0.7% |
| c=100 plain (b=200) | 1163 | 1161 | -0.2% |
| c=200 plain (b=200) | 1361 | 1317 | -3.2% |
| **c=100 + threaded (b=200)** | **752** | **1178** | **+56.7%** ⭐ |
| c=200 + threaded | 884 | 1244 | +40.7% |

plain 시나리오에서는 GIL build와 no-GIL build의 차이가 대부분 ±1% 안에 머물렀습니다. 반면 CPU-bound 작업을 `ThreadPoolExecutor`로 분리한 H4 시나리오에서는 no-GIL build의 RPS가 56.7% 높았습니다.

#### 방법론 2: Rust tracing crate in-band stage timing

`rust/src/batch_types.rs`의 `batch_to_dict_py`에 다섯 단계의 누적 timing을 추가하고, `AEROSPIKE_PY_INTERNAL_METRICS=1`과 Prometheus `/metrics`로 결과를 내보냈습니다. 아래 표는 batch size 200, concurrency 50으로 30초 동안 16,268회를 호출한 결과입니다.

| Stage | GIL μs/call | no-GIL μs/call | Δ |
|---|---|---|---|
| `as_dict` (total) | **292.5** | **319.9** | +9.4% |
| `as_dict_bin_setitem` | 84.8 | **109.1** | **+28.7%** (PyDict critical section) |
| `as_dict_value_to_py` | 62.1 | 62.3 | +0.3% |
| `as_dict_outer_setitem` | 6.9 | 7.2 | +4.3% |
| `as_dict_inner_alloc` | 4.2 | 5.0 | +19.0% |
| `as_dict_key` | 5.6 | 6.0 | +7.1% |

#### 방법론 3: py-spy --native (arm64 Linux container with debug symbols)

arm64 Linux container에서 debug symbol을 포함해 `cargo rustc --release -- -C debuginfo=2 -C strip=none`으로 직접 build했습니다. 이 과정에서 `.so` 크기는 6.9 MB에서 52 MB로 늘었으며, 2,126개 sample을 수집했습니다.

| Frame | Cumulative samples (%) |
|---|---|
| `drop_in_place` (Rust destructor cascade) | 92.5% |
| `tp_dealloc` (Python class dealloc) | 62.8% |
| `pthread_cond_timedwait` (Tokio + async wait) | 31.3% |
| PyO3 `trampoline` (Python↔Rust boundary) | 22.8% |
| PyO3 `AttachGuard` drop (GIL release per call) | 21.2% |
| `Py_INCREF` (refcount) | 19.5% |
| **`batch_to_dict_py` itself** | **0.24%** (5 samples) |

방법 2는 `batch_to_dict_py`가 wall time의 0.32%를 차지한다고 측정했고, 방법 3에서는 전체 sample의 0.24%를 차지했습니다. 서로 독립된 두 측정 결과가 비슷한 범위에 수렴했습니다.

#### 방법론 4: PR #374 — LazyBatchRecords / `to_numpy(dtype)` GIL-detach load test

PR #374는 `Client.batch_read`와 `AsyncClient.batch_read`가 `LazyBatchRecords` handle을 반환하도록 변경합니다. 사용자는 `handle.to_dict()` 또는 `handle.to_numpy(dtype)`를 호출해 원하는 형식으로 명시적으로 materialize합니다. `to_numpy(dtype)`의 per-record fill loop는 `py.detach(...)` 안에서 GIL을 해제한 채 raw `ptr::write_unaligned`를 실행합니다. 이 방식으로 NumPy buffer를 직접 채운 뒤 `torch.from_numpy`와 zero-copy로 연결할 수 있습니다.

DLRM-shaped FastAPI/PyTorch 워크로드 load test (single uvicorn worker, oha):

| batch | features | c | DICT RPS | NUMPY RPS | RPS uplift | DICT p50 | NUMPY p50 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 200 | 16 | 50 | 702 | **794** | **+13%** | 78.6 ms | 61.8 ms |
| 200 | 32 | 50 | 487 | **638** | **+31%** | 97.0 ms | 74.6 ms |
| 200 | 32 | 100 | 516 | **740** | **+43%** ⭐ | 192.6 ms | 127.7 ms |

한 request 안에서 conversion time(`conv_ms`)은 2.88배 빨라졌고, PyTorch forward time(`inference_ms`)은 `torch.from_numpy`의 zero-copy 연결 덕분에 1.74배 빨라졌습니다.

B7 NumPy direct path의 정적 분석은 20~40%의 개선을 예상했습니다. 실제 RPS 개선 폭은 13~43%였으며, feature dimension이 16에서 32로 늘어날수록 효과도 커졌습니다. 따라서 large sparse feature를 다루는 DLRM workload에서 특히 유용합니다.

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

dict path에서 `batch_to_dict_py`는 전체 wall time의 0.32%를 차지했습니다. 따라서 이 함수만 미세 조정해서 얻을 수 있는 개선 폭도 최대 0.32%입니다. PR #374의 `to_numpy(dtype)`는 dict 변환을 우회하고 conversion 중 GIL을 해제합니다. 이때 event loop가 다른 coroutine을 실행할 수 있어 DLRM 시나리오에서 RPS가 13~43% 개선됐습니다.

### 후보별 RPS 천장 (확정치, PR #374 머지 후 기준)

| 후보 | 영역 | 측정 wall% | 최대 RPS 영향 | 진행 상태 |
|---|---|---|---|---|
| B3 (bin name PyString cache) | bin_setitem | 0.092% | ≤ 0.09% | 제외: noise floor 이하 |
| B4 (PyDict capacity hint) | outer_setitem + inner_alloc | 0.013% | ≤ 0.01% | 제외: noise floor 이하 |
| B5 (value PyString cache) | value_to_py 안 string subset | ~0.033% | ≤ 0.03% | 제외: noise floor 이하 |
| B6 (chunked yield) | wall 자체 영향 0 (single worker) | 0% | 5-15% (multi-thread only) | 시나리오에 따라 1.0.x에서 재검토 |
| **B7 (LazyBatchRecords + `to_numpy(dtype)` + `py.detach`)** | dict path 대체 + conversion 중 GIL release | — | **+13~43% 측정(PR #374)** | **채택: PR #374에서 구현** |
| **B8 (uvicorn `--workers N`)** | process scaling | — | **+200-400%** | 운영 지침으로 채택 |
| **D1+H4 (no-GIL + ThreadPoolExecutor)** | multi-thread CPU bound | — | **+56.7% 측정** | workload별 운영 지침으로 채택 |
| B9 (PyBatchReadHandle lifecycle) | tp_dealloc + drop_in_place chain | 2.5%+ | +2-5% | 구조 변경이 필요해 1.0.x에서 재검토 |
| B10 (PyO3 boundary 호출 통합) | trampoline + AttachGuard | 44% cumulative / 작은 leaf | +0.5% | 제외: lazy `as_dict` pattern과 trade-off |

### `py.detach()` GIL-release path — 측정 데이터가 드러낸 새 디자인 패턴

dict conversion 자체는 wall time의 0.32%에 불과하지만, single uvicorn worker에서는 그 짧은 시간에도 다른 coroutine이 실행되지 못합니다. PR #374는 다음과 같이 이 scheduling 제약을 줄입니다.

- **dict path**: conversion이 GIL을 점유하므로 single worker의 cooperative scheduling이 잠시 멈춥니다.
- **`to_numpy(dtype)` + `py.detach()`**: PyObject를 만들지 않고 raw `ptr::write_unaligned`만 사용하므로 GIL이 필요하지 않습니다. conversion 중 event loop가 다른 task를 처리할 수 있습니다.
- **측정 결과**: concurrency 100의 DLRM workload에서 RPS가 43% 높아졌습니다.

이 pattern은 PyO3 free-threaded build(D1)와 적용 범위가 다릅니다.

- D1의 `gil_used = false`는 build 전체가 no-GIL로 동작합니다. 대신 모든 `PyDict` 호출에서 critical-section locking 비용이 발생했고, `set_item` time이 28.7% 늘었습니다.
- `py.detach()`는 일반 GIL build에서도 conversion block 안에서만 GIL을 해제합니다. Python boundary를 추가하지 않고 raw memory write를 수행합니다.

두 방식과 multi-process scaling은 서로 다른 workload에 적합합니다.

- DLRM/NumPy workload에는 `to_numpy(dtype)`를 사용합니다(PR #374).
- CPU-bound 작업을 `ThreadPoolExecutor`로 실행한다면 no-GIL build를 고려합니다(D1+H4).
- 처리량이 큰 HTTP service는 uvicorn의 `--workers N` option으로 process 수를 늘립니다(B8).

## 대안 (Alternatives Considered)

### 대안 1: 정적 분석 기반 B3/A1 적용 후 머지

- **설명**: `analysis.md`가 제시한 반복적인 `PyString::new` 생성 가설을 별도 측정 없이 받아들이고 module-level `OnceLock<HashMap>` cache를 적용합니다.
- **장점**: 변경이 단순하며, CPython intern을 우회한다는 점에서 정적 분석상 합리적입니다.
- **단점**:
  - 8개 cycle에서 RPS는 679.78에서 679.30으로 0.07% 낮아졌습니다. 9회 측정 median의 변동 폭이 1%였으므로 이 차이는 noise보다 작습니다.
  - dict format의 `batch_read` 측정 경로는 A1이 적용되는 `record_to_py_inner`를 호출하지 않았습니다. 따라서 A1은 이 workload에서 실행되지 않는 code였습니다.
  - `Mutex<HashMap>` cache의 lock/unlock 비용이 `PyString::new` intern lookup 비용과 비슷해 개선 효과가 상쇄됐습니다.
- **미선택 사유**: 측정 결과가 가설을 뒷받침하지 않았습니다. 개선 효과 없이 maintenance 부담만 늘어날 수 있어 적용하지 않습니다.

### 대안 2: PyO3 free-threaded(D1) 적용을 plain 시나리오 RPS 개선 목적으로 머지

- **설명**: `#[pymodule(gil_used = false)]`를 적용한 no-GIL build를 1.0.0 GA의 default로 제공합니다.
- **장점**: build 전체에서 GIL에 의한 serialization을 피할 수 있습니다.
- **단점**:
  - concurrency 10~100의 plain 시나리오에서 GIL build와 no-GIL build의 차이는 ±1% 안에 머물렀습니다.
  - PyO3의 critical-section locking 때문에 `PyDict::set_item` time이 28.7% 늘었습니다. plain workload에서는 절대 시간이 작지만 batch size가 1,000 이상이면 비용이 누적될 수 있습니다.
  - 56.7% 개선은 `ThreadPoolExecutor`와 CPU-bound 작업을 함께 사용한 H4 시나리오에서만 나타났습니다.
- **미선택 사유**: 효과가 workload에 따라 크게 달라지므로 default로 사용하지 않습니다. 1.0.0 GA는 GIL build를 기본으로 유지하고 no-GIL build는 별도 wheel과 운영 지침으로 제공합니다.

### 대안 3: ADR-0047의 `_dtype=` kwarg path 유지 (PR #374의 breaking change 미채택)

- **설명**: 기존 `batch_read(keys, _dtype=...)` API와 NumPy direct path를 그대로 유지합니다.
- **장점**: backward compatibility를 완전히 유지하며 1.0.0 GA를 앞두고 API migration이 필요하지 않습니다.
- **단점**:
  - 기존 `_dtype=` path는 GIL을 점유한 채 NumPy fill loop를 실행하므로 conversion 중 다른 coroutine이 대기해야 합니다.
  - private naming convention을 사용하는 `_dtype=` keyword가 public API에 노출되고, dict path와 NumPy path의 API 형태도 일관되지 않습니다.
  - PR #374의 load test에서 `py.detach()` 안의 raw memory write는 GIL을 유지하는 path보다 RPS가 13~43% 높았습니다.
- **미선택 사유**: 아직 SemVer 0.x이고 1.0.0 GA 이전이므로 API를 정리할 수 있는 시점입니다. Mapping protocol compatibility layer를 통해 기존 dict-style 코드는 계속 동작하며, 측정 결과도 새 API의 가치를 뒷받침합니다.

### 대안 4: B9 (PyBatchReadHandle lifecycle 최적화) 우선 머지

- **설명**: `py-spy --native`가 포착한 `Arc<Vec<BatchRecord>>` drop chain을 object pool 또는 fast-path drop으로 최적화합니다.
- **장점**: stage timing에 포함되지 않은 영역에서 RPS를 2~5% 개선할 가능성이 있습니다.
- **단점**:
  - 높은 cumulative sample은 stack inclusion의 영향이며 실제 leaf time은 작습니다.
  - `Arc` reference counting에는 별도의 synchronization trade-off가 있습니다.
  - `BatchRecord`는 실제 데이터를 보관하므로 안전하게 재사용하기 어렵습니다.
  - lifetime 관리가 복잡해져 memory safety risk가 커지며, 이는 [ADR-0001](./2026-01-15-pyo3-over-cffi.md)의 핵심 원칙과 충돌할 수 있습니다.
- **미선택 사유**: 1.0.0 GA 범위를 넘어서는 구조적 변경입니다. 측정 cycle 9에서 별도의 ADR로 검토합니다.

### 대안 5 (채택): LazyBatchRecords + `to_numpy(dtype)` GIL-detach 패턴 (PR #374)

- **설명**: NumPy direct path를 handle-based API와 `py.detach()`를 이용한 GIL-detached conversion으로 다시 설계합니다. `_dtype=` keyword를 제거하고 `handle.to_numpy(dtype)` 또는 `handle.to_dict()`로 명시적으로 materialize합니다. Mapping protocol로 기존 dict-style code와의 compatibility를 유지합니다.
- **장점**:
  - PR #374 load test에서 RPS가 13~43% 개선됐습니다.
  - 정적 분석에서 예상한 20~40% 개선과 비슷한 범위의 결과를 확인했습니다.
  - DLRM workload에서 `Aerospike → NumPy → torch.from_numpy → inference`로 이어지는 zero-copy chain을 구성할 수 있습니다.
  - dict path 사용자는 Mapping protocol 덕분에 기존 code를 그대로 사용할 수 있습니다.
- **단점**:
  - `batch_read`의 반환 type이 dict 또는 `NumpyBatchRecords`에서 `LazyBatchRecords`로 바뀌고 `_dtype=` keyword가 제거됩니다.
  - 1.0.0 GA 전 migration이 필요합니다. 다만 현재 version이 0.10.x이므로 SemVer상 허용되는 범위입니다.
  - `_dtype=`를 사용하는 integration test 47곳과 dict-style 사용 위치 13곳을 옮겨야 했으며, PR #374에서 모두 처리했습니다.
- **선택 사유**: 측정 결과가 충분한 개선 효과를 보여 주었고, 1.0.0 GA 전에 API를 일관되게 정리할 수 있습니다. 또한 PyO3 0.28의 raw memory write와 `py.detach()`를 결합하면 일반 GIL build에서도 conversion 구간을 GIL 없이 실행할 수 있음을 확인했습니다.

## 결과 (Consequences)

### 긍정적 결과

1. **최적화 상한을 수치로 확인했습니다.** 세 가지 측정 방법이 `batch_to_dict_py`의 비중을 0.24~0.32%로 추정했습니다. PR #374에서는 B7이 RPS를 13~43% 개선했습니다. 이후 성능 작업은 이 수치를 기준으로 우선순위를 정할 수 있습니다.
2. **conversion 구간에서만 GIL을 해제하는 pattern을 마련했습니다.** `py.detach()`와 raw memory write를 결합한 방식은 PyO3 free-threaded build와 별개로 적용할 수 있으며, 향후 `batch_write_numpy` 같은 path에도 검토할 수 있습니다.
3. **stage timing을 production에서도 사용할 수 있습니다.** `AEROSPIKE_PY_INTERNAL_METRICS=1`과 Prometheus `/metrics`로 실제 workload의 hot path를 sampling profiler 없이 관찰할 수 있습니다.
4. **NumPy path의 효과를 정량화했습니다.** [ADR-0047](./2026-04-07-numpy-batch-memory-model.md)의 Owned Arrays model과 PR #374의 `py.detach()`를 결합했을 때 DLRM 시나리오에서 RPS가 13~43% 높아졌습니다.
5. **PyO3 free-threaded의 locking 비용을 측정했습니다.** PyO3 0.28의 critical-section locking으로 `PyDict::set_item` time이 28.7% 늘었습니다. 이 결과는 PyO3와 CPython 3.14t/3.15t 도입 지침을 작성할 때 참고할 수 있습니다.
6. **macOS arm64 profiling 제약을 기록했습니다.** Tachyon은 `sudo`가 필요하고, `py-spy --native`는 지원되지 않으며, QEMU emulation으로도 우회할 수 없었습니다. 이후 native profiling은 arm64 Linux container를 기본 환경으로 사용합니다.

### 부정적 결과 / 리스크

1. **API migration이 필요합니다.** PR #374는 `batch_read` 반환 type을 변경하고 `_dtype=` keyword를 제거합니다. Mapping protocol 덕분에 일반적인 dict-style code는 그대로 동작하지만, type annotation이나 reflection에 의존하는 code는 영향을 받을 수 있습니다. 1.0.0 GA migration guide에 이 내용을 포함해야 합니다.
2. **`LazyBatchRecords`라는 새 사용 model을 익혀야 합니다.** 사용자는 필요에 따라 `.to_dict()` 또는 `.to_numpy(dtype)`로 materialize해야 합니다. 이 동작을 API reference와 예제에서 분명히 설명해야 합니다.
3. **uvicorn multi-worker 결과는 추가 검증이 필요합니다.** macOS에서 `uvicorn --workers N`과 oha keep-alive를 함께 사용했을 때 측정 문제가 발생했습니다. 1.0.0 GA 전에 Linux에서 다시 측정해야 합니다.
4. **효과가 작은 미세 최적화는 GA 범위에서 제외됩니다.** B3/B4/B5/B6을 제외한 근거와 benchmark 재현 방법을 공개해 이후의 제안도 같은 기준으로 평가할 수 있게 합니다.
5. **B9 lifecycle 최적화는 1.0.x로 미룹니다.** 예상 RPS 개선 폭은 2~5%이지만 구조 변경과 memory-safety 검토가 먼저 필요합니다.
6. **profiling build의 크기가 52 MB로 늘어납니다.** `[profile.release] debug = 2`와 `strip = "none"`은 측정할 때만 사용합니다. Release wheel은 `debug = 1`을 유지하고, profiling 설정은 별도 profile 또는 build flag로 분리합니다.

### 운영 가이드 (1.0.0 GA 동반 문서)

PR #374를 적용한 뒤에는 workload에 따라 다음 pattern을 권장합니다.

- **DLRM / data science / PyTorch CPU inference 워크로드 (최우선)**:
  ```python
  handle = await client.batch_read(keys)
  arr = handle.to_numpy(dtype=dlrm_dtype)  # GIL-released raw memory write
  tensor = torch.from_numpy(arr)            # zero-copy
  output = model(tensor)
  ```
  측정한 DLRM workload에서는 dict path보다 RPS가 13~43% 높았고, `conv_ms`는 2.88배, `inference_ms`는 1.74배 빨랐습니다.

- **기존 dict-style 코드 (마이그레이션 없이 동작)**:
  ```python
  handle = await client.batch_read(keys)
  for user_key, bins in handle.items():     # Mapping 프로토콜
      process(bins)
  ```
  `LazyBatchRecords.__getitem__`, `items()` 등의 Mapping method는 lazy하게 생성하고 cache한 `.to_dict()` view를 사용합니다.

- **처리량이 큰 HTTP service(RPS 1,000 이상)**: CPU core 수에 맞춰 uvicorn `--workers N`을 사용합니다. 측정 환경의 single worker는 concurrency 200의 plain workload에서 1,361 RPS에 도달한 뒤 포화됐습니다.

- **CPU-bound 작업과 I/O가 섞인 workload**: Python 3.15t no-GIL build와 `ThreadPoolExecutor` offload를 함께 고려합니다. Plain workload에서는 차이가 없었지만 concurrency 100의 threaded scenario에서는 RPS가 56.7% 높았습니다.

- **production hot path monitoring**: `set_internal_stage_metrics_enabled(True)`를 켜고 Prometheus로 scrape합니다. `db_client_internal_stage_seconds_*` histogram에서 stage별 timing을 확인할 수 있습니다.

## 검증 (Validation)

다음 산출물과 절차를 사용해 이 ADR의 측정 결과를 재현할 수 있습니다.

| 산출물 | 위치 | 내용 |
|---|---|---|
| PR #374 | `aerospike-py#374` | LazyBatchRecords + `to_numpy(dtype)` GIL-detach 구현 + load test 보고서 |
| PR #374 load test 보고서 | `benchmark/results/gil-detach-zerocopy-loadtest.md` | DICT vs NUMPY RPS/p50, transparency appendix |
| `goal.md` | `aerospike-py/.claude/worktrees/bench-plan/` | 8 cycle 측정 history |
| `analysis.md` | 같은 directory | 정적 분석과 측정 결과에 따른 수정 |
| `further_improvements.md` | 같은 directory | B4~B8 후보 분석 |
| `stage_timing_report.md` | 같은 directory | Rust `tracing` 측정 결과 |
| `amd64_profiling_report.md` | 같은 directory | arm64 container의 `py-spy --native` 측정 결과 |
| `results-nosudo/scenarios_summary.csv` | 같은 directory | 44회 측정의 전체 CSV |
| `results-nosudo/pyspy/metrics_*.txt` | 같은 directory | Prometheus raw snapshot |
| `results-nosudo/pyspy/arm64/*.svg` | 같은 directory | symbol이 포함된 py-spy flamegraph |

PR #374를 적용한 뒤 다음 순서로 재현합니다.
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
