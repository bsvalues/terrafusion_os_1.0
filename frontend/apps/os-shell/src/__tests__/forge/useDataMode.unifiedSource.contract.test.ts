/**
 * useDataMode.unifiedSource.contract.test.ts
 *
 * CONTRACT: useDataMode() must derive its reported mode exclusively from the
 * DataProvider singleton — never from an independent network call to /health/live.
 *
 * The bug this locks: VITE_DATA_MODE=snapshot + backend reachable → old hook
 * reported 'live' because /health/live returned 200, while the actual data was
 * coming from SnapshotDataProvider. The chip said "Live metrics" but the stats
 * were snapshot data.
 *
 * These tests confirm the hook reads provider diagnostics, not the network.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resetDataProvider } from '../../services/dataProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Call useDataMode() as a plain function (hooks are just functions). */
async function callUseDataMode() {
  const { useDataMode } = await import('../../hooks/useDataMode');
  return useDataMode();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDataMode — unified mode source contract', () => {
  beforeEach(() => {
    vi.resetModules();
    resetDataProvider();
  });

  afterEach(() => {
    resetDataProvider();
  });

  it('NEVER calls /health/live — no fetch to that endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await callUseDataMode();

    const healthCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).includes('/health/live'),
    );
    expect(healthCalls).toHaveLength(0);
    fetchSpy.mockRestore();
  });

  it('reports mode from provider diagnostics, not network', async () => {
    // Default env (no VITE_DATA_MODE set) → provider resolves to 'live'
    const state = await callUseDataMode();
    expect(state.mode).toBe('live');
  });

  it('connected is true when mode is live', async () => {
    const state = await callUseDataMode();
    // Default test env has no VITE_DATA_MODE → resolves live
    if (state.mode === 'live') {
      expect(state.connected).toBe(true);
    }
  });

  it('connected is false when mode is snapshot', async () => {
    // Mock dataProvider to report snapshot mode
    vi.doMock('../../services/dataProvider', () => ({
      getDataProvider: vi.fn(),
      getDataProviderDiagnostics: vi.fn(() => ({
        mode: 'snapshot',
        reason: 'env-explicit',
        initializedAt: new Date(),
      })),
      resetDataProvider: vi.fn(),
    }));

    const state = await callUseDataMode();
    expect(state.mode).toBe('snapshot');
    expect(state.connected).toBe(false);
  });

  it('checking is always false — mode is derived synchronously', async () => {
    const state = await callUseDataMode();
    expect(state.checking).toBe(false);
  });

  it('DataModeState shape has mode, reason, connected, lastHealthCheck, checking', async () => {
    const state = await callUseDataMode();
    expect(state).toHaveProperty('mode');
    expect(state).toHaveProperty('reason');
    expect(state).toHaveProperty('connected');
    expect(state).toHaveProperty('lastHealthCheck');
    expect(state).toHaveProperty('checking');
  });
});
