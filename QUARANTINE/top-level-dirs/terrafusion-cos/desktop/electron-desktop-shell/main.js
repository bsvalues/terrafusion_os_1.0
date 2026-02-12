const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// TerraFusion cOS Desktop Shell
// Native desktop application using actual frontend_engine

let mainWindow;

function createWindow() {
  // Create the browser window with TerraFusion branding
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    title: 'TerraFusion cOS - Government Operating System',
    icon: path.join(__dirname, 'assets', 'terrafusion-icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // Don't show until ready
    backgroundColor: '#0f172a', // TerraFusion dark background
    titleBarStyle: 'default'
  });

  // Load the TerraFusion frontend_engine
  const frontendEnginePath = path.join(__dirname, '..', '..', 'frontend_engine');
  const indexPath = path.join(__dirname, '..', '..', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log('🚀 Loading TerraFusion cOS Frontend Engine...');
    mainWindow.loadFile(indexPath);
  } else {
    console.log('❌ TerraFusion frontend_engine not found, creating fallback...');
    mainWindow.loadURL('data:text/html,<h1>TerraFusion cOS</h1><p>Loading...</p>');
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('✅ TerraFusion cOS Desktop Shell loaded');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // TerraFusion cOS specific IPC handlers
  setupTerraFusionHandlers();
}

function setupTerraFusionHandlers() {
  // Handle TerraFusion cOS API calls
  ipcMain.handle('terrafusion-api', async (event, endpoint, data) => {
    try {
      const response = await fetch(`http://localhost:8090/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('TerraFusion API Error:', error);
      return { error: error.message };
    }
  });

  // Handle CostForge AI operations
  ipcMain.handle('costforge-valuation', async (event, propertyData) => {
    try {
      const response = await fetch('http://localhost:8090/api/costforge/valuation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData)
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  });

  // Handle AI Swarm operations
  ipcMain.handle('ai-swarm-status', async (event) => {
    try {
      const response = await fetch('http://localhost:8090/api/ai-swarm/status');
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  });

  // Handle TerraFusion Sync operations
  ipcMain.handle('terrafusion-sync-status', async (event) => {
    try {
      const response = await fetch('http://localhost:8090/api/sync/status');
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// TerraFusion cOS specific app metadata
app.setAppUserModelId('com.terrafusion.cos.desktop');







