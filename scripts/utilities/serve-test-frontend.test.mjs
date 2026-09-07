import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

test('test frontend command uses the governed preview launcher', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.equal(
    pkg.scripts['frontend:serve:test'],
    'node scripts/utilities/serve-test-frontend.mjs'
  );
});

test('preview loads the frontend package Vite, not the different root dependency', async () => {
  const { frontendViteUrl } = await import('./serve-test-frontend.mjs');
  const frontendRequire = createRequire(new URL('../../frontend/package.json', import.meta.url));
  const expectedVersion = frontendRequire('vite/package.json').version;
  const runtime = await import(frontendViteUrl());
  assert.equal(runtime.version, expectedVersion);
  assert.equal(typeof runtime.preview, 'function');
});

test('preview uses the API frontend origin setting and rejects invalid ports', async () => {
  const { previewOptions } = await import('./serve-test-frontend.mjs');
  assert.deepEqual(previewOptions({}).preview, { host: 'localhost', port: 3102, strictPort: true });
  assert.equal(previewOptions({ TF_FRONTEND_PORT: '43123' }).preview.port, 43123);
  assert.equal(previewOptions({ TF_FRONTEND_PORT: '3000' }).preview.port, 3000);
  for (const port of ['', '0', '-1', '65536', '3102oops', '3.1', ' 3102', '03102']) {
    assert.throws(() => previewOptions({ TF_FRONTEND_PORT: port }), /TF_FRONTEND_PORT/);
  }
});
