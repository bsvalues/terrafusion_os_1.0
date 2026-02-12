const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const SystemChecker = require('./scripts/systemCheck');
const Updater = require('./scripts/updater');
const Telemetry = require('./scripts/telemetry');

let mainWindow;
let splashWindow;
let systemChecker;
let updater;
let telemetry;

async function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  splashWindow.loadFile('splash.html');
  splashWindow.center();
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const startUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, 'out/index.html')}`;
  
  try {
    await mainWindow.loadURL(startUrl);
    console.log('Loaded URL:', startUrl);
  } catch (error) {
    console.error('Error loading URL:', error);
    mainWindow.loadFile('error.html');
  }

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.destroy();
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initialize() {
  try {
    // Initialize system checker
    systemChecker = new SystemChecker();
    const systemCheck = await systemChecker.checkAll();
    
    if (!systemCheck.passed) {
      const failedChecks = systemCheck.checks.filter(check => !check.passed);
      console.error('System requirements not met:', failedChecks);
      // Show system requirements error dialog
      return;
    }

    // Initialize telemetry
    telemetry = new Telemetry();
    telemetry.trackSession();

    // Initialize updater
    updater = new Updater();
    updater.checkForUpdates();

    // Create windows
    await createSplashWindow();
    setTimeout(createMainWindow, 3000);

  } catch (error) {
    console.error('Initialization error:', error);
    if (telemetry) {
      telemetry.trackError(error, { context: 'initialization' });
    }
  }
}

app.whenReady().then(initialize);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (telemetry) {
      telemetry.endSession();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

// IPC handlers for telemetry
ipcMain.on('track-feature', (event, featureName) => {
  if (telemetry) {
    telemetry.trackFeatureUsage(featureName);
  }
});

ipcMain.on('track-error', (event, { error, context }) => {
  if (telemetry) {
    telemetry.trackError(error, context);
  }
});

// IPC handlers for system checks
ipcMain.handle('get-system-info', async () => {
  if (systemChecker) {
    return systemChecker.getSystemInfo();
  }
  return null;
});

// IPC handlers for updates
ipcMain.handle('check-for-updates', async () => {
  if (updater) {
    return updater.checkForUpdates();
  }
  return null;
});

ipcMain.handle('install-update', async () => {
  if (updater) {
    return updater.installUpdate();
  }
  return null;
}); 