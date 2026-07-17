# Aerospike CE Ecosystem — Project Hub

Aerospike Community Edition(CE) 에코시스템의 프로젝트 문서를 한곳에 모은 허브입니다.

여러 레포에 걸친 이슈와 아키텍처 결정 기록(ADR), 릴리스 이력, 로드맵을 관리합니다.

**Docs**: [aerospike-ce-ecosystem.github.io/project-hub](https://aerospike-ce-ecosystem.github.io/project-hub/)

## Core Repositories

| Project | Description | Docs |
|---------|-------------|------|
| [aerospike-py](https://github.com/aerospike-ce-ecosystem/aerospike-py) | Rust/PyO3로 구현한 고성능 Python 클라이언트 | [Docs](https://aerospike-ce-ecosystem.github.io/aerospike-py/) |
| [ACKO](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator) | Aerospike CE Kubernetes Operator | [Docs](https://aerospike-ce-ecosystem.github.io/aerospike-ce-kubernetes-operator/) |
| [Cluster Manager](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager) | FastAPI와 Next.js로 구현한 웹 기반 클러스터 관리 UI | — |
| [ackoctl](https://github.com/aerospike-ce-ecosystem/ackoctl) | Aerospike Cluster Manager CLI | — |
| [Plugins](https://github.com/aerospike-ce-ecosystem/aerospike-ce-ecosystem-plugins) | Claude Code 플러그인 | — |

## Structure

```
docs/docs/
├── architecture/    # 시스템 아키텍처 + ADR
├── roadmap/         # 분기별 로드맵, 마일스톤
├── history/         # Changelog, 의사결정 로그, 릴리스 매트릭스
├── coordination/    # 공유 라벨, Agentic Workflow, 리뷰 프로세스
└── goals/           # 프로젝트 목표
```

## Latest ADR

- [ADR-0052: aerospike-py batch_read 병목 프로파일링 — 3-Methodology Cross-Validation + LazyBatchRecords/to_numpy GIL-detach 검증](docs/docs/architecture/adr/2026-05-23-aerospike-py-batch-read-profiling.md)

## Development

```bash
cd docs
npm ci
npm start        # 로컬 개발 서버
npm run build    # 프로덕션 빌드
```

## License

Apache License 2.0
