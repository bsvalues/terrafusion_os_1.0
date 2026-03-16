import { vi, describe, it, expect, beforeEach } from 'vitest';
import { probeHealth } from '../sentinelProbe';

const mockFetch = vi.fn() as vi.MockedFunction<typeof fetch>;

describe('probeHealth', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (global as any).fetch = mockFetch;
  });

  it('maps a healthy payload with intent filter', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'Healthy',
        moduleCount: 3,
        healthyModules: 3,
        warnings: [],
        systemComponents: { ModuleLoader: true, LegacyIntegration: true, AISwarm: false },
        intentFilter: 'gen2',
        moduleCountActive: 3,
        moduleCountTotal: 13,
        moduleCountFilteredOut: 10,
      }),
    } as Response);

    const result = await probeHealth('/api/system/health', 1000);

    expect(result.ok).toBe(true);
    expect(result.status).toBe('healthy');
    expect(result.intentFilter).toBe('gen2');
    expect(result.moduleCountActive).toBe(3);
    expect(result.moduleCountTotal).toBe(13);
    expect(result.moduleCountFilteredOut).toBe(10);
    expect(result.systemComponents?.ModuleLoader).toBe(true);
    expect(result.systemComponents?.AISwarm).toBe(false);
  });

  it('falls back to moduleCount when moduleCountActive is missing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'Healthy',
        moduleCount: 5,
        healthyModules: 5,
        warnings: [],
        systemComponents: {},
      }),
    } as Response);

    const result = await probeHealth('/api/system/health', 1000);

    expect(result.ok).toBe(true);
    expect(result.status).toBe('healthy');
    expect(result.moduleCountActive).toBe(5);
    expect(result.intentFilter).toBeNull();
  });

  it('marks probe as degraded on HTTP failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const result = await probeHealth('/api/system/health', 1000);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('degraded');
    expect(result.warnings[0]).toMatch(/500/);
  });

  it('marks probe as down on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network Error'));

    const result = await probeHealth('/api/system/health', 1000);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('down');
    expect(result.warnings.join(' ')).toMatch(/Network Error/);
  });

  it('adds warning when no active modules are loaded', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'Healthy',
        moduleCount: 0,
        healthyModules: 0,
        warnings: [],
        systemComponents: {},
        moduleCountActive: 0,
      }),
    } as Response);

    const result = await probeHealth('/api/system/health', 1000);

    expect(result.ok).toBe(true);
    expect(result.warnings.join(' ')).toMatch(/No active modules loaded/);
  });
});
