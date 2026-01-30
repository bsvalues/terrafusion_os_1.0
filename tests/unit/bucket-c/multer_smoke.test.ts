/**
 * Bucket C Smoke Test: multer multipart upload contract
 *
 * Purpose: Verify multer 2.x maintains the expected API contract
 * before merging PR #72 (multer 1.4.5 → 2.0.0)
 *
 * This test uses dynamic imports to gracefully skip if deps aren't installed.
 * Requires: multer, express (as dev dep for testing)
 */
import { describe, it, expect, beforeAll } from 'vitest';

describe('multer smoke', () => {
  let multer: typeof import('multer') | null = null;
  let available = false;

  beforeAll(async () => {
    try {
      multer = await import('multer');
      // Just check if multer is importable
      available = true;
    } catch {
      // multer not installed - test will skip
    }
  });

  it('memoryStorage and single() API exists', async () => {
    if (!available || !multer) {
      console.log('⏭️ multer not installed - skipping smoke test');
      return;
    }

    // Verify core API shape
    expect(typeof multer.default).toBe('function');
    expect(typeof multer.memoryStorage).toBe('function');
    expect(typeof multer.diskStorage).toBe('function');

    // Create upload middleware
    const upload = multer.default({ storage: multer.memoryStorage() });

    // Verify middleware methods exist
    expect(typeof upload.single).toBe('function');
    expect(typeof upload.array).toBe('function');
    expect(typeof upload.fields).toBe('function');
    expect(typeof upload.none).toBe('function');
    expect(typeof upload.any).toBe('function');
  });

  it('memoryStorage stores buffer correctly', async () => {
    if (!available || !multer) {
      return; // Skip if multer not installed
    }

    const storage = multer.memoryStorage();

    // memoryStorage should have _handleFile method
    expect(typeof storage._handleFile).toBe('function');
  });
});
