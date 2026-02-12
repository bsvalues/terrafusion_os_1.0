// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Terrafusion Platform',
  tagline: 'Advanced Geospatial Intelligence for Property Assessment',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://terrafusion.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'bsvalues',
  projectName: 'terrafusion',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'src',
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/bsvalues/terrafusion/tree/main/docs/',
          include: ['**/*.md', '**/*.mdx'],
          exclude: [
            '**/_*.{js,jsx,ts,tsx,md,mdx}',
            '**/_*/**',
            '**/*.test.{js,jsx,ts,tsx}',
            '**/__tests__/**',
          ],
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'admin',
        path: 'src/admin',
        routeBasePath: 'admin',
        sidebarPath: require.resolve('./sidebars-admin.js'),
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'developer',
        path: 'src/developer',
        routeBasePath: 'dev',
        sidebarPath: require.resolve('./sidebars-developer.js'),
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'user',
        path: 'src/user',
        routeBasePath: 'user',
        sidebarPath: require.resolve('./sidebars-user.js'),
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/terrafusion-social-card.jpg',
      navbar: {
        title: 'Terrafusion',
        logo: {
          alt: 'Terrafusion Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            to: '/user',
            position: 'left',
            label: 'User Guide',
          },
          {
            to: '/dev',
            position: 'left',
            label: 'Developer Documentation',
          },
          {
            to: '/admin',
            position: 'left',
            label: 'Administrator Guide',
          },
          {
            href: 'https://github.com/bsvalues/terrafusion',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'User Guide',
                to: '/user',
              },
              {
                label: 'Developer Documentation',
                to: '/dev',
              },
              {
                label: 'Administrator Guide',
                to: '/admin',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/terrafusion',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/terrafusion',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/terrafusion',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/bsvalues/terrafusion',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Benton County and Contributors. Built with Docusaurus.`,
      },
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
      },
    }),
};

module.exports = config;
