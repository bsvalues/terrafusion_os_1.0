import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const VITE_CONFIG_PATH = resolve(ROOT, 'frontend/vite.config.ts');
const PACKAGE_PATH = resolve(ROOT, 'package.json');

const VITE_SRC = readFileSync(VITE_CONFIG_PATH, 'utf8');
const PACKAGE_SRC = readFileSync(PACKAGE_PATH, 'utf8');

describe('Property Workbench runtime binding contract', () => {
  it('Vite proxy default follows the governed backend launcher port', () => {
    assert.match(
      PACKAGE_SRC,
      /env\.TF_API_PORT\s*=\s*env\.TF_API_PORT\s*\|\|\s*['"]5046['"]/,
      'backend:launch must default the live API to port 5046',
    );
    assert.match(
      VITE_SRC,
      /process\.env\.TF_API_PORT\s*\|\|\s*process\.env\.VITE_API_PORT\s*\|\|\s*['"]?5046['"]?/,
      'Vite proxy must default to the same governed backend port as backend:launch',
    );
  });
});
