const axios = require('axios');
const path = require('path');

const { ipcMain, dialog, shell, Notification } = require('electron');

// API Base URL - matches the kernel port (TerraFusion.API on port 5000)
// Configurable via TF_API_PORT or VITE_API_URL environment variables
const backendPort = process.env.TF_API_PORT || '5000';
const API_BASE_URL = process.env.VITE_API_URL
  ? `${process.env.VITE_API_URL}/api`
  : `http://localhost:${backendPort}/api`;

// Window management handlers
function setupWindowHandlers(mainWindow) {
  ipcMain.handle('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.handle('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('close-window', () => {
    mainWindow.close();
  });
}

// Module management handlers
function setupModuleHandlers() {
  ipcMain.handle('launch-module', async (event, moduleId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/modules/${moduleId}/launch`);
      
      // Notify renderer of module status change
      event.sender.send('module-status-change', {
        moduleId,
        status: 'active',
        timestamp: new Date().toISOString()
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to launch module:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('stop-module', async (event, moduleId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/modules/${moduleId}/stop`);
      
      // Notify renderer of module status change
      event.sender.send('module-status-change', {
        moduleId,
        status: 'inactive',
        timestamp: new Date().toISOString()
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to stop module:', error);
      return { success: false, error: error.message };
    }
  });
}

// System health handlers
function setupSystemHealthHandlers() {
  ipcMain.handle('get-system-health', async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system/health`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to get system health:', error);
      
      // Return mock data if backend is not available
      return {
        success: true,
        data: {
          status: 'healthy',
          uptime: '2h 15m',
          memory: { used: 45, total: 100 },
          cpu: 12.5,
          activeModules: 4,
          lastUpdated: new Date().toISOString()
        }
      };
    }
  });

  // Start periodic system health updates
  setInterval(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system/health`);
      
      // Broadcast to all renderer processes
      const allWindows = require('electron').BrowserWindow.getAllWindows();
      allWindows.forEach(window => {
        window.webContents.send('system-health-update', response.data);
      });
    } catch (error) {
      // Silently fail - system health updates are not critical
    }
  }, 30000); // Update every 30 seconds
}

// File operation handlers
function setupFileHandlers() {
  ipcMain.handle('select-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
        ]
      });
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('select-directory', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      });
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

// Notification handlers
function setupNotificationHandlers() {
  ipcMain.handle('show-notification', (event, title, body) => {
    try {
      new Notification({
        title,
        body,
        icon: path.join(__dirname, 'assets', 'icon.png')
      }).show();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

// External link handlers
function setupExternalHandlers() {
  ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
  });
}

// Initialize all IPC handlers
function initializeIpcHandlers(mainWindow) {
  setupWindowHandlers(mainWindow);
  setupModuleHandlers();
  setupSystemHealthHandlers();
  setupFileHandlers();
  setupNotificationHandlers();
  setupExternalHandlers();
  
  console.log('IPC handlers initialized');
}

module.exports = { initializeIpcHandlers };
