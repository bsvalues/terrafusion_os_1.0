import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { setToken, clearToken } from '../../auth/authStorage';
import { runCanonPing } from '../canonPing';
import { runCanonDoctor } from '../canonDoctor';
import { runCanonGateFast } from '../canonGateFast';
import { fetchCorpusStatus } from '../canonFs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GateRunnerPanel } from '../../canon/GateRunnerPanel';

describe('conference Canon authenticated same-origin transport', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubEnv('VITE_WASHINGTON_CONFERENCE_LOCAL_PACKAGE', 'true');
    vi.stubEnv('VITE_API_URL', 'https://not-a-conference-runtime.invalid');
    setToken('synthetic-conference-session');
    fetchMock.mockReset().mockImplementation(
      async () =>
        new Response('{"overallOk":true,"ok":true}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
    );
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    clearToken();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  it.each([
    ['ping', () => runCanonPing('local')],
    ['doctor', () => runCanonDoctor()],
    ['gatefast', () => runCanonGateFast()],
    ['corpus', () => fetchCorpusStatus()],
  ] as const)(
    'routes %s through authenticated API, never the dev/static origin',
    async (action, run) => {
      await run();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`/api/pilot/canon/${action}`);
      expect(new Headers(options.headers).get('Authorization')).toBe(
        'Bearer synthetic-conference-session'
      );
      expect(options.method).toBe('POST');
    }
  );
  it('preserves the non-conference development transport', async () => {
    vi.stubEnv('VITE_WASHINGTON_CONFERENCE_LOCAL_PACKAGE', 'false');
    await fetchCorpusStatus();
    expect(fetchMock.mock.calls[0][0]).toBe('/pilot/canon/corpus');
  });
  it('discloses the portable gate boundary without claiming that all gates passed', () => {
    const markup = renderToStaticMarkup(React.createElement(GateRunnerPanel));
    expect(markup).toContain('terracanon-conference-gate-scope');
    expect(markup).toContain('outside portable conference acceptance');
    expect(markup).not.toContain('Pipeline PASS');
    vi.stubEnv('VITE_WASHINGTON_CONFERENCE_LOCAL_PACKAGE', 'false');
    expect(renderToStaticMarkup(React.createElement(GateRunnerPanel))).not.toContain('terracanon-conference-gate-scope');
  });
});
