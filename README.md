# Aerospike CE Ecosystem — Project Hub

Aerospike Community Edition 에코시스템의 중앙 프로젝트 관리 허브입니다.

크로스-레포 이슈 추적, 아키텍처 의사결정 기록(ADR), 릴리스 이력, 로드맵을 관리합니다.

**Docs**: [aerospike-ce-ecosystem.github.io/project-hub](https://aerospike-ce-ecosystem.github.io/project-hub/)

## Core Repositories

| Project | Description | Docs |
|---------|-------------|------|
| [aerospike-py](https://github.com/aerospike-ce-ecosystem/aerospike-py) | Rust(PyO3) 기반 고성능 Python 클라이언트 | [Docs](https://aerospike-ce-ecosystem.github.io/aerospike-py/) |
| [ACKO](https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator) | Aerospike CE Kubernetes Operator | [Docs](https://aerospike-ce-ecosystem.github.io/aerospike-ce-kubernetes-operator/) |
| [Cluster Manager](https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager) | 웹 기반 클러스터 관리 UI (FastAPI + Next.js) | — |
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

## Development

```bash
cd docs
npm ci
npm start        # 로컬 개발 서버
npm run build    # 프로덕션 빌드
```

## License

Apache License 2.0
