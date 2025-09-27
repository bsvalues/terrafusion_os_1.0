// Terrafusion OS Desktop Shell (Electron)
// Loads TerraFusion OS Government Marketplace as native desktop application
// Uses proper TerraFusion environment configuration

const { app, BrowserWindow, nativeTheme } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let win;
let apiProc;
let frontendProc;

// Use TerraFusion OS environment variables from .env
const TF_API_PORT = process.env.TF_API_PORT || 5046;
const TF_FRONTEND_PORT = process.env.TF_FRONTEND_PORT || 3102;
const API_URL = `http://localhost:${TF_API_PORT}`;
const FRONTEND_URL = `http://localhost:${TF_FRONTEND_PORT}`;

function startBackend() {
  console.log('🚀 Starting TerraFusion OS Backend API...');
  const projectPath = path.resolve(
    __dirname,
    '..',
    '..',
    'backend',
    'TerraFusion.API',
    'TerraFusion.API.csproj'
  );
  
  const child = spawn('dotnet', [
    'run', 
    '--project', 
    projectPath, 
    '--urls', 
    API_URL
  ], {
    windowsHide: true,
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..', '..')
  });
  
  child.on('exit', code => {
    console.log('TerraFusion.API exited with code', code);
  });
  
  return child;
}

function startFrontend() {
  console.log('🏪 Starting TerraFusion OS Government Marketplace...');
  const frontendPath = path.resolve(
    __dirname,
    '..',
    '..',
    'experience-suite',
    'temp-extract',
    'experience-suite-v5',
    'ui'
  );
  
  const child = spawn('npm', ['run', 'dev'], {
    windowsHide: true,
    stdio: 'inherit',
    cwd: frontendPath
  });
  
  child.on('exit', code => {
    console.log('Frontend marketplace exited with code', code);
  });
  
  return child;
}

async function createWindow() {
  nativeTheme.themeSource = 'dark';

  // Start TerraFusion OS services
  console.log('🔧 Starting TerraFusion OS services...');
  apiProc = startBackend();
  frontendProc = startFrontend();
  
  // Wait longer for services to start and check if they're ready
  console.log('⏳ Waiting for services to initialize...');
  await waitForServices();

  win = new BrowserWindow({
    width: 1600,
    height: 1000,
    frame: false,
    backgroundColor: '#0b1020',
    title: 'TerraFusion OS - Government Marketplace',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false // Don't show until loaded
  });

  console.log(`🏪 Loading TerraFusion OS Government Marketplace: ${FRONTEND_URL}`);
  
  try {
    // Load the government marketplace
    await win.loadURL(FRONTEND_URL);
    win.show(); // Show window after successful load
    console.log('✅ TerraFusion OS Desktop Application loaded successfully!');
  } catch (error) {
    console.error('❌ Failed to load TerraFusion OS:', error);
    // Fallback: show error page or retry
    win.loadFile(path.join(__dirname, 'loading.html')).catch(() => {
      win.loadURL('data:text/html,<h1>TerraFusion OS Loading...</h1><p>Please wait while services start...</p>');
    });
    win.show();
  }
}

async function waitForServices() {
  const maxRetries = 20;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Simple HTTP check if frontend is ready
      await new Promise((resolve, reject) => {
        const req = http.get(FRONTEND_URL, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(1000, () => reject(new Error('Timeout')));
      });
      
      console.log('✅ TerraFusion OS services are ready!');
      return;
    } catch (error) {
      // Service not ready yet
    }
    
    retries++;
    console.log(`⏳ Waiting for services... (${retries}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('⚠️ Services taking longer than expected, attempting to load anyway...');
}

function cleanup() {
  console.log('🔄 Cleaning up TerraFusion OS processes...');
  try {
    if (frontendProc) frontendProc.kill();
  } catch {}
  try {
    if (apiProc) apiProc.kill();
  } catch {}
}

app.on('before-quit', cleanup);
app.on('window-all-closed', () => {
  cleanup();
  app.quit();
});
app.whenReady().then(createWindow);
