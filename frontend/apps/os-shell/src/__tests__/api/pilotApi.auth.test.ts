import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { explain } from '../../services/pilotApi';

vi.mock('@/services/terraTrace', () => ({
  generateCorrelationId: () => 'corr-auth',
  emitToolInvoked: vi.fn(),
  emitToolSucceeded: vi.fn(),
  emitToolFailed: vi.fn(),
}));

describe('services/pilotApi auth headers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends bearer auth on protected explain requests', async () => {
    localStorage.setItem('authToken', 'owner-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          explanation: 'ok',
          sources: [],
          confidence: 0.9,
          traceId: 'trace-1',
        }),
      })
    );

    await explain({
      query: 'why did value change?',
      countyId: 'benton',
      actorId: 'operator',
      source: 'terra-pilot',
    });

    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer owner-token',
    });
  });
});
