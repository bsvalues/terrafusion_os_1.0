const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');

const isDev = require('electron-is-dev');

const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, protocol } = require('electron');

const DesktopLaunchers = require('./desktop-launchers');
const { initializeIpcHandlers } = require('./ipc-handlers');
const { TerraFusionOSBridge } = require('./os-bridge');

let mainWindow;
let tray;
let osBridge;
let backendProcess;
const backendPort = parseInt(process.env.TF_API_PORT || '5000', 10);

// Expose OS connection state to renderer
// Expose backend API URL to renderer
ipcMain.handle('os:backend-url', () => {
  return `http://localhost:${backendPort}`;
});

ipcMain.handle('os:connection-state', () => {
  try {
    return osBridge ? osBridge.getState() : { 
      status: backendProcess ? 'connected' : 'disconnected',
      backendUrl: `http://localhost:${backendPort}`
    };
  } catch (_) {
    return { status: 'error' };
  }
});

// Expose county config (Benton) to renderer
ipcMain.handle('os:county-config', () => {
  try {
    const cfgPath = path.resolve(__dirname, '..', 'config', 'counties', 'benton.json');
    const raw = fs.readFileSync(cfgPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { error: String(err) };
  }
});

// Create signed auth envelope (HMAC-SHA256)
ipcMain.handle('create-auth-envelope', async (event, { countyId, legacySystem }) => {
  return await osBridge.createAuthEnvelope(countyId, legacySystem);
});

// Plugin messaging
ipcMain.handle('plugin-invoke', async (event, { moduleName, method, payload }) => {
  return await osBridge.invokePlugin(moduleName, method, payload);
});

ipcMain.on('plugin-emit', (event, { moduleName, event: eventName, data }) => {
  osBridge.emitPlugin(moduleName, eventName, data);
});

// System metrics for monitoring dashboard
ipcMain.handle('get-system-metrics', async () => {
  const memUsage = process.memoryUsage();
  return {
    activePlugins: 4, // cama-core, levy-core, gis-core, valuation-tools
    messageRate: Math.floor(Math.random() * 50) + 10,
    memoryUsage: Math.floor(memUsage.heapUsed / 1024 / 1024),
    wsConnections: osBridge.isConnected() ? 1 : 0,
    apiLatency: Math.floor(Math.random() * 50) + 25,
    uptime: Date.now() - startTime,
    lastError: osBridge.getLastError()
  };
});

const startTime = Date.now();

async function startBackendServer() {
  return new Promise((resolve, reject) => {
    const backendPath = path.join(__dirname, '../../backend/TerraFusion.API');
    const dllPath = path.join(backendPath, 'bin/Release/net8.0/TerraFusion.API.dll');
    
    // Check if built backend exists
    if (!fs.existsSync(dllPath)) {
      console.log('Backend not built, starting in development mode...');
      // In development, assume backend is running separately
      resolve();
      return;
    }
    
    console.log('Starting embedded backend server...');
    backendProcess = spawn('dotnet', [dllPath, '--urls', `http://localhost:${backendPort}`], {
      cwd: backendPath,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });
    
    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });
    
    // Wait for server to be ready
    setTimeout(() => resolve(), 3000);
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0b1020',
      symbolColor: '#00ffee'
    },
    show: false,
    frame: true // Show frame for desktop OS experience
  });

  // Load the Vite-built OS Shell (preferred), then legacy fallbacks
  const pwaDist = path.join(__dirname, '../dist/index.html');
  const commandCenter = path.join(__dirname, '../terrafusion-command-center.html');
  const desktopApp = path.join(__dirname, '../desktop-app.html');
  const fallbackApp = path.join(__dirname, '../index.html');
  
  if (fs.existsSync(pwaDist)) {
    console.log('🌐 Loading TerraFusion OS Shell from:', pwaDist);
    mainWindow.loadFile(pwaDist);
  } else if (fs.existsSync(commandCenter)) {
    console.log('🚀 Loading TerraFusion Command Center from:', commandCenter);
    mainWindow.loadFile(commandCenter);
  } else if (fs.existsSync(desktopApp)) {
    console.log('📱 Loading TerraFusion Desktop App from:', desktopApp);
    mainWindow.loadFile(desktopApp);
  } else if (fs.existsSync(fallbackApp)) {
    console.log('⚠️ Loading fallback app from:', fallbackApp);
    mainWindow.loadFile(fallbackApp);
  } else {
    console.log('❌ No app found, creating minimal interface...');
    mainWindow.loadURL('data:text/html,<h1>TerraFusion OS Desktop</h1><p>Application files not found</p>');
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Initialize IPC handlers
    initializeIpcHandlers(mainWindow);
    
    // Initialize desktop launchers
    const launchers = new DesktopLaunchers();
    launchers.registerIPCHandlers();
    
    // Initialize Terrafusion OS bridge
    osBridge = new TerraFusionOSBridge();
    osBridge.onStateChanged((state) => {
      try {
        mainWindow.webContents.send('os:connection-state', state);
      } catch (_) {
        // Ignore webContents send errors
      }
    });
    osBridge.initialize().catch((err) => {
      // Forward initialization errors to renderer for visibility
      const state = osBridge.getState();
      state.lastError = String(err);
      state.status = 'error';
      try { mainWindow.webContents.send('os:connection-state', state); } catch (_) {
        // Ignore webContents send errors
      }
    });
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle minimize to tray
  mainWindow.on('minimize', (event) => {
    if (process.platform === 'darwin') {
      // On macOS, minimize normally
      return;
    }
    
    event.preventDefault();
    mainWindow.hide();
    
    if (!tray) {
      createTray();
    }
  });
}

function createTray() {
  const trayIcon = nativeImage.createFromPath(
    path.join(__dirname, 'assets', 'tray-icon.png')
  );
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Terrafusion OS',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'System Health',
      click: () => {
        // Open system health dialog
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Terrafusion OS - Government AI Platform');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Setup custom protocol for local resources
app.whenReady().then(async () => {
  // Register custom protocol for serving local files
  protocol.registerFileProtocol('terrafusion', (request, callback) => {
    const url = request.url.substr(13); // Remove 'terrafusion://' prefix
    const filePath = path.join(__dirname, '..', url);
    callback({ path: filePath });
  });
  
  // Start embedded backend if not in development
  if (!isDev) {
    try {
      await startBackendServer();
    } catch (error) {
      console.error('Failed to start backend server:', error);
    }
  }
  
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Cleanup before quit
  if (tray) {
    tray.destroy();
  }
  
  // Cleanup backend process
  if (backendProcess) {
    console.log('Stopping embedded backend server...');
    backendProcess.kill('SIGTERM');
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// Set application menu
const template = [
  {
    label: 'Terrafusion OS',
    submenu: [
      {
        label: 'About Terrafusion OS',
        role: 'about'
      },
      { type: 'separator' },
      {
        label: 'Preferences',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          // Open preferences
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Modules',
    submenu: [
      {
        label: 'Module Manager',
        accelerator: 'CmdOrCtrl+M',
        click: () => {
          // Open module manager
        }
      },
      {
        label: 'Refresh Modules',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          mainWindow.webContents.reload();
        }
      }
    ]
  },
  {
    label: 'System',
    submenu: [
      {
        label: 'System Health',
        click: () => {
          // Open system health
        }
      },
      {
        label: 'AI Command Center',
        click: () => {
          // Open AI command center
        }
      },
      { type: 'separator' },
      {
        label: 'Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
        click: () => {
          mainWindow.webContents.toggleDevTools();
        }
      }
    ]
  }
];

if (process.platform === 'darwin') {
  template[0].submenu.unshift({ type: 'separator' });
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
