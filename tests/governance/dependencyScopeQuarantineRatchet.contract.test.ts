import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

describe('Dependency Scope Quarantine Baseline Contract', () => {
  const baselinePath = path.resolve(
    __dirname,
    '../../scripts/governance/dependency-scope-quarantine-baseline.json'
  );

  it('exists', () => {
    expect(fs.existsSync(baselinePath)).toBe(true);
  });

  it('contains valid count and hash', () => {
    const content = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    expect(typeof content.quarantineCount).toBe('number');
    expect(content.quarantineCount).toBeGreaterThanOrEqual(0);
    expect(typeof content.hash).toBe('string');
    expect(content.hash.length).toBeGreaterThan(0);
  });

  it('hash is sha256 hex string', () => {
    const content = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    // 64 chars for sha256 hex
    expect(content.hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
