import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, '../..');
const RATCHET_GUARD_PATH = path.join(ROOT_DIR, 'tools', 'registry', 'ratchet_guard.mjs');
const TDC_CONFIG_PATH = path.join(ROOT_DIR, 'tdc.config.json');
const REQUIRED_SCOPE = 'frontend/apps/os-shell/**';

describe('Governance Contract: ratchet scope alignment', () => {
  it('ratchet guard default scope includes frontend/apps/os-shell', () => {
    const content = fs.readFileSync(RATCHET_GUARD_PATH, 'utf-8');
    expect(content).toContain(REQUIRED_SCOPE);
  });

  it('tdc UI token scope includes frontend/apps/os-shell', () => {
    const config = JSON.parse(fs.readFileSync(TDC_CONFIG_PATH, 'utf-8'));
    const includeScope = config?.ui?.tokens?.include;

    expect(Array.isArray(includeScope)).toBe(true);
    expect(includeScope).toContain(REQUIRED_SCOPE);
  });
});
