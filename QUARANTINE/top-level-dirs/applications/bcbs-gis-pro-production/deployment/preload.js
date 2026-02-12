const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  checkServerStatus: () => ipcRenderer.invoke('check-server-status'),
  restartServer: () => ipcRenderer.invoke('restart-server'),
  openLogs: () => ipcRenderer.invoke('open-logs'),
  
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-project', callback);
    ipcRenderer.on('menu-open-project', callback);
    ipcRenderer.on('menu-save', callback);
    ipcRenderer.on('show-preferences', callback);
    ipcRenderer.on('show-system-status', callback);
    ipcRenderer.on('open-database-console', callback);
    ipcRenderer.on('check-updates', callback);
  },
  
  onDataAction: (callback) => {
    ipcRenderer.on('import-data', callback);
    ipcRenderer.on('export-data', callback);
    ipcRenderer.on('backup-data', callback);
  },
  
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('menu-new-project');
    ipcRenderer.removeAllListeners('menu-open-project');
    ipcRenderer.removeAllListeners('menu-save');
    ipcRenderer.removeAllListeners('show-preferences');
    ipcRenderer.removeAllListeners('show-system-status');
    ipcRenderer.removeAllListeners('open-database-console');
    ipcRenderer.removeAllListeners('check-updates');
    ipcRenderer.removeAllListeners('import-data');
    ipcRenderer.removeAllListeners('export-data');
    ipcRenderer.removeAllListeners('backup-data');
  }
});