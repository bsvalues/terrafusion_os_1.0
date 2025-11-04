// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  developerSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['intro', 'setup', 'architecture'],
    },
    {
      type: 'category',
      label: 'Core Packages',
      items: [
        'core-packages/core-models',
        'core-packages/plugin-loader',
        'core-packages/ui-components',
        'core-packages/geo-api',
      ],
    },
    {
      type: 'category',
      label: 'Plugin Development',
      items: [
        'plugins/creating-plugins',
        'plugins/plugin-api',
        'plugins/payment-integration',
        'plugins/deployment',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: ['api/rest-api', 'api/websocket-api', 'api/geo-api'],
    },
    {
      type: 'category',
      label: 'Contributing',
      items: ['contributing/guidelines', 'contributing/code-style', 'contributing/testing'],
    },
  ],
};

module.exports = sidebars;
