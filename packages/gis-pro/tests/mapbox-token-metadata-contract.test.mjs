import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(packageRoot, relativePath), 'utf8');
}

test('GIS package Mapbox metadata matches the live Vite token contract', () => {
  const readme = read('README.md');
  const config = JSON.parse(read('terrafusion-config.json'));
  const mapSource = read('client/src/components/TerraFusionMap.tsx');
  const envTypes = read('client/src/env.d.ts');

  assert.match(readme, /^VITE_MAPBOX_ACCESS_TOKEN="your_mapbox_token"$/m);
  assert.doesNotMatch(readme, /^MAPBOX_ACCESS_TOKEN=/m);
  assert.equal(
    config.integrations.external_apis.mapbox.env_var,
    'VITE_MAPBOX_ACCESS_TOKEN'
  );
  assert.match(mapSource, /import\.meta\.env\.VITE_MAPBOX_ACCESS_TOKEN/);
  assert.doesNotMatch(mapSource, /import\.meta\.env\.MAPBOX_ACCESS_TOKEN/);
  assert.match(envTypes, /readonly VITE_MAPBOX_ACCESS_TOKEN: string/);
});
