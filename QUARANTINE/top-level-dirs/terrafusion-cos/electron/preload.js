const { contextBridge, ipcRenderer } = require('electron');

// Allowed IPC channels for explicit APIs
const ALLOWED_INVOKES = new Set([
  'get-system-status',
  'api-call',
  'costforge-valuation',
  'terraflow-workflow',
  'terrafusion-sync'
]);

const ALLOWED_SENDS = new Set([
  'navigate-to',
  'window-control'
]);

// Strongly-typed API exposed to renderer. Prefer these named methods instead of generic invoke/send.
contextBridge.exposeInMainWorld('electronAPI', {
  // Queries
  getSystemStatus: () => ipcRenderer.invoke('get-system-status'),

  // Generic API call helper: { endpoint, method, data }
  apiCall: (payload) => ipcRenderer.invoke('api-call', payload),

  // CostForge valuation (POST)
  costforgeValuation: (propertyData) => ipcRenderer.invoke('costforge-valuation', propertyData),

  // TerraFlow workflow runner
  terraflowWorkflow: (workflowData) => ipcRenderer.invoke('terraflow-workflow', workflowData),

  // TerraFusion sync
  terrafusionSync: (syncData) => ipcRenderer.invoke('terrafusion-sync', syncData),

  // Navigation helper (one-way)
  navigateTo: (route) => ipcRenderer.send('navigate-to', route),

  // Window controls
  windowControl: (action) => ipcRenderer.send('window-control', action),

  // Subscribe to navigation events from main
  onNavigate: (cb) => {
    ipcRenderer.on('navigate-to', (event, route) => {
      try { cb(route); } catch (e) { /* swallow renderer callback errors */ }
    });
  },

  // Deprecated generic accessors (kept for backward compatibility but restricted)
  invoke: (channel, ...args) => {
    if (!ALLOWED_INVOKES.has(channel)) {
      throw new Error(`Forbidden ipc invoke channel: ${channel}`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  send: (channel, ...args) => {
    if (!ALLOWED_SENDS.has(channel)) {
      throw new Error(`Forbidden ipc send channel: ${channel}`);
    }
    return ipcRenderer.send(channel, ...args);
  },
  // Provide a limited on() for navigation only
  on: (channel, cb) => {
    if (channel !== 'navigate-to') throw new Error('Only "navigate-to" subscription is allowed');
    ipcRenderer.on(channel, (event, ...args) => { try { cb(...args); } catch (e) { } });
  }
});
