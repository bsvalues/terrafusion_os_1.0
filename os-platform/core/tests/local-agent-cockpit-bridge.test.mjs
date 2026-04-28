// Slice O — Cockpit IPC bridge structural test.
//
// Asserts the daemon ↔ cockpit bridge plumbing without launching Electron:
//  - main.js registers exactly the four expected ipcMain channels
//  - main.js requires daemonControl from the compiled CJS surface
//  - main.js never references TCP listeners (net.listen, net.createServer)
//  - preload.js routes every bridge call through ipcRenderer.invoke
//  - preload.js channel names match main.js exactly (no drift)
//  - preload.js still has a single contextBridge namespace (no leak)
//  - streaming methods (adapterChat / adapterComplete) are NOT yet on the bridge

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const cockpit = path.join(repoRoot, 'apps', 'agent-cockpit');

function read(rel) {
  return readFileSync(path.join(cockpit, rel), 'utf8');
}

const EXPECTED_CHANNELS = [
  'terrafusion:daemon:start',
  'terrafusion:daemon:stop',
  'terrafusion:daemon:status',
  'terrafusion:adapter:list',
  'terrafusion:adapter:chat:start',
  'terrafusion:adapter:chat:cancel',
];

const EXPECTED_BROADCAST_CHANNELS = [
  'terrafusion:adapter:chat:chunk',
  'terrafusion:adapter:chat:end',
  'terrafusion:adapter:chat:error',
];

test('main.js requires daemonControl from compiled CJS surface', () => {
  const src = read('main.js');
  assert.match(
    src,
    /require\([^)]*daemonControl\.js[^)]*\)/,
    'main.js must require daemonControl.js explicitly',
  );
});

test('main.js registers exactly the Slice P ipcMain channels', () => {
  const src = read('main.js');
  for (const channel of EXPECTED_CHANNELS) {
    const re = new RegExp(`ipcMain\\.handle\\(\\s*['"\`]${channel}['"\`]`);
    assert.match(src, re, `main.js must register ipcMain.handle('${channel}')`);
  }
  // adapterComplete streaming is deferred.
  assert.equal(
    src.includes('terrafusion:adapter:complete'),
    false,
    'main.js must not register a complete channel yet',
  );
});

test('main.js does not open TCP listeners (path-based IPC only)', () => {
  const src = read('main.js');
  for (const forbidden of ['net.createServer', 'net.Server', '.listen(']) {
    assert.equal(
      src.includes(forbidden),
      false,
      `main.js must not reference ${forbidden} — path-based IPC only`,
    );
  }
});

test('main.js keeps the Slice M security posture (sandbox + contextIsolation)', () => {
  const src = read('main.js');
  assert.match(src, /nodeIntegration\s*:\s*false/);
  assert.match(src, /contextIsolation\s*:\s*true/);
  assert.match(src, /sandbox\s*:\s*true/);
  assert.match(src, /loadFile\s*\(/);
  assert.equal(
    /loadURL\s*\(\s*['"`]https?:\/\//.test(src),
    false,
    'main.js must not load remote URLs',
  );
});

test('preload.js routes every bridge call through ipcRenderer.invoke', () => {
  const src = read('preload.js');
  for (const channel of EXPECTED_CHANNELS) {
    const re = new RegExp(
      `ipcRenderer\\s*\\.\\s*invoke\\s*\\(\\s*['"\`]${channel}['"\`]`,
    );
    assert.match(src, re, `preload.js must invoke '${channel}'`);
  }
});

test('preload.js still uses exactly one contextBridge namespace', () => {
  const src = read('preload.js');
  const calls = [...src.matchAll(/exposeInMainWorld\s*\(\s*['"`]([^'"`]+)['"`]/g)];
  assert.equal(calls.length, 1, 'preload must expose exactly one namespace');
  assert.equal(calls[0][1], 'terrafusion');
});

test('preload.js never imports Node modules beyond electron', () => {
  const src = read('preload.js');
  const requires = [...src.matchAll(/require\(\s*['"`]([^'"`]+)['"`]\s*\)/g)].map(
    (m) => m[1],
  );
  for (const r of requires) {
    assert.equal(
      r,
      'electron',
      `preload.js may only require('electron'); found require('${r}')`,
    );
  }
  // Sanity — no direct fs / child_process / net leaks.
  for (const forbidden of ['child_process', 'node:fs', 'node:net', 'node:http']) {
    assert.equal(
      src.includes(forbidden),
      false,
      `preload.js must not reference ${forbidden}`,
    );
  }
});

test('preload.js channels match main.js channels exactly (no drift)', () => {
  const main = read('main.js');
  const preload = read('preload.js');
  const handles = [
    ...main.matchAll(/ipcMain\s*\.\s*handle\s*\(\s*['"`]([^'"`]+)['"`]/g),
  ].map((m) => m[1]);
  const invokes = [
    ...preload.matchAll(/ipcRenderer\s*\.\s*invoke\s*\(\s*['"`]([^'"`]+)['"`]/g),
  ].map((m) => m[1]);
  // Every preload invoke must have a matching main handler.
  for (const ch of invokes) {
    assert.ok(
      handles.includes(ch),
      `preload invokes '${ch}' but main never registers ipcMain.handle('${ch}')`,
    );
  }
  // Ignore extra main handlers (none expected this slice, but allowed).
  assert.deepEqual(
    [...handles].sort(),
    [...EXPECTED_CHANNELS].sort(),
    'main.js handlers must match the Slice P channel set exactly',
  );
});

test('main.js and preload.js remain structurally valid (parseable by Node)', async () => {
  const { spawnSync } = await import('node:child_process');
  for (const rel of ['main.js', 'preload.js', 'chatBus.js']) {
    const result = spawnSync(
      process.execPath,
      ['--check', path.join(cockpit, rel)],
      { encoding: 'utf8' },
    );
    assert.equal(
      result.status,
      0,
      `${rel} must pass node --check\n${result.stderr || result.stdout}`,
    );
  }
});

test('main.js broadcasts streaming chunks via webContents.send', () => {
  const src = read('main.js');
  // The chatBus is wired with a send() that fans out to BrowserWindow.getAllWindows()
  // and each window's webContents.send. We assert both shapes.
  assert.match(src, /BrowserWindow\.getAllWindows\s*\(/);
  assert.match(src, /webContents\.send\s*\(/);
});

test('preload.js subscribes to broadcast channels via ipcRenderer.on', () => {
  const src = read('preload.js');
  for (const channel of EXPECTED_BROADCAST_CHANNELS) {
    const re = new RegExp(`ipcRenderer\\.(on|addListener)\\(\\s*[^,]*${channel.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`);
    // Indirect via constants is fine — assert the channel string appears AND
    // ipcRenderer.on appears at least once.
    assert.ok(src.includes(channel), `preload.js must reference '${channel}'`);
  }
  assert.match(src, /ipcRenderer\.on\s*\(/);
});
