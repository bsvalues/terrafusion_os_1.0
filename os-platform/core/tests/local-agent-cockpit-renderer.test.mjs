// Slice Q — Renderer chat panel structural test.
//
// Validates the renderer surface without booting a DOM:
//  - HTML has the new chat panel ids/elements
//  - HTML keeps CSP unchanged
//  - JS calls the bridged surface (daemonStart/Stop/Status/adapterList/adapterChat)
//  - JS forbids innerHTML, eval, Function constructor, Node APIs
//  - JS uses textContent (XSS-safe text injection)
//  - JS asserts adapterId is read from the selector, not hardcoded
//  - JS is parseable by node --check
//  - CSS uses only the documented TerraFusion tokens (no hardcoded hex/gray)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const renderer = path.join(repoRoot, 'apps', 'agent-cockpit', 'renderer');

function read(rel) {
  return readFileSync(path.join(renderer, rel), 'utf8');
}

const REQUIRED_IDS = [
  'kv-version',
  'kv-platform',
  'kv-daemon-status',
  'btn-daemon-start',
  'btn-daemon-stop',
  'btn-refresh-adapters',
  'adapter-select',
  'stream-state',
  'chat-messages',
  'chat-form',
  'chat-input',
  'btn-chat-send',
  'btn-chat-cancel',
  'chat-error',
];

test('renderer html contains every Slice Q element id', () => {
  const html = read('index.html');
  for (const id of REQUIRED_IDS) {
    assert.ok(
      html.includes(`id="${id}"`),
      `renderer html must include id="${id}"`,
    );
  }
});

test('renderer html keeps the CSP locked (default-src self, connect-src none)', () => {
  const html = read('index.html');
  assert.match(html, /<meta\s+http-equiv="Content-Security-Policy"/i);
  assert.match(html, /default-src\s+'self'/);
  assert.match(html, /connect-src\s+'none'/);
  assert.equal(
    /<script[^>]*\ssrc=["'](https?:)?\/\//i.test(html),
    false,
    'no remote scripts',
  );
  assert.equal(
    /<link[^>]*\shref=["'](https?:)?\/\//i.test(html),
    false,
    'no remote stylesheets',
  );
});

test('renderer js calls the full Slice O+P bridge surface', () => {
  const js = read('index.js');
  for (const method of [
    'api.daemonStart',
    'api.daemonStop',
    'api.daemonStatus',
    'api.adapterList',
    'api.adapterChat',
  ]) {
    assert.ok(js.includes(method), `renderer js must call ${method}`);
  }
});

test('renderer js never uses innerHTML / eval / Function constructor', () => {
  const js = read('index.js');
  for (const forbidden of [
    'innerHTML',
    'outerHTML',
    'document.write',
    'eval(',
    'new Function(',
  ]) {
    assert.equal(
      js.includes(forbidden),
      false,
      `renderer js must not reference ${forbidden}`,
    );
  }
});

test('renderer js never reaches for Node or remote network APIs', () => {
  const js = read('index.js');
  for (const forbidden of [
    'require(',
    'process.binding',
    'fs.',
    'child_process',
    'net.create',
    'fetch(',
    'XMLHttpRequest',
    'WebSocket',
    'navigator.sendBeacon',
  ]) {
    assert.equal(
      js.includes(forbidden),
      false,
      `renderer js must not reference ${forbidden}`,
    );
  }
});

test('renderer js never hardcodes an adapter id (must read from selector)', () => {
  const js = read('index.js');
  // adapterId must come from the select element, not a string literal.
  assert.match(
    js,
    /adapterId\s*[:=]\s*[a-zA-Z_$][\w$]*/,
    'adapterId must be assigned from a variable, not a literal',
  );
  // Common hardcoded suspects.
  for (const literal of ["'fake'", '"fake"', "'ollama'", '"ollama"', "'claude'", '"claude"']) {
    // It's fine for adapter NAMES to appear in comments; forbid only when
    // assigned to adapterId.
    const re = new RegExp(`adapterId\\s*[:=]\\s*${literal.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`);
    assert.equal(
      re.test(js),
      false,
      `renderer js must not hardcode adapterId = ${literal}`,
    );
  }
});

test('renderer js uses textContent for all dynamic message rendering', () => {
  const js = read('index.js');
  assert.match(js, /\.textContent\s*=/, 'renderer js must use textContent');
});

test('renderer js wires submit + cancel + daemon control listeners', () => {
  const js = read('index.js');
  assert.ok(js.includes("getElementById('chat-form')") || js.includes("$('chat-form')"));
  assert.match(js, /addEventListener\(\s*['"]submit['"]/);
  assert.ok(
    js.includes("$('btn-chat-cancel')") ||
      js.includes("getElementById('btn-chat-cancel')"),
  );
});

test('renderer js stays CommonJS-free and parseable by node --check', async () => {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(
    process.execPath,
    ['--check', path.join(renderer, 'index.js')],
    { encoding: 'utf8' },
  );
  assert.equal(
    result.status,
    0,
    `renderer/index.js must pass node --check\n${result.stderr || result.stdout}`,
  );
});

test('renderer css references only TerraFusion tokens for color/background', () => {
  const css = read('index.css');
  // Tokens declared in :root must include the canonical Slice M set.
  for (const token of ['--tf-bg', '--tf-surface', '--tf-border', '--tf-fg', '--tf-muted', '--tf-accent']) {
    assert.match(css, new RegExp(token), `css must declare ${token}`);
  }
  // No hex literal colors except inside the :root token block (which uses hsl).
  // We assert no hex literals at all — TerraFusion tokens use hsl().
  assert.equal(
    /#[0-9a-fA-F]{3,8}\b/.test(css),
    false,
    'css must not use hex color literals (use hsl() tokens)',
  );
});
