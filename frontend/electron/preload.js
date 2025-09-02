const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // System operations
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Module operations
  launchModule: (moduleId) => ipcRenderer.invoke('launch-module', moduleId),
  stopModule: (moduleId) => ipcRenderer.invoke('stop-module', moduleId),
  
  // System health
  getSystemHealth: () => ipcRenderer.invoke('get-system-health'),
  
  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),

  // Event listeners
  onSystemHealthUpdate: (callback) => ipcRenderer.on('system-health-update', callback),
  onModuleStatusChange: (callback) => ipcRenderer.on('module-status-change', callback),
  // OS connection state
  getOSConnectionState: () => ipcRenderer.invoke('os:connection-state'),
  onOSConnectionState: (callback) => {
    const listener = (_evt, state) => callback(state);
    ipcRenderer.on('os:connection-state', listener);
    return () => ipcRenderer.removeListener('os:connection-state', listener);
  },
  // County configuration
  getCountyConfig: () => ipcRenderer.invoke('os:county-config'),

  // Auth envelope creation
  createAuthEnvelope: (countyId, legacySystem) => 
    ipcRenderer.invoke('create-auth-envelope', { countyId, legacySystem }),

  // Plugin messaging
  invokePlugin: (moduleName, method, payload) => 
    ipcRenderer.invoke('plugin-invoke', { moduleName, method, payload }),
  
  emitPlugin: (moduleName, event, data) => 
    ipcRenderer.send('plugin-emit', { moduleName, event, data }),

  // System monitoring
  getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
  
  // Backend API access
  getBackendUrl: () => ipcRenderer.invoke('os:backend-url'),

  // Utility
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

// Inject Terrafusion bridge directly into window object for PWA compatibility
contextBridge.exposeInMainWorld('terrafusion', {
  shell: {
    minimize: () => ipcRenderer.invoke('minimize-window'),
    maximize: () => ipcRenderer.invoke('maximize-window'), 
    close: () => ipcRenderer.invoke('close-window'),
    openExternal: (url) => {
      const { shell } = require('electron');
      shell.openExternal(url);
    }
  },
  api: {
    getPort: async () => {
      const url = await ipcRenderer.invoke('os:backend-url');
      const match = url.match(/:([0-9]+)/);
      return match ? parseInt(match[1]) : 5000;
    },
    getBaseUrl: () => ipcRenderer.invoke('os:backend-url')
  },
  isDesktop: true,
  platform: process.platform
});