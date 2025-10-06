const { contextBridge, ipcRenderer } = require('electron');

// TerraFusion cOS Desktop Shell Preload Script
// Exposes secure APIs to the frontend_engine

contextBridge.exposeInMainWorld('TerraFusionDesktop', {
  // TerraFusion cOS API
  api: (endpoint, data) => ipcRenderer.invoke('terrafusion-api', endpoint, data),
  
  // CostForge AI
  costforge: {
    valuation: (propertyData) => ipcRenderer.invoke('costforge-valuation', propertyData)
  },
  
  // AI Swarm
  aiSwarm: {
    getStatus: () => ipcRenderer.invoke('ai-swarm-status')
  },
  
  // TerraFusion Sync
  sync: {
    getStatus: () => ipcRenderer.invoke('terrafusion-sync-status')
  },
  
  // Desktop shell info
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron
});







