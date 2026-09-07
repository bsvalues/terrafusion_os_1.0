import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invokePilotTool, invokeTool } from '../../api/pilotApi';

describe('Pilot caller identity', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it.each(['network', 'empty401', 'invalidJson', 'unsafeHeader'])('retains the actual request or valid response CID when %s loses the envelope', async failure => {
    let sentCid = '';
    vi.stubGlobal('fetch', async (_: unknown, init: RequestInit) => {
      sentCid = new Headers(init.headers).get('X-Correlation-ID')!;
      if (failure === 'network') throw new TypeError('Network disconnected');
      return new Response('', { status: failure === 'empty401' ? 401 : 200,
        headers: { 'X-Correlation-ID': failure === 'unsafeHeader' ? 'unsafe/cid' : 'tf-returned-cid' } });
    });
    const response = await invokeTool({ toolId: 'export_equalization_package', params: {} });
    expect(response.success).toBe(false);
    expect(response.correlationId).toBe(failure === 'network' || failure === 'unsafeHeader' ? sentCid : 'tf-returned-cid');
    expect(response.metrics).toBeUndefined();
    expect(response.error?.code).toBe(failure === 'network' ? 'NETWORK_ERROR' : failure === 'empty401' ? 'HTTP_401' : 'RESPONSE_ERROR');
  });

  it.each([true, false])('preserves measured runtime evidence for normalized success=%s', async ok => {
    const metrics = { operation: 'generate_morning_brief', correlationId: 'corr-measured', durationMs: 12.5, measurement: 'pilot-request-to-response', environment: 'development', ok, errorCode: ok ? null : 'PERMISSION_DENIED' };
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ ok, correlationId: metrics.correlationId, result: ok ? { brief: {} } : undefined, errorCode: metrics.errorCode, error: ok ? undefined : 'Denied', metrics })));
    const response = await invokeTool({ toolId: 'generate_morning_brief', params: {}, mode: 'muse' });
    expect(response.success).toBe(ok);
    expect(response.metrics).toEqual(metrics);
  });

  it.each(['generate_morning_brief', 'open_appeal_packet', 'export_equalization_package', 'export_audit_bundle'])('preserves all Development issuer roles for %s without substituting an office or role', async toolId => {
    // Mirrors the released Development-only issuer shape; not proof of a live-issued JWT.
    const roles = ['Developer', 'Assessor', 'GovernmentUser', 'appraiser'];
    const token = `e30.${btoa(JSON.stringify({ sub: 'development-operator', countyId: '20200020-2020-2020-2020-202020202020', roles }))}.signature`;
    localStorage.setItem('authToken', token);
    localStorage.setItem('tf.session.dev', JSON.stringify({ userId: 'old-user', countyId: 'benton', role: 'appraiser' }));
    let headers = new Headers();
    vi.stubGlobal('fetch', async (_: unknown, init: RequestInit) => {
      headers = new Headers(init.headers);
      return new Response(JSON.stringify({ ok: true, result: {}, correlationId: 'corr-issuer-roles' }));
    });
    await invokePilotTool({ toolId, mode: toolId === 'generate_morning_brief' ? 'muse' : 'pilot', params: {} });
    expect(headers.get('x-role')).toBe('Developer,Assessor,GovernmentUser,appraiser');
    expect(headers.get('x-county-id')).toBe('20200020-2020-2020-2020-202020202020');
    expect(headers.get('x-user-id')).toBe('development-operator');
    expect(headers.get('Authorization') === `Bearer ${token}`).toBe(true);
    expect(headers.has('x-office-id')).toBe(false);
    expect(headers.get('X-Correlation-ID')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it.each([
    { roles: [], expected: null },
    { roles: ['Developer'], expected: 'Developer' },
    { roles: ['Developer', 'Assessor', 'GovernmentUser'], expected: 'Developer,Assessor,GovernmentUser' },
  ])('does not invent a canonical role when JWT roles are $roles', async ({ roles, expected }) => {
    const token = `e30.${btoa(JSON.stringify({ sub: 'unmapped-operator', countyId: '20200020-2020-2020-2020-202020202020', roles }))}.signature`;
    localStorage.setItem('authToken', token);
    localStorage.setItem('tf.session.dev', JSON.stringify({ role: 'appraiser' }));
    let headers = new Headers();
    vi.stubGlobal('fetch', async (_: unknown, init: RequestInit) => {
      headers = new Headers(init.headers);
      return new Response(JSON.stringify({ ok: false, error: 'Denied', correlationId: 'corr-unmapped' }));
    });
    await invokePilotTool({ toolId: 'export_audit_bundle', params: {} });
    expect(headers.get('x-role')).toBe(expected);
    expect(headers.has('x-office-id')).toBe(false);
  });

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
