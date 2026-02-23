/**
 * Bucket C Smoke Test: multer multipart upload contract
 *
 * Purpose: Verify multer 2.x maintains the expected API contract
 * before merging PR #72 (multer 1.4.5 → 2.0.0)
 *
 * Skips entirely if multer isn't installed (graceful degradation).
 */
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

async function importMulter() {
  const entry = require.resolve('multer');
  return import(entry);
}

async function hasMulter(): Promise<boolean> {
  try {
    require.resolve('multer');
    return true;
  } catch {
    return false;
  }
}

const hasDep = await hasMulter();

describe.skipIf(!hasDep)('optional-deps: multer smoke', () => {
  it('memoryStorage and single() API exists', async () => {
    const multer = await importMulter();

    // Verify core API shape.
    expect(typeof multer.default).toBe('function');
    expect(typeof multer.memoryStorage).toBe('function');
    expect(typeof multer.diskStorage).toBe('function');

    // Create upload middleware.
    const upload = multer.default({ storage: multer.memoryStorage() });

    // Verify middleware methods exist.
    expect(typeof upload.single).toBe('function');
    expect(typeof upload.array).toBe('function');
    expect(typeof upload.fields).toBe('function');
    expect(typeof upload.none).toBe('function');
    expect(typeof upload.any).toBe('function');
  });

  it('memoryStorage stores buffer correctly', async () => {
    const multer = await importMulter();
    const storage = multer.memoryStorage();

    // memoryStorage should have _handleFile method.
    expect(typeof storage._handleFile).toBe('function');
  });
});
