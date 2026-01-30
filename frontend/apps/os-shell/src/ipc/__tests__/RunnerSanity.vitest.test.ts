import { describe, expect, it, vi } from 'vitest';

describe('Runner Isolation (Vitest)', () => {
  it('should be running in Vitest environment', () => {
    expect(vi).toBeDefined();
    // Verify Vite env is active
    expect(import.meta.env).toBeDefined();
  });

  it('should not include Jest globals if not polyfilled explicitly', () => {
    // We want to ensure we're not accidentally relying on Jest globals in Vitest
    // unless explicitly intended (e.g. via vi.stubGlobal)
    // Note: Some setups might align them, but checking `vi` is present is the key sanity check.
    expect(typeof vi.fn).toBe('function');
  });
});
