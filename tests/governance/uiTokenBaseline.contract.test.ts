import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, '../..');
const BASELINE_PATH = path.join(ROOT_DIR, 'ui-token-baseline.json');

describe('Governance Contract: UI token baseline schema', () => {
  it('ui-token-baseline.json exists and contains a valid Gen2 ratchet payload', () => {
    expect(fs.existsSync(BASELINE_PATH), `Missing baseline file at ${BASELINE_PATH}`).toBe(true);

    const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));

    expect(baseline.contract).toBe('ui-token-baseline.json');
    expect(baseline.version).toBe('v1');
    expect(typeof baseline.scopeHash).toBe('string');
    expect(baseline.scopeHash.length).toBeGreaterThan(0);
    expect(typeof baseline.violationCount).toBe('number');
    expect(Number.isFinite(baseline.violationCount)).toBe(true);
    expect(baseline.violationCount).toBeGreaterThanOrEqual(0);
  });
});
