// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  adminSidebar: [
    {
      type: 'category',
      label: 'Administration',
      items: ['intro', 'installation', 'configuration'],
    },
    {
      type: 'category',
      label: 'User Management',
      items: ['user-management/overview', 'user-management/roles', 'user-management/permissions'],
    },
    {
      type: 'category',
      label: 'System Configuration',
      items: ['system-config/settings', 'system-config/plugins', 'system-config/integrations'],
    },
    {
      type: 'category',
      label: 'Maintenance',
      items: ['maintenance/backups', 'maintenance/updates', 'maintenance/monitoring'],
    },
  ],
};

module.exports = sidebars;
