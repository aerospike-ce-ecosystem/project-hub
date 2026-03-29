# Project Hub

Aerospike CE Ecosystem의 중앙 프로젝트 관리 허브. 코드 없이 문서와 이슈 추적만 포함.

## 문서 탐색 가이드

이 레포의 모든 .md 파일은 풍부한 frontmatter를 갖고 있음.
문서 탐색 시 파일 전체를 읽지 말고, **frontmatter의 `description` 필드만 먼저 읽어서 관련성을 판단**할 것.
`repos` 필드로 특정 레포 관련 문서를 필터링할 수 있음.

### Frontmatter 필드

| 필드 | 용도 |
|------|------|
| `title` | 문서 제목 |
| `description` | 1-2문장 요약 — 이것만 읽고 관련성 판단 |
| `scope` | `ecosystem` (전체) 또는 `single-repo` (특정 레포) |
| `repos` | 관련 레포 목록 (aerospike-py, acko, cluster-manager, plugins) |
| `tags` | 키워드 목록 |
| `last_updated` | 최종 수정일 |

## 기술 스택

- **Docusaurus v3.9.2** (TypeScript config)
- **ReactFlow** 다이어그램 (`docs/src/components/diagrams/FlowDiagram`) — Mermaid보다 이것을 사용할 것
- **Mermaid** Gantt 차트 등 ReactFlow에 부적합한 경우에만 제한적 사용
- **GitHub Pages** 배포

## 빌드

```bash
cd docs && npm ci && npm run build
```

## 다이어그램 원칙

모든 ReactFlow 다이어그램은 **위: 사용자가 직접 사용하는 것 → 아래: 인프라** 계층 구조를 따를 것.

```
Y=0   ① User (개발자 / DevOps)
Y=1   ② 사용자 도구 (Agent, Cluster Manager, aerospike-py)
Y=2   ③ 인프라 관리 (ACKO, Plugin Skills)
Y=3   ④ 인프라 (Aerospike CE Cluster — K8s Pods / Bare Metal Nodes)
```

- 위에서 아래로 읽을 때 **사용자 → 도구 → 관리 → 인프라** 흐름이 자연스러워야 함
- 같은 계층의 노드는 같은 Y 좌표에 배치
- K8s 배포와 Bare Metal 배포는 좌우로 분리

## 컨벤션

- Podman 용어 사용 (Docker 대신)
- 문서 수정 후 반드시 `npm run build`로 깨진 링크 확인
- 한국어 기본, 기술 용어는 영어 유지
