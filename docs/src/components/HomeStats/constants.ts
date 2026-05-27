// Shared palette + repo label mapping for the home stats panel.
// Tones picked to read well on both light and dark Docusaurus themes.

export const REPO_COLORS: Record<string, string> = {
  'aerospike-py':                     '#e11d48', // rose-600
  'aerospike-cluster-manager':        '#2563eb', // blue-600
  'aerospike-ce-kubernetes-operator': '#059669', // emerald-600
  'ackoctl':                          '#d97706', // amber-600
  'project-hub':                      '#7c3aed', // violet-600
  'aerospike-ce-ecosystem-plugins':   '#0891b2', // cyan-600
  'workspace':                        '#475569', // slate-600
  '.github':                          '#a16207', // yellow-700
  'aerospike-ce-ui-kit':              '#be185d', // pink-700
  'aerospike-py-performance-report':  '#0e7490', // cyan-700
  'homebrew-tap':                     '#854d0e', // yellow-800
};

export const REPO_SHORT: Record<string, string> = {
  'aerospike-py':                     'aerospike-py',
  'aerospike-cluster-manager':        'cluster-manager',
  'aerospike-ce-kubernetes-operator': 'ACKO',
  'ackoctl':                          'ackoctl',
  'project-hub':                      'project-hub',
  'aerospike-ce-ecosystem-plugins':   'plugins',
  'workspace':                        'workspace',
  '.github':                          '.github',
  'aerospike-ce-ui-kit':              'ui-kit',
  'aerospike-py-performance-report':  'perf-report',
  'homebrew-tap':                     'homebrew-tap',
};

export function repoColor(repo: string): string {
  return REPO_COLORS[repo] ?? '#64748b';
}

export function repoLabel(repo: string): string {
  return REPO_SHORT[repo] ?? repo;
}
