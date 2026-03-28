import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Aerospike CE Ecosystem',
  tagline: 'Cross-repo project management hub',
  favicon: 'img/favicon.svg',

  url: 'https://aerospike-ce-ecosystem.github.io',
  baseUrl: '/project-hub/',

  organizationName: 'aerospike-ce-ecosystem',
  projectName: 'project-hub',

  onBrokenLinks: 'throw',

  future: {v4: true},
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko'],
    localeConfigs: {
      en: {label: 'English'},
      ko: {label: '한국어'},
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/aerospike-ce-ecosystem/project-hub/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Ecosystem Hub',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/aerospike-ce-ecosystem',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Ecosystem',
          items: [
            {
              label: 'aerospike-py',
              href: 'https://aerospike-ce-ecosystem.github.io/aerospike-py/',
            },
            {
              label: 'ACKO',
              href: 'https://aerospike-ce-ecosystem.github.io/aerospike-ce-kubernetes-operator/',
            },
            {
              label: 'Cluster Manager',
              href: 'https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager',
            },
            {
              label: 'Plugins',
              href: 'https://github.com/aerospike-ce-ecosystem/aerospike-ce-ecosystem-plugins',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub Org',
              href: 'https://github.com/aerospike-ce-ecosystem',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Aerospike CE Ecosystem. Licensed under Apache 2.0.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'python', 'go', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
