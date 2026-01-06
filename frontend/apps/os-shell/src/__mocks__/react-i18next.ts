const reactI18next = jest.createMockFromModule('react-i18next');

const translations: Record<string, string> = {
  // Start Menu
  'startMenu.search.ariaLabel': 'Search apps and files',
  'startMenu.search.placeholder': 'Search apps, files, and settings...',
  'startMenu.sections.pinned': 'Pinned',
  'startMenu.sections.recent': 'Recent',
  'startMenu.sections.allApps': 'All apps',
  'startMenu.sections.searchResults': 'Search Results',
  'startMenu.noAppsFound': 'No apps found',
  'startMenu.shortcuts': 'Keyboard Shortcuts',
  'startMenu.settings': 'Settings',
  'startMenu.userProfile.ariaLabel': 'User Profile',
  'startMenu.userProfile.role': 'Assessor',
  'startMenu.userProfile.location': 'Benton County',
  'startMenu.power.lock': 'Lock',
  'startMenu.power.signOut': 'Sign Out',
  'startMenu.power.restart': 'Restart',
  'startMenu.power.shutDown': 'Shut Down',

  // Taskbar
  'taskbar.startMenu': 'Start Menu',
  'taskbar.taskView': 'Task View',
  'taskbar.widgets': 'Widgets',
  'taskbar.chat': 'Chat',
  'taskbar.runningApps': 'Running Apps',
  'taskbar.systemTray': 'System Tray',
  'taskbar.ariaLabel': 'Taskbar',

  // Window Peek
  'windowPeek.close': 'Close',

  // System Health
  'systemHealth.title': 'System Health',
  'systemHealth.ariaLabel': 'System Health',
  'systemHealth.status.healthy': 'Healthy',
  'systemHealth.status.connected': 'Connected',
  'systemHealth.cpu': 'CPU',
  'systemHealth.memory': 'Memory',
  'systemHealth.network': 'Network',
  'systemHealth.storage': 'Storage',
  'systemHealth.uptime': 'Uptime',
  'systemHealth.cores': 'cores',
  'systemHealth.closePanel': 'Close Panel',

  // Virtual Desktops
  'virtualDesktops.title': 'Virtual Desktops',
  'virtualDesktops.switchTo': 'Switch to {{name}}',
  'virtualDesktops.new': 'New Desktop',
  'virtualDesktops.remove': 'Remove Desktop',
  'virtualDesktops.close': 'Close',

  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
};

const useTranslation = () => {
  return {
    t: (str: string) => translations[str] || str,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  };
};

module.exports = {
  ...reactI18next,
  useTranslation,
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
};
