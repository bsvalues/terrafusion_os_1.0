// TerraFusion Local Agent Cockpit — Electron main process.
//
// Founder-safe invariants asserted by os-platform/core/tests/local-agent-cockpit-skeleton.test.mjs:
//   - webPreferences.nodeIntegration === false
//   - webPreferences.contextIsolation === true
//   - renderer is loaded via loadFile (file://), never a remote URL
//   - no `app.allowRendererProcessReuse = false` style escape hatches
//
// This file is CommonJS for maximum portability with Electron's main process.

'use strict';

const path = require('node:path');

// Compiled CommonJS daemon control surface (Slices J–L). Required from main
// only — never exposed directly to the renderer. Renderer talks to main via
// ipcMain channels (terrafusion namespace) wired below.
//
// eslint-disable-next-line global-require
const daemonControl = require(path.join(
  __dirname,
  '..',
  '..',
  'os-platform',
  'core',
  'pilot',
  'local-agent',
  'daemonControl.js',
));

// eslint-disable-next-line global-require
const { createChatBus } = require(path.join(__dirname, 'chatBus.js'));

function cockpitRepoRoot() {
  return path.resolve(__dirname, '..', '..');
}

let activeDaemon = null;
let chatBus = null;

function getActiveRegistry() {
  if (!activeDaemon) return null;
  return activeDaemon.registry || null;
}

function ensureChatBus(electron) {
  if (chatBus) return chatBus;
  const { BrowserWindow } = electron;
  chatBus = createChatBus({
    getRegistry: getActiveRegistry,
    send(channel, payload) {
      // Broadcast to every cockpit window. There is normally exactly one.
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send(channel, payload);
        }
      }
    },
  });
  return chatBus;
}

function registerIpcHandlers(electron) {
  const { ipcMain } = electron;
  // Idempotent: removeHandler is a no-op if not previously registered.
  for (const ch of [
    'terrafusion:daemon:start',
    'terrafusion:daemon:stop',
    'terrafusion:daemon:status',
    'terrafusion:adapter:list',
    'terrafusion:adapter:chat:start',
    'terrafusion:adapter:chat:cancel',
  ]) {
    ipcMain.removeHandler(ch);
  }

  ipcMain.handle('terrafusion:daemon:start', async () => {
    const { result, daemon } = await daemonControl.daemonStart({
      repoRoot: cockpitRepoRoot(),
    });
    if (daemon) activeDaemon = daemon;
    return result;
  });

  ipcMain.handle('terrafusion:daemon:stop', async () => {
    const result = await daemonControl.daemonStop({ repoRoot: cockpitRepoRoot() });
    if (activeDaemon) {
      try {
        await activeDaemon.stop();
      } catch (_err) {
        // Daemon may already be stopped; record removal is the source of truth.
      }
      activeDaemon = null;
    }
    return result;
  });

  ipcMain.handle('terrafusion:daemon:status', async () =>
    daemonControl.daemonStatus({ repoRoot: cockpitRepoRoot() }),
  );

  ipcMain.handle('terrafusion:adapter:list', async () => {
    // Slice O surfaces only the in-process registry. A live cross-process
    // adapter list (asking a remote daemon) lands in a later slice.
    const registry = getActiveRegistry();
    if (!registry || typeof registry.list !== 'function') {
      return { adapters: [] };
    }
    return {
      adapters: registry.list().map((adapter) => ({
        id: typeof adapter.name === 'string' ? adapter.name : '',
      })),
    };
  });

  ipcMain.handle('terrafusion:adapter:chat:start', async (_event, params) => {
    const bus = ensureChatBus(electron);
    return bus.start(params || {});
  });

  ipcMain.handle('terrafusion:adapter:chat:cancel', async (_event, params) => {
    const bus = ensureChatBus(electron);
    return bus.cancel(params || {});
  });
}

function loadElectron() {
  // eslint-disable-next-line global-require
  return require('electron');
}

function createMainWindow(electron) {
  const { BrowserWindow } = electron;

  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    backgroundColor: '#0b1220',
    title: 'TerraFusion Local Agent Cockpit',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  win.removeMenu();
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => {
    win.show();
  });

  return win;
}

function bootstrap() {
  const electron = loadElectron();
  const { app } = electron;

  registerIpcHandlers(electron);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.whenReady().then(() => {
    createMainWindow(electron);
    app.on('activate', () => {
      if (electron.BrowserWindow.getAllWindows().length === 0) {
        createMainWindow(electron);
      }
    });
  });
}

// Only bootstrap when actually run by Electron. The presence check keeps the
// file safe to require in unit tests that do not have Electron available.
if (process.versions && typeof process.versions.electron === 'string') {
  bootstrap();
}

module.exports = { createMainWindow, bootstrap, registerIpcHandlers };
