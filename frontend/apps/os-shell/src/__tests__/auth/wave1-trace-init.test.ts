import { describe, expect, it, beforeEach, vi } from 'vitest';

beforeEach(() => { vi.resetModules(); });

describe('terraTrace: getTraceContext() accessor', () => {
  it('is exported', async () => {
    const mod = await import('@/services/terraTrace');
    expect(typeof mod.getTraceContext).toBe('function');
  });
  it('returns countyId and actor set by initTraceContext', async () => {
    const { initTraceContext, getTraceContext } = await import('@/services/terraTrace');
    initTraceContext('benton', 'appraiser-001');
    const ctx = getTraceContext();
    expect(ctx.countyId).toBe('benton');
    expect(ctx.actor).toBe('appraiser-001');
  });
  it('returns strings before init (no undefined)', async () => {
    const { getTraceContext } = await import('@/services/terraTrace');
    const ctx = getTraceContext();
    expect(typeof ctx.countyId).toBe('string');
    expect(typeof ctx.actor).toBe('string');
  });
});

describe('terraTrace: initTraceContext null-safety', () => {
  it('accepts empty strings without throwing', async () => {
    const { initTraceContext } = await import('@/services/terraTrace');
    expect(() => initTraceContext('', '')).not.toThrow();
  });
});
