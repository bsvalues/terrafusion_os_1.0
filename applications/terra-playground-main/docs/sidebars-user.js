// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  userSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['intro', 'dashboard-overview', 'user-interface'],
    },
    {
      type: 'category',
      label: 'GIS Features',
      items: ['gis/map-navigation', 'gis/layers', 'gis/property-search'],
    },
    {
      type: 'category',
      label: 'Property Assessment',
      items: ['property/viewing-properties', 'property/assessment-tools', 'property/reports'],
    },
    {
      type: 'category',
      label: 'Advanced Features',
      items: ['advanced/data-analysis', 'advanced/ai-tools', 'advanced/integrations'],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: ['troubleshooting/common-issues', 'troubleshooting/faq'],
    },
  ],
};

module.exports = sidebars;
