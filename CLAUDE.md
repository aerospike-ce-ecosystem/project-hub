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

## 컨벤션

- Podman 용어 사용 (Docker 대신)
- 문서 수정 후 반드시 `npm run build`로 깨진 링크 확인
- 한국어 기본, 기술 용어는 영어 유지
