import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPilotTrace, invokePilotTool, listPilotTraces } from '../../api/pilotApi';

vi.mock('../../auth/session', () => ({
  getSession: () => null,
}));

vi.mock('../../shared/viteEnv', () => ({
  getViteEnv: () => ({}),
}));

describe('pilotApi trace normalization', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps tool_completed to tool_succeeded for trace detail responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          events: [
            {
              eventId: 'evt-1',
              type: 'tool_completed',
              toolId: 'explain_value_change',
              correlationId: 'corr-1',
              summary: 'Completed explain_value_change',
              timestamp: '2026-03-18T00:00:00.000Z',
              context: { countyId: 'benton', userId: 'u-1', mode: 'muse' },
            },
          ],
        }),
      })
    );

    const response = await getPilotTrace('corr-1');

    expect(response.events[0]?.type).toBe('tool_succeeded');
  });

  it('maps tool_completed to tool_succeeded for trace list responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          events: [
            {
              eventId: 'evt-2',
              type: 'tool_completed',
              toolId: 'summarize_dossier',
              correlationId: 'corr-2',
              summary: 'Completed summarize_dossier',
              timestamp: '2026-03-18T00:00:01.000Z',
              context: { countyId: 'benton', userId: 'u-1', mode: 'muse', parcelId: 'P-1' },
            },
          ],
          pagination: {
            offset: 0,
            limit: 20,
            returned: 1,
          },
        }),
      })
    );

    const response = await listPilotTraces({ parcelId: 'P-1' });

    expect(response.events[0]?.type).toBe('tool_succeeded');
  });

  it('invokes tools through the backend /api/pilot/invoke route', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          correlationId: 'corr-invoke',
          result: { accepted: true },
        }),
      })
    );

    await invokePilotTool({
      toolId: 'explain_value_change',
      params: { parcelId: 'P-1' },
      mode: 'muse',
    });

    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe('/api/pilot/invoke');
  });
});
