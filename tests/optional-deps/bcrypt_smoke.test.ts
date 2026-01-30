/**
 * Bucket C Smoke Test: bcrypt hash/compare contract
 *
 * Purpose: Verify bcrypt 6.x maintains the expected API contract
 * before merging PR #189 (bcrypt 5.1.1 → 6.0.0)
 *
 * Skips entirely if bcrypt isn't installed (graceful degradation).
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Check if bcrypt is installed before running tests
const bcryptInstalled = existsSync(resolve(process.cwd(), 'node_modules/bcrypt'));

describe.skipIf(!bcryptInstalled)('bcrypt smoke', async () => {
  // Only import if installed to avoid Vite resolution errors
  const bcrypt = bcryptInstalled ? await import('bcrypt') : null;

  it('hash/compare contract holds', async () => {
    if (!bcrypt) return;

    const pw = 'terraFusion🔒';
    const hash = await bcrypt.hash(pw, 10);

    // Hash should be a string with expected bcrypt format
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(10);
    expect(hash).toMatch(/^\$2[aby]?\$/); // bcrypt prefix

    // compare() should return true for correct password
    expect(await bcrypt.compare(pw, hash)).toBe(true);

    // compare() should return false for wrong password
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });

  it('getRounds returns expected value', async () => {
    if (!bcrypt) return;

    const hash = await bcrypt.hash('test', 12);
    expect(bcrypt.getRounds(hash)).toBe(12);
  });
});
