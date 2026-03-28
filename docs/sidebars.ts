import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
        'architecture/component-diagram',
        'architecture/deployment-topology',
        'architecture/interactive-diagrams',
        {
          type: 'category',
          label: 'ADR',
          items: [
            'architecture/adr/index',
            'architecture/adr/pyo3-over-cffi',
            'architecture/adr/kubebuilder-v4',
            'architecture/adr/podman-over-docker',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Roadmap',
      items: [
        'roadmap/current',
        {
          type: 'category',
          label: 'Milestones',
          items: ['roadmap/milestones/Q1'],
        },
      ],
    },
    {
      type: 'category',
      label: 'History',
      items: [
        {
          type: 'category',
          label: 'Changelog',
          items: [
            'history/changelog/aerospike-py',
            'history/changelog/acko',
            'history/changelog/cluster-manager',
            'history/changelog/plugins',
          ],
        },
        {
          type: 'category',
          label: 'Decisions',
          items: ['history/decisions/2026-03'],
        },
        {
          type: 'category',
          label: 'Releases',
          items: ['history/releases/release-matrix'],
        },
        {
          type: 'category',
          label: 'PR History',
          collapsed: true,
          items: [
            {
              type: 'category',
              label: 'aerospike-py',
              items: [
                'history/pr-history/aerospike-py/pr-014-cdt-expression-async',
                'history/pr-history/aerospike-py/pr-052-apache-relicense',
                'history/pr-history/aerospike-py/pr-054-benchmark-report',
                'history/pr-history/aerospike-py/pr-062-code-quality',
                'history/pr-history/aerospike-py/pr-103-structured-logging',
                'history/pr-history/aerospike-py/pr-104-prometheus-metrics',
                'history/pr-history/aerospike-py/pr-105-opentelemetry-tracing',
                'history/pr-history/aerospike-py/pr-114-info-all',
                'history/pr-history/aerospike-py/pr-120-docstrings-docusaurus',
                'history/pr-history/aerospike-py/pr-127-namedtuple-type-system',
                'history/pr-history/aerospike-py/pr-139-batch-write-numpy',
                'history/pr-history/aerospike-py/pr-156-ci-numpy-safety',
                'history/pr-history/aerospike-py/pr-165-double-gil-elimination',
                'history/pr-history/aerospike-py/pr-180-project-restructure',
                'history/pr-history/aerospike-py/pr-187-refactor-client-ops',
                'history/pr-history/aerospike-py/pr-205-batch-record-namedtuple',
                'history/pr-history/aerospike-py/pr-213-backpressure',
                'history/pr-history/aerospike-py/pr-232-consolidated-improvements',
                'history/pr-history/aerospike-py/pr-239-batch-records-api',
              ],
            },
            {
              type: 'category',
              label: 'ACKO',
              items: [
                'history/pr-history/acko/pr-150-template-description',
                'history/pr-history/acko/pr-155-pdb-selector-drift',
                'history/pr-history/acko/pr-158-unified-docker-image',
                'history/pr-history/acko/pr-160-operator-resilience',
                'history/pr-history/acko/pr-163-cluster-scoped-template',
                'history/pr-history/acko/pr-164-data-safety-secret-watch',
                'history/pr-history/acko/pr-180-migration-status',
                'history/pr-history/acko/pr-183-operator-stability',
                'history/pr-history/acko/pr-193-priority-class-name',
                'history/pr-history/acko/pr-202-metric-labels-fix',
              ],
            },
            {
              type: 'category',
              label: 'Cluster Manager',
              items: [
                'history/pr-history/cluster-manager/pr-079-wizard-compress',
                'history/pr-history/cluster-manager/pr-082-comprehensive-improvements',
                'history/pr-history/cluster-manager/pr-086-event-timeline-config-drift',
                'history/pr-history/cluster-manager/pr-107-k8s-operator-integration',
                'history/pr-history/cluster-manager/pr-114-migration-status-ui',
                'history/pr-history/cluster-manager/pr-122-health-monitoring',
                'history/pr-history/cluster-manager/pr-123-project-refactor',
                'history/pr-history/cluster-manager/pr-131-unified-cluster-list',
                'history/pr-history/cluster-manager/pr-134-pvc-export-import',
                'history/pr-history/cluster-manager/pr-138-config-diff-viewer',
                'history/pr-history/cluster-manager/pr-141-cluster-clone',
                'history/pr-history/cluster-manager/pr-143-split-brain-detection',
                'history/pr-history/cluster-manager/pr-144-operator-ui-bridge',
                'history/pr-history/cluster-manager/pr-152-oom-prevention',
                'history/pr-history/cluster-manager/pr-153-drop-daisyui-overhaul',
              ],
            },
            {
              type: 'category',
              label: 'Plugins',
              items: [
                'history/pr-history/plugins/pr-001-sync-skills-march',
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Coordination',
      items: [
        'coordination/labels',
        'coordination/agentic-workflow',
        'coordination/review-process',
      ],
    },
    {
      type: 'category',
      label: 'Goals',
      items: [
        'goals/project-goals',
        'goals/project-design',
        'goals/project-timeline',
      ],
    },
  ],
};

export default sidebars;
