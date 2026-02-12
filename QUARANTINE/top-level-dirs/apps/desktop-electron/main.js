// Terrafusion OS Desktop Shell (Electron)
// Loads official brand PWA shell as a native, frameless window.
// Starts an internal static server and the Terrafusion.API backend.

const { app, BrowserWindow, nativeTheme } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');

let win;
let apiProc;
let server;
const UI_PORT = process.env.TF_UI_PORT || 18080;
const API_URL = process.env.TF_API_URL || 'http://localhost:49152';

function startStaticServer() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const srv = express();
  srv.use(express.static(repoRoot));
  return new Promise((resolve, reject) => {
    const httpServer = srv.listen(UI_PORT, '127.0.0.1', () => resolve(httpServer));
    httpServer.on('error', reject);
  });
}

function startBackend() {
  // dotnet run --project backend/Terrafusion.API/Terrafusion.API.csproj --urls http://localhost:49152
  const projectPath = path.resolve(__dirname, '..', '..', 'backend', 'Terrafusion.API', 'Terrafusion.API.csproj');
  const child = spawn('dotnet', ['run', '--project', projectPath, '--urls', API_URL], {
    windowsHide: true,
    stdio: 'inherit',
  });
  child.on('exit', (code) => {
    console.log('Terrafusion.API exited with code', code);
  });
  return child;
}

async function createWindow() {
  nativeTheme.themeSource = 'dark';

  // Start internal services
  server = await startStaticServer();
  apiProc = startBackend();

  win = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    backgroundColor: '#0b1020',
    title: 'Terrafusion OS',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const url = `http://127.0.0.1:${UI_PORT}/frontend/terrafusion-command-center.html`;
  await win.loadURL(url);
}

function cleanup() {
  try { if (server) server.close(); } catch {}
  try { if (apiProc) apiProc.kill(); } catch {}
}

app.on('before-quit', cleanup);
app.on('window-all-closed', () => { cleanup(); app.quit(); });
app.whenReady().then(createWindow);
