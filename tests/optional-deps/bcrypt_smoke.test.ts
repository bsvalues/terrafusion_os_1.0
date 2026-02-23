/**
 * Bucket C Smoke Test: bcrypt hash/compare contract
 *
 * Purpose: Verify bcrypt 6.x maintains the expected API contract
 * before merging PR #189 (bcrypt 5.1.1 → 6.0.0)
 *
 * Skips entirely if bcrypt isn't installed (graceful degradation).
 */
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

async function importBcrypt() {
  const entry = require.resolve('bcrypt');
  return import(entry);
}

async function hasBcrypt(): Promise<boolean> {
  try {
    require.resolve('bcrypt');
    return true;
  } catch {
    return false;
  }
}

const hasDep = await hasBcrypt();

describe.skipIf(!hasDep)('optional-deps: bcrypt smoke', () => {
  it('hash/compare contract holds', async () => {
    const bcrypt = await importBcrypt();
    const pw = 'terraFusion🔒';
    const hash = await bcrypt.hash(pw, 10);

    // Hash should be a string with expected bcrypt format.
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(10);
    expect(hash).toMatch(/^\$2[aby]?\$/); // bcrypt prefix

    // compare() should return true for correct password.
    expect(await bcrypt.compare(pw, hash)).toBe(true);

    // compare() should return false for wrong password.
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });

  it('getRounds returns expected value', async () => {
    const bcrypt = await importBcrypt();
    const hash = await bcrypt.hash('test', 12);
    expect(bcrypt.getRounds(hash)).toBe(12);
  });
});
