import { describe, it, expect } from 'vitest';

describe('Basic Test Suite', () => {
  it('should perform basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toHaveLength(5);
    expect([1, 2, 3]).toContain(2);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve(42);
    await expect(promise).resolves.toBe(42);
  });

  it('should check environment setup', () => {
    expect(global).toBeDefined();
    expect(global.testUtils).toBeDefined();
    expect(global.complianceUtils).toBeDefined();
  });
});