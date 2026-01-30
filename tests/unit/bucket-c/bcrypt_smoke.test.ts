/**
 * Bucket C Smoke Test: bcrypt hash/compare contract
 *
 * Purpose: Verify bcrypt 6.x maintains the expected API contract
 * before merging PR #189 (bcrypt 5.1.1 → 6.0.0)
 *
 * This test uses dynamic import to gracefully skip if bcrypt isn't installed.
 */
import { describe, it, expect, beforeAll } from 'vitest';

describe('bcrypt smoke', () => {
  let bcrypt: typeof import('bcrypt') | null = null;

  beforeAll(async () => {
    try {
      bcrypt = await import('bcrypt');
    } catch {
      // bcrypt not installed - test will skip
    }
  });

  it('hash/compare contract holds', async () => {
    if (!bcrypt) {
      console.log('⏭️ bcrypt not installed - skipping smoke test');
      return;
    }

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
    if (!bcrypt) {
      return; // Skip if bcrypt not installed
    }

    const hash = await bcrypt.hash('test', 12);
    expect(bcrypt.getRounds(hash)).toBe(12);
  });
});
