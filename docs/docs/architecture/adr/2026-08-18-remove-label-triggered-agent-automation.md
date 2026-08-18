---
title: "ADR-0053: 라벨 트리거 에이전트 자동화 제거"
description: 이슈 코멘트에서 읽은 plan을 조직 PAT로 실행하던 label-triggered 에이전트 자동화(hub-issue-planner, hub-issue-dispatcher, agent-implement, issue-planner, pr-reviewer)를 제거한 결정과 근거.
sidebar_position: 53
scope: ecosystem
repos: [aerospike-py, acko, cluster-manager, plugins, project-hub]
tags: [adr, ci, automation, security, issueops, supersedes]
last_updated: 2026-08-18
---

# ADR-0053: 라벨 트리거 에이전트 자동화 제거

## 상태

**Accepted**

- 제안일: 2026-08-18
- 승인일: 2026-08-18
- 보완일: 2026-08-18 — 필수 후속 조치(PAT 로테이션)와 잔여 위험(`daily-release.yml`) 추가
- 관련 이슈: [aerospike-ce-ecosystem/project-hub#158](https://github.com/aerospike-ce-ecosystem/project-hub/issues/158), [#169](https://github.com/aerospike-ce-ecosystem/project-hub/issues/169)
- 대체 대상: ADR-0008, ADR-0049, ADR-0043(일부), ADR-0039(일부)

## 맥락 (Context)

에코시스템은 label로 구동되는 Plan → Implement → Review 파이프라인을 운영해 왔습니다.

- project-hub: `hub-issue-planner.yml`, `hub-issue-dispatcher.yml`
- 네 개 core repo(aerospike-py, ACKO, cluster-manager, plugins): `issue-planner.yml`, `agent-implement.yml`, `pr-reviewer.yml`

### 문제 상황

이 파이프라인은 **plan을 issue 코멘트 본문에서 읽어 실행**합니다. Plan을 찾는 유일한 기준은 HTML marker 문자열이며, 코멘트 작성자에 대한 검사가 전혀 없습니다.

`hub-issue-dispatcher.yml`이 삭제 직전까지 사용하던 조회식은 다음과 같았습니다(`:55`).

```jq
[.[] | select(.body | contains("<!-- agent-plan-start -->"))] | last | .body // empty
```

- **작성자 검사 없음**: 삭제 직전 기준으로 `grep -c "author_association"`가 project-hub의 두 workflow 모두에서 `0`이었고, 네 core repo의 `agent-implement.yml`에서도 `0`이었습니다. 즉 public issue에 코멘트를 남길 수 있는 **누구나** marker가 포함된 "plan"을 심을 수 있고, 파이프라인은 그 코멘트를 마지막(`last`) 것부터 우선 채택했습니다.
- **실행 권한**: 실행 단계는 조직 전역 PAT인 `secrets.GH_AW_GITHUB_TOKEN`을 사용합니다. Core repo의 구현 job은 여기에 더해 `--dangerously-skip-permissions`로 실행되어 도구 수준의 게이트도 없었습니다.
- **주입 표면**: `${{ github.event.issue.title }}`이 프롬프트 본문에 그대로 보간되는 지점이 project-hub에만 6곳(`hub-issue-planner.yml:5,53,300,417,549`, `hub-issue-dispatcher.yml:4`) 있었습니다. 공격자가 제어하는 문자열이 지시문 안에 놓입니다.

:::danger PAT를 쓰는 workflow에서 `permissions:` 블록은 장식입니다

이 ADR에서 일반화할 가치가 가장 큰 교훈입니다.

Workflow의 `permissions:` 스탠자는 **GitHub이 실행마다 자동 발급하는 `GITHUB_TOKEN`에만** 적용됩니다. Step이 `secrets.<PAT>`를 넘기는 순간, 그 step의 권한은 PAT 소유자의 권한이며 `permissions:` 선언과 아무 관계가 없습니다.

따라서 삭제된 workflow들이 선언한 `contents: write` / `pull-requests: write`는 실제 권한 범위를 **축소해서** 보여 주고 있었습니다. 리뷰어가 그 블록을 보고 "이 job은 이 repo의 contents까지만 건드릴 수 있다"고 읽었다면 틀린 것입니다.

**리뷰 규칙으로 삼을 것**: workflow에 `secrets.` 로 시작하는 토큰이 step에 전달되면, 그 workflow의 `permissions:` 블록은 권한 상한의 근거가 되지 못합니다. 상한은 그 credential 자체의 scope이며, 별도로 확인해야 합니다.
:::

### 위협 모델을 정확히

트리거 자체는 인증되지 않은 원격 코드 실행이 아닙니다. 두 workflow 모두 `on: issues: [labeled]`이고, GitHub에서 label을 붙이려면 해당 repository에 **write 권한이 필요**합니다. 따라서 외부인이 단독으로 파이프라인을 발화시킬 수는 없습니다.

실제 위험은 **권한 분리의 붕괴**입니다. 외부인이 plan 본문을 심고, 그 사실을 모르는 maintainer가 정상 절차대로 `plan-complete` 또는 `start-implement` label을 붙이면, 외부인이 작성한 지시문이 조직 전역 PAT 권한으로 실행됩니다. Plan 코멘트는 정상 plan과 형식이 같아서 육안 구분이 어렵고, 대상 `main` 브랜치에는 required status check가 없어 그 결과로 만들어진 PR도 자동 게이트를 통과하지 못합니다. 즉 **maintainer의 label 한 번이 신뢰 경계 전체를 대신 넘어 주는 구조**입니다.

## 결정 (Decision)

> **label로 구동되는 에이전트 자동화 전체를 제거한다. Plan을 issue 코멘트에서 읽어 실행하는 workflow는 어느 repository에도 두지 않는다.**

### 삭제 대상

| Repo | 삭제한 파일 |
|------|------------|
| project-hub | `.github/workflows/hub-issue-planner.yml`, `.github/workflows/hub-issue-dispatcher.yml` |
| aerospike-py, ACKO, cluster-manager, plugins | `.github/workflows/agent-implement.yml`, `.github/workflows/issue-planner.yml`, `.github/workflows/pr-reviewer.yml` |

### 유지 대상

에이전트 실행과 무관한 workflow는 그대로 둡니다.

| Workflow | Repo | 유지 사유 |
|----------|------|----------|
| `hub-adr-status-override.yml` | project-hub | label → 이미 merge된 ADR 문서의 status 필드 갱신. Issue 코멘트를 plan으로 실행하지 않음 |
| `weekly-pr-stats.yml` | project-hub | 스케줄 기반 통계 수집 |
| `docs.yaml`, `docs-publish.yaml` | project-hub 외 | 문서 빌드/배포 |
| `daily-release.yml` | aerospike-py, ACKO, cluster-manager, ackoctl, plugins | Conventional Commits 기반 릴리스. Issue 입력 없음 |
| `skill-impact-notify.yml` | aerospike-py, ACKO | main 머지 시 project-hub에 알림 issue 생성. 감지·알림까지만 수행 |
| `ci.yaml`, `test.yml`, `lint.yml`, `docker-publish.yml`, `publish-chart.yml`, `test-e2e.yml` | 각 repo | 일반 CI/릴리스 |

### 대체 절차

자동화가 하던 일은 사람이 수행합니다.

1. **계획 수립**: Issue에 사람이 직접 계획을 작성합니다. Label은 분류·추적용으로만 사용합니다.
2. **구현**: 로컬 개발 환경(원한다면 Claude Code CLI 포함)에서 작업하고 평소처럼 PR을 올립니다. 이때 실행 권한은 개발자 본인의 자격 증명이며 조직 PAT가 아닙니다.
3. **cross-repo 전파**: `hub-issue-dispatcher.yml`이 만들던 하위 issue는 사람이 각 repo에 직접 생성하고 hub issue에 링크합니다. 의존성 순서는 ADR-0050을 따릅니다.
4. **리뷰**: `pr-reviewer.yml`의 자동 리뷰 루프 대신 사람이 리뷰합니다.

### 다시 도입한다면 (재도입 조건)

동일한 자동화를 되살릴 경우 최소한 다음을 모두 충족해야 합니다.

1. Plan 코멘트의 `author_association`이 `OWNER`, `MEMBER`, `COLLABORATOR` 중 하나인지 검사하고, 그 외 작성자의 코멘트는 무시합니다.
2. 조직 전역 PAT 대신 repo 범위로 제한된 GitHub App token을 사용해 `permissions:` 선언이 실제로 구속력을 갖게 합니다.
3. `--dangerously-skip-permissions` 대신 명시적 도구 allowlist를 사용합니다.
4. 공격자 제어 문자열(`issue.title`, `issue.body`, 코멘트 본문)은 `env:`로 전달해 데이터로 읽고, 프롬프트 템플릿에 직접 보간하지 않습니다. 기존 사례: `aerospike-py/.github/workflows/ace-plugins-pr-notify.yml:47-50`.
5. 대상 브랜치에 required status check를 걸어 자동 생성 PR도 게이트를 통과하게 합니다.

## 필수 후속 조치 (Required follow-up)

이 ADR의 삭제만으로 끝나지 않는 항목입니다. 추적 이슈: [project-hub#169](https://github.com/aerospike-ce-ecosystem/project-hub/issues/169). **담당은 조직 소유자이며, 이 ADR을 작성한 쪽에서 실행하지 않았습니다.**

### 1. `GH_AW_GITHUB_TOKEN` 로테이션

**사실관계를 정확히**: 조직 전역 PAT `GH_AW_GITHUB_TOKEN`은, 외부인이 작성할 수 있는 plan 텍스트를 실행하던 job의 환경 변수로 들어가 있었습니다.

- **악용된 증거는 없습니다.** 이 문서는 침해가 있었다고 주장하지 않으며, 그렇게 읽혀서도 안 됩니다.
- 다만 **"악용 증거 없음"은 "노출되지 않았음"과 다릅니다.** 해당 credential은 신뢰 경계 밖의 입력을 처리하는 실행 경로에 놓여 있었습니다.
- 로테이션 비용은 낮고, 위 두 문장 사이의 간극을 없애는 유일한 방법입니다. **로테이션을 권고합니다.**

**로테이션은 소비처와 함께 조율해야 합니다.** 새 값을 반영하지 않고 교체하면 5개 repo의 릴리스 파이프라인이 즉시 깨집니다. 삭제 시점(2026-08-18) `main` 기준으로 이 secret을 참조하는 곳은 다음과 같습니다.

| Repo | 파일:라인 | 깨지면 잃는 것 |
|------|----------|--------------|
| aerospike-py | `ace-plugins-pr-notify.yml:42` | plugins repo 후속 issue 생성 |
| aerospike-py | `daily-release.yml:87` | 릴리스 태그·노트 |
| aerospike-py | `skill-impact-notify.yml:25` | hub 알림 issue |
| ACKO | `daily-release.yml:112` | 릴리스 태그·노트 |
| ACKO | `skill-impact-notify.yml:24` | hub 알림 issue |
| cluster-manager | `daily-release.yml:79` | 릴리스 태그·노트 |
| plugins | `daily-release.yml:125` | 릴리스 태그·노트 |
| ackoctl | `daily-release.yml:16`, `:38` | 릴리스 태그 |
| ackoctl | `release.yml:31`, `:33` | goreleaser 바이너리 + Homebrew tap push |

`cluster-manager`의 `agent-implement.yml:28` / `issue-planner.yml:26` / `pr-reviewer.yml:32`,`:47`도 아직 이 secret을 참조하지만, 해당 파일들은 이 ADR에 따라 삭제 예정이므로 위 표에서 제외했습니다.

로테이션 시 조직 전역 PAT를 그대로 재발급하기보다, **repo 범위로 제한된 GitHub App installation token으로 교체**하는 편이 낫습니다. 그래야 각 workflow의 `permissions:` 선언이 실제로 구속력을 갖습니다(위 danger 박스 참조).

### 2. `--dangerously-skip-permissions`가 남아 있는 곳

이 정리는 `--dangerously-skip-permissions`를 조직에서 없애지 **못합니다.** 삭제 시점 `main` 기준으로 이 플래그는 `daily-release.yml`에도 있으며, 그 workflow는 유지 대상입니다.

| Repo | 파일:라인 |
|------|----------|
| aerospike-py | `daily-release.yml:146` |
| ACKO | `daily-release.yml:177` |
| cluster-manager | `daily-release.yml:144` |
| plugins | `daily-release.yml:187` |

(`ackoctl`의 `daily-release.yml`에는 이 플래그가 없습니다. 순수 bash + 태그 push 방식이라 agent를 실행하지 않습니다.)

**노출 정도를 과장하지 말 것.** 이 넷은 삭제된 workflow와 위험 수준이 전혀 다릅니다.

- 트리거가 **스케줄**입니다. Issue label이나 코멘트로 발화하지 않습니다.
- 입력이 **커밋 히스토리**입니다. 외부인이 임의로 써 넣을 수 있는 코멘트 본문이 아니라, 이미 머지된 커밋 메시지입니다.
- 따라서 이 ADR이 다룬 "외부인이 심은 지시문이 실행된다"는 경로는 여기에 **없습니다.**

**그래도 기록해 둡니다.** 이 ADR만 읽은 사람이 "조직 전역 PAT + 도구 게이트 없는 agent 실행"이라는 문제 유형이 완전히 사라졌다고 결론 내리면 사실과 다르기 때문입니다. 커밋 메시지도 PR을 올릴 수 있는 사람이 쓰는 텍스트이므로, 신뢰 경계가 "외부 누구나"에서 "write 권한 보유자"로 좁혀졌을 뿐입니다. 유지할지, 도구 allowlist로 바꿀지는 [#169](https://github.com/aerospike-ce-ecosystem/project-hub/issues/169)에서 판단합니다.

## 대안 (Alternatives Considered)

### Option A: 자동화 유지 + 작성자 검사 추가

- **설명**: `author_association` 게이트, GitHub App token, 도구 allowlist를 추가하고 파이프라인은 그대로 둡니다.
- **장점**: 자동화의 편익을 유지합니다.
- **미선택 사유**: 위 5개 조건을 6개 repository × 5개 workflow에 걸쳐 동시에 적용하고 이후에도 drift 없이 유지해야 합니다. ADR-0043이 이미 "copy-paste 복제로 인한 drift"를 이 스위트의 알려진 문제로 기록하고 있어, 보안 게이트를 그 drift에 맡기는 셈이 됩니다. 파이프라인의 실사용 빈도가 그 유지 비용을 정당화하지 못했습니다.

### Option B: hub만 남기고 core repo 자동화 제거

- **설명**: 계획 수립은 자동, 구현은 수동.
- **미선택 사유**: 취약점은 구현 단계가 아니라 **plan을 코멘트에서 읽는 지점**에 있습니다. Hub planner도 attacker-controlled title을 프롬프트에 보간하고 조직 PAT로 ADR 문서 PR을 만들므로, hub만 남겨도 문제가 남습니다.

### Option C: 즉시 비활성화만 하고 파일은 유지

- **설명**: `on:` 트리거를 `workflow_dispatch`로 바꿔 두고 파일은 남깁니다.
- **미선택 사유**: 취약한 실행 경로가 repository에 남고, 트리거 한 줄을 되돌리면 그대로 되살아납니다. 결정을 파일 삭제로 표현하고 재도입 조건을 ADR로 남기는 편이 명확합니다.

## 결과 (Consequences)

### 긍정적

- 외부인이 작성한 텍스트가 조직 전역 PAT 권한으로 실행되는 경로가 사라집니다.
- Prompt injection 표면 6곳(project-hub 기준)이 제거됩니다. Core repo까지 합치면 10곳입니다.
- Claude Code Action의 GitHub Actions 사용 비용이 감소합니다.
- 유지보수 대상 workflow 수가 줄어 ADR-0043이 지적한 drift 표면이 축소됩니다.

### 부정적

- Cross-repo issue 전파가 수동 작업이 됩니다. ADR-0039가 방지하려던 "skill 동기화 누락"이 다시 사람의 주의력에 의존하게 됩니다. `skill-impact-notify.yml`은 남으므로 **감지와 알림은 유지되고, 이후 dispatch만 수동**입니다.
- ADR proposal의 자동 리뷰·문서 생성이 사라져 ADR 작성이 수동 작업이 됩니다. `hub-adr-status-override.yml`은 남아 있어 status 갱신은 계속 자동입니다.
- 이 결정에 의존하던 문서 다수를 함께 갱신해야 합니다(본 PR에서 수행).
- **조직 전역 PAT는 여전히 살아 있고 여전히 광범위합니다.** 이 ADR은 그 PAT를 사용하던 실행 경로 중 위험한 것을 제거했을 뿐, credential 자체를 좁히지 않았습니다. "필수 후속 조치" 절 참조.

## 관련 ADR

- [ADR-0008: IssueOps 기반 CI 워크플로우](./2026-03-10-issueops-ci-workflow.md) — 이 ADR이 대체(Superseded). `issue-planner` / `agent-implement` / `pr-reviewer` 3종을 도입한 결정
- [ADR-0049: Project Hub ADR Lifecycle 자동화 아키텍처](./2026-04-07-adr-lifecycle-automation.md) — 이 ADR이 대체(Superseded). 3단계 중 Stage 1·2가 제거되고 Stage 3만 남음
- [ADR-0043: 에코시스템 통합 CI 워크플로우 스위트 표준화](./2026-04-07-ci-workflow-suite-standardization.md) — 부분 대체. 필수 워크플로우 세트에서 agent-implement / pr-reviewer / issue-planner가 빠지고 daily-release / skill-impact-notify는 유지
- [ADR-0039: Skill Impact Review 파이프라인](./2026-04-07-skill-impact-review-pipeline.md) — 부분 대체. 감지·알림(Tier 1·2 notify)은 유지, hub planner/dispatcher 경유 자동 dispatch는 제거
- [ADR-0050: 에코시스템 의존성 체인 및 Merge 순서 원칙](./2026-04-07-dependency-chain-merge-order.md) — 순서 원칙 자체는 유효하며, 집행 수단이 자동화에서 기여자 가이드로 바뀜
