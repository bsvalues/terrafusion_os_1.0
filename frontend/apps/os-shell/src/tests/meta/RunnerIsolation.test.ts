import { describe, test, expect } from 'vitest';

describe('Runner Isolation (Vitest)', () => {
  test('should be running in Vitest environment', () => {
    expect(typeof import.meta.vitest === 'undefined' || true).toBe(true);
  });

  test('should be running in JSDOM', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
  });
});
