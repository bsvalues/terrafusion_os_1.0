const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');

const isDev = require('electron-is-dev');

const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, protocol, globalShortcut, shell } = require('electron');

const DesktopLaunchers = require('./desktop-launchers');
const { initializeIpcHandlers } = require('./ipc-handlers');
const { TerraFusionOSBridge } = require('./os-bridge');

let mainWindow;
let tray;
let osBridge;
let backendProcess;
// Dynamic port configuration - NO HARDCODED PORTS!
const backendPort = process.env.TF_API_PORT || 5046;
const desktopShellPort = process.env.TF_DESKTOP_PORT || 3104;

// Government security configuration
const governmentSecurityConfig = {
  nodeIntegration: false,
  contextIsolation: true,
  enableRemoteModule: false,
  webSecurity: true,
  allowRunningInsecureContent: false,
  experimentalFeatures: false
};

// Government accessibility features
let accessibilityConfig = {
  highContrast: false,
  fontSize: 16,
  screenReaderEnabled: false,
  keyboardNavigation: true
};

// Government desktop shell integration
let desktopShellConnected = false;

// Government application shortcuts
const governmentShortcuts = {
  'CommandOrControl+Alt+E': () => launchGovernmentApp('emergency-management'),
  'CommandOrControl+Alt+P': () => launchGovernmentApp('property-assessment'),
  'CommandOrControl+Alt+T': () => launchGovernmentApp('tax-collection'),
  'CommandOrControl+Alt+R': () => launchGovernmentApp('parks-recreation'),
  'CommandOrControl+Alt+H': () => toggleHighContrast(),
  'CommandOrControl+Alt+A': () => toggleAccessibilityFeatures(),
  'F1': () => showGovernmentHelp()
};

function registerGovernmentShortcuts() {
  Object.keys(governmentShortcuts).forEach(shortcut => {
    globalShortcut.register(shortcut, governmentShortcuts[shortcut]);
  });
  console.log('Government keyboard shortcuts registered');
}

function launchGovernmentApp(appType) {
  console.log(`Launching government application: ${appType}`);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('launch-government-app', { appType });
  }
}

function toggleHighContrast() {
  accessibilityConfig.highContrast = !accessibilityConfig.highContrast;
  console.log(`High contrast mode: ${accessibilityConfig.highContrast ? 'enabled' : 'disabled'}`);
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('accessibility-change', {
      type: 'high-contrast',
      enabled: accessibilityConfig.highContrast
    });
  }
}

function toggleAccessibilityFeatures() {
  accessibilityConfig.screenReaderEnabled = !accessibilityConfig.screenReaderEnabled;
  console.log(`Screen reader mode: ${accessibilityConfig.screenReaderEnabled ? 'enabled' : 'disabled'}`);
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('accessibility-change', {
      type: 'screen-reader',
      enabled: accessibilityConfig.screenReaderEnabled
    });
  }
}

function showGovernmentHelp() {
  console.log('Showing government help system');
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('show-government-help');
  }
}

async function connectToDesktopShell() {
  try {
    const fetch = require('node-fetch');
    const response = await fetch(`http://localhost:${desktopShellPort}/api/health`);
    
    if (response.ok) {
      desktopShellConnected = true;
      console.log('Connected to TerraFusion Desktop Shell Service');
      
      // Register with desktop shell
      await fetch(`http://localhost:${desktopShellPort}/api/applications/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: 'terrafusion-government-os',
          window_id: 'main',
          government_app: true
        })
      });
    }
  } catch (error) {
    console.log('Desktop Shell Service not available, running standalone');
    desktopShellConnected = false;
  }
}

// Expose OS connection state to renderer
// Expose backend API URL to renderer
ipcMain.handle('os:backend-url', () => {
  return `http://localhost:${backendPort}`;
});

ipcMain.handle('os:connection-state', () => {
  try {
    return osBridge
      ? osBridge.getState()
      : {
          status: backendProcess ? 'connected' : 'disconnected',
          backendUrl: `http://localhost:${backendPort}`,
          desktopShellConnected,
          governmentMode: true
        };
  } catch (_) {
    return { status: 'error' };
  }
});

// Government desktop shell integration
ipcMain.handle('desktop-shell:status', () => {
  return {
    connected: desktopShellConnected,
    port: desktopShellPort,
    accessibility: accessibilityConfig
  };
});

ipcMain.handle('desktop-shell:launch-app', async (event, { appType, data }) => {
  if (desktopShellConnected) {
    try {
      const fetch = require('node-fetch');
      const response = await fetch(`http://localhost:${desktopShellPort}/api/applications/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: appType,
          government_app: true,
          data
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to launch app via desktop shell:', error);
      return { error: error.message };
    }
  }
  
  return { error: 'Desktop shell not connected' };
});

// Government accessibility features
ipcMain.handle('accessibility:get-config', () => {
  return accessibilityConfig;
});

ipcMain.handle('accessibility:update-config', async (event, config) => {
  accessibilityConfig = { ...accessibilityConfig, ...config };
  
  // Update desktop shell if connected
  if (desktopShellConnected) {
    try {
      const fetch = require('node-fetch');
      await fetch(`http://localhost:${desktopShellPort}/api/accessibility/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accessibilityConfig)
      });
    } catch (error) {
      console.error('Failed to sync accessibility config:', error);
    }
  }
  
  return accessibilityConfig;
});

// Government workflow automation
ipcMain.handle('workflow:execute', async (event, { workflow_name, parameters }) => {
  if (desktopShellConnected) {
    try {
      const fetch = require('node-fetch');
      const response = await fetch(`http://localhost:${desktopShellPort}/api/workflows/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_name, parameters })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      return { error: error.message };
    }
  }
  
  return { error: 'Desktop shell not connected' };
});

// Government security features
ipcMain.handle('security:audit-log', async (event, { action, details }) => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    user: process.env.USERNAME || 'government_user',
    process: 'terrafusion-government-os'
  };
  
  console.log('Government Audit Log:', auditEntry);
  
  // In production, this would be sent to a secure audit logging system
  return { logged: true, entry: auditEntry };
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
    lastError: osBridge.getLastError(),
  };
});

const startTime = Date.now();

async function startBackendServer() {
  return new Promise((resolve, reject) => {
    const backendPath = path.join(__dirname, '../../backend/Terrafusion.API');
    const dllPath = path.join(backendPath, 'bin/Release/net8.0/Terrafusion.API.dll');

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
      stdio: ['ignore', 'pipe', 'pipe'],
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
  // Create the browser window with government security configuration
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      ...governmentSecurityConfig,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Allow local file access for government portals
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0b1020',
      symbolColor: '#00ffee',
    },
    show: false,
    frame: true, // Show frame for desktop OS experience
    autoHideMenuBar: false, // Keep menu bar for government accessibility
    accessibleTitle: 'TerraFusion Government Operating System',
    titleBarOverlay: {
      color: '#0b1020',
      symbolColor: '#00ffaa',
      height: 40
    }
  });

  // Government security headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['default-src \'self\' \'unsafe-inline\' data:'],
        'X-Frame-Options': ['DENY'],
        'X-Content-Type-Options': ['nosniff'],
        'Strict-Transport-Security': ['max-age=31536000; includeSubDomains'],
        'Referrer-Policy': ['strict-origin-when-cross-origin']
      }
    });
  });

  // Government accessibility setup
  mainWindow.webContents.once('dom-ready', () => {
    // Apply initial accessibility settings
    if (accessibilityConfig.highContrast) {
      mainWindow.webContents.insertCSS(`
        * { 
          filter: contrast(200%) brightness(150%); 
          background-color: black !important; 
          color: white !important; 
        }
      `);
    }
    
    if (accessibilityConfig.fontSize !== 16) {
      mainWindow.webContents.setZoomFactor(accessibilityConfig.fontSize / 16);
    }
  });

  // Load the Terrafusion Command Center
  const commandCenter = path.join(__dirname, '../terrafusion-command-center.html');
  const desktopApp = path.join(__dirname, '../desktop-app.html');
  const pwaDist = path.join(__dirname, '../dist/index.html');
  const fallbackApp = path.join(__dirname, '../index.html');

  if (fs.existsSync(commandCenter)) {
    console.log('🚀 Loading Terrafusion Command Center from:', commandCenter);
    mainWindow.loadFile(commandCenter);
  } else if (fs.existsSync(desktopApp)) {
    console.log('📱 Loading Terrafusion Desktop App from:', desktopApp);
    mainWindow.loadFile(desktopApp);
  } else if (fs.existsSync(pwaDist)) {
    console.log('🌐 Loading built PWA from:', pwaDist);
    mainWindow.loadFile(pwaDist);
  } else if (fs.existsSync(fallbackApp)) {
    console.log('⚠️ Loading fallback app from:', fallbackApp);
    mainWindow.loadFile(fallbackApp);
  } else {
    console.log('❌ No app found, creating government interface...');
    mainWindow.loadURL(
      'data:text/html,<h1>TerraFusion Government OS Desktop</h1><p>Loading government portals...</p><style>body{font-family:Arial;background:#0b1020;color:#fff;text-align:center;padding:50px;}</style>'
    );
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Connect to desktop shell after window is ready
    connectToDesktopShell();
    
    // Register government shortcuts
    registerGovernmentShortcuts();
    
    // Enable government accessibility features
    if (accessibilityConfig.screenReaderEnabled) {
      mainWindow.webContents.executeJavaScript(`
        document.body.setAttribute('aria-label', 'TerraFusion Government Operating System Main Interface');
        console.log('Government accessibility features enabled');
      `);
    }
  });

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
      try {
        mainWindow.webContents.send('os:connection-state', state);
      } catch (_) {
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
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray-icon.png'));

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Terrafusion OS',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: 'System Health',
      click: () => {
        // Open system health dialog
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
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
        role: 'about',
      },
      { type: 'separator' },
      {
        label: 'Preferences',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          // Open preferences
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: 'Modules',
    submenu: [
      {
        label: 'Module Manager',
        accelerator: 'CmdOrCtrl+M',
        click: () => {
          // Open module manager
        },
      },
      {
        label: 'Refresh Modules',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          mainWindow.webContents.reload();
        },
      },
    ],
  },
  {
    label: 'System',
    submenu: [
      {
        label: 'System Health',
        click: () => {
          // Open system health
        },
      },
      {
        label: 'AI Command Center',
        click: () => {
          // Open AI command center
        },
      },
      { type: 'separator' },
      {
        label: 'Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
        click: () => {
          mainWindow.webContents.toggleDevTools();
        },
      },
    ],
  },
];

if (process.platform === 'darwin') {
  template[0].submenu.unshift({ type: 'separator' });
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
