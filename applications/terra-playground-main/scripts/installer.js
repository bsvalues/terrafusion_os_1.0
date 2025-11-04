const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: false,
    resizable: false,
    show: false
  });

  mainWindow.loadFile('installer.html');
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(createWindow);

ipcMain.on('start-installation', async (event) => {
  const steps = [
    { name: 'Verifying system requirements', duration: 2000 },
    { name: 'Preparing installation', duration: 1500 },
    { name: 'Installing core components', duration: 3000 },
    { name: 'Configuring application', duration: 2000 },
    { name: 'Creating shortcuts', duration: 1000 },
    { name: 'Finalizing installation', duration: 1500 }
  ];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    event.reply('installation-progress', {
      step: i + 1,
      total: steps.length,
      message: step.name
    });
    await new Promise(resolve => setTimeout(resolve, step.duration));
  }

  event.reply('installation-complete');
});

ipcMain.on('close-installer', () => {
  app.quit();
}); 