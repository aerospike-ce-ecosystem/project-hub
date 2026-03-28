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
      items: ['goals/project-goals'],
    },
  ],
};

export default sidebars;
