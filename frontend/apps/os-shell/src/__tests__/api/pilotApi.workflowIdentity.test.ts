import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invokePilotTool } from '../../api/pilotApi';

describe('Pilot caller identity', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('sends JWT county/user/role instead of a contradictory development session', async () => {
    const token = `e30.${btoa(JSON.stringify({ sub: 'operator-2', countyId: '20200020-2020-2020-2020-202020202020', roles: ['appraiser'] }))}.signature`;
    localStorage.setItem('authToken', token);
    localStorage.setItem('tf.session.dev', JSON.stringify({ userId: 'old-user', countyId: 'benton', role: 'admin' }));
    let headers = new Headers();
    vi.stubGlobal('fetch', async (_: unknown, init: RequestInit) => {
      headers = new Headers(init.headers);
      return new Response(JSON.stringify({ ok: true, result: {}, correlationId: 'corr-jwt' }));
    });
    await invokePilotTool({ toolId: 'generate_morning_brief', mode: 'muse', params: {} });
    expect(headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(headers.get('x-county-id')).toBe('20200020-2020-2020-2020-202020202020');
    expect(headers.get('x-user-id')).toBe('operator-2');
    expect(headers.get('x-role')).toBe('appraiser');
  });

  it('does not supply development identity when a bearer token has missing claims', async () => {
    localStorage.setItem('authToken', 'invalid-token');
    localStorage.setItem('tf.session.dev', JSON.stringify({ userId: 'old-user', countyId: 'benton', role: 'admin' }));
    let headers = new Headers();
    vi.stubGlobal('fetch', async (_: unknown, init: RequestInit) => {
      headers = new Headers(init.headers);
      return new Response(JSON.stringify({ ok: false, error: 'Denied', correlationId: 'corr-denied' }));
    });
    await invokePilotTool({ toolId: 'export_equalization_package', params: {} });
    expect(headers.has('x-county-id')).toBe(false);
    expect(headers.has('x-user-id')).toBe(false);
    expect(headers.has('x-role')).toBe(false);
  });
});
