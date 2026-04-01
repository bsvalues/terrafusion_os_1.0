const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitPort = require('wait-port');

let backendProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // optional if needed
    }
  });

  win.on('closed', () => {
    if (backendProcess) backendProcess.kill();
    app.quit();
  });

  win.loadURL('http://localhost:5000');
}

app.whenReady().then(async () => {
  // Start the backend and static server
  backendProcess = spawn('npm', ['run', 'start:local'], { shell: true, stdio: 'inherit' });

  // Wait for frontend to be available on port 5000
  await waitPort({ host: 'localhost', port: 5000 });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});