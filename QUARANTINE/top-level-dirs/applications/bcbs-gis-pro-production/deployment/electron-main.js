const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

class TerraFusionDesktopApp {
  constructor() {
    this.mainWindow = null;
    this.serverProcess = null;
    this.serverPort = process.env.PORT || 5000;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    app.whenReady().then(() => this.createWindow());
    app.on('window-all-closed', () => this.handleWindowsClosed());
    app.on('activate', () => this.handleActivate());
    app.on('before-quit', () => this.cleanup());
    
    ipcMain.handle('get-system-info', () => this.getSystemInfo());
    ipcMain.handle('check-server-status', () => this.checkServerStatus());
    ipcMain.handle('restart-server', () => this.restartServer());
    ipcMain.handle('open-logs', () => this.openLogsDirectory());
  }

  async createWindow() {
    await this.startServer();
    
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: this.getAppIcon(),
      title: 'Terrafusion Civil Infrastructure',
      titleBarStyle: 'default',
      show: false
    });

    this.setupMenu();
    this.setupWindowEvents();

    const startUrl = this.isDevelopment 
      ? 'http://localhost:3000' 
      : `http://localhost:${this.serverPort}`;

    await this.waitForServer();
    this.mainWindow.loadURL(startUrl);
    
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      if (this.isDevelopment) {
        this.mainWindow.webContents.openDevTools();
      }
    });
  }

  getAppIcon() {
    const platform = process.platform;
    if (platform === 'darwin') {
      return path.join(__dirname, 'assets', 'icon.icns');
    } else if (platform === 'win32') {
      return path.join(__dirname, 'assets', 'icon.ico');
    } else {
      return path.join(__dirname, 'assets', 'icon.png');
    }
  }

  setupMenu() {
    const template = [
      {
        label: 'Terrafusion',
        submenu: [
          {
            label: 'About Terrafusion',
            click: () => this.showAboutDialog()
          },
          { type: 'separator' },
          {
            label: 'Preferences',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.showPreferences()
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'File',
        submenu: [
          {
            label: 'New Project',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.mainWindow.webContents.send('menu-new-project')
          },
          {
            label: 'Open Project',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.mainWindow.webContents.send('menu-open-project')
          },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.mainWindow.webContents.send('menu-save')
          },
          { type: 'separator' },
          {
            label: 'Import Data',
            submenu: [
              {
                label: 'Import Parcels',
                click: () => this.importData('parcels')
              },
              {
                label: 'Import GIS Layers',
                click: () => this.importData('gis-layers')
              },
              {
                label: 'Import Documents',
                click: () => this.importData('documents')
              }
            ]
          },
          {
            label: 'Export Data',
            submenu: [
              {
                label: 'Export to PDF',
                click: () => this.exportData('pdf')
              },
              {
                label: 'Export to CSV',
                click: () => this.exportData('csv')
              },
              {
                label: 'Export GIS Data',
                click: () => this.exportData('gis')
              }
            ]
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => this.mainWindow.reload()
          },
          {
            label: 'Force Reload',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => this.mainWindow.webContents.reloadIgnoringCache()
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
            click: () => this.mainWindow.webContents.toggleDevTools()
          },
          { type: 'separator' },
          {
            label: 'Actual Size',
            accelerator: 'CmdOrCtrl+0',
            click: () => this.mainWindow.webContents.setZoomLevel(0)
          },
          {
            label: 'Zoom In',
            accelerator: 'CmdOrCtrl+Plus',
            click: () => this.zoomIn()
          },
          {
            label: 'Zoom Out',
            accelerator: 'CmdOrCtrl+-',
            click: () => this.zoomOut()
          },
          { type: 'separator' },
          {
            label: 'Toggle Fullscreen',
            accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
            click: () => this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
          }
        ]
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'System Status',
            click: () => this.showSystemStatus()
          },
          {
            label: 'Server Logs',
            click: () => this.openLogsDirectory()
          },
          {
            label: 'Restart Server',
            click: () => this.restartServer()
          },
          { type: 'separator' },
          {
            label: 'Database Console',
            click: () => this.openDatabaseConsole()
          },
          {
            label: 'Backup Data',
            click: () => this.backupData()
          }
        ]
      },
      {
        label: 'Window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            click: () => this.mainWindow.minimize()
          },
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            click: () => this.mainWindow.close()
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Documentation',
            click: () => shell.openExternal('https://docs.terrafusion.com')
          },
          {
            label: 'Support Center',
            click: () => shell.openExternal('https://support.terrafusion.com')
          },
          {
            label: 'Report Issue',
            click: () => shell.openExternal('https://github.com/terrafusion/issues')
          },
          { type: 'separator' },
          {
            label: 'Check for Updates',
            click: () => this.checkForUpdates()
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupWindowEvents() {
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      const serverScript = path.join(__dirname, '..', 'server', 'index.js');
      
      this.serverProcess = spawn('node', [serverScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: this.serverPort
        }
      });

      this.serverProcess.stdout.on('data', (data) => {
        console.log(`Server: ${data}`);
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`Server Error: ${data}`);
      });

      this.serverProcess.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
      });

      setTimeout(resolve, 3000);
    });
  }

  async waitForServer() {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`http://localhost:${this.serverPort}/health`);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }
    
    throw new Error('Server failed to start');
  }

  async checkServerStatus() {
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async restartServer() {
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
    await this.startServer();
    this.mainWindow.reload();
  }

  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      uptime: os.uptime()
    };
  }

  showAboutDialog() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About Terrafusion',
      message: 'Terrafusion Civil Infrastructure',
      detail: 'Version 1.0.0\nEnterprise GIS Platform for County Operations\n\nBuilt with precision, engineered for excellence.',
      buttons: ['OK']
    });
  }

  showPreferences() {
    this.mainWindow.webContents.send('show-preferences');
  }

  showSystemStatus() {
    this.mainWindow.webContents.send('show-system-status');
  }

  async importData(type) {
    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: `Import ${type}`,
      filters: [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    });

    if (!result.canceled) {
      this.mainWindow.webContents.send('import-data', { type, files: result.filePaths });
    }
  }

  async exportData(format) {
    const result = await dialog.showSaveDialog(this.mainWindow, {
      title: `Export to ${format.toUpperCase()}`,
      defaultPath: `terrafusion-export.${format}`,
      filters: [
        { name: `${format.toUpperCase()} Files`, extensions: [format] }
      ]
    });

    if (!result.canceled) {
      this.mainWindow.webContents.send('export-data', { format, path: result.filePath });
    }
  }

  openLogsDirectory() {
    const logsPath = path.join(os.homedir(), 'Terrafusion', 'logs');
    shell.openPath(logsPath);
  }

  openDatabaseConsole() {
    this.mainWindow.webContents.send('open-database-console');
  }

  async backupData() {
    const result = await dialog.showSaveDialog(this.mainWindow, {
      title: 'Backup Terrafusion Data',
      defaultPath: `terrafusion-backup-${new Date().toISOString().split('T')[0]}.sql`,
      filters: [
        { name: 'SQL Files', extensions: ['sql'] }
      ]
    });

    if (!result.canceled) {
      this.mainWindow.webContents.send('backup-data', { path: result.filePath });
    }
  }

  checkForUpdates() {
    this.mainWindow.webContents.send('check-updates');
  }

  zoomIn() {
    const currentZoom = this.mainWindow.webContents.getZoomLevel();
    this.mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
  }

  zoomOut() {
    const currentZoom = this.mainWindow.webContents.getZoomLevel();
    this.mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
  }

  handleWindowsClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  handleActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    }
  }

  cleanup() {
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }
}

new TerraFusionDesktopApp();