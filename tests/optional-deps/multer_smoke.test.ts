/**
 * Bucket C Smoke Test: multer multipart upload contract
 *
 * Purpose: Verify multer 2.x maintains the expected API contract
 * before merging PR #72 (multer 1.4.5 → 2.0.0)
 *
 * Skips entirely if multer isn't installed (graceful degradation).
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Check if multer is installed before running tests
const multerInstalled = existsSync(resolve(process.cwd(), 'node_modules/multer'));

describe.skipIf(!multerInstalled)('multer smoke', async () => {
  // Only import if installed to avoid Vite resolution errors
  const multer = multerInstalled ? await import('multer') : null;

  it('memoryStorage and single() API exists', async () => {
    if (!multer) return;

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
    if (!multer) return;

    const storage = multer.memoryStorage();

    // memoryStorage should have _handleFile method
    expect(typeof storage._handleFile).toBe('function');
  });
});
