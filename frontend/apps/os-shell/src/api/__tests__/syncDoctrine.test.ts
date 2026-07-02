/**
 * WO-P8-MGMT-003 — Sync Doctrine API client conformance.
 *
 * Guards Invariant B (see src/lib/apiBase.ts): call sites pass BARE paths
 * (no /api prefix, no absolute VITE_API_URL base). The client must delegate
 * to the canonical apiFetch/apiFetchJson helpers so every request rides the
 * relative /api proxy path — the same convention every other os-shell client
 * uses. This prevents the "no single VITE_API_URL lights up all surfaces"
 * split that WO-P8-MGMT-002 documented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiFetchJson = vi.fn();
const apiFetch = vi.fn();

vi.mock('@/lib/apiBase', () => ({
  apiFetchJson: (...args: unknown[]) => apiFetchJson(...args),
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

import {
  getDoctrineState,
  getDoctrineLanes,
  getDoctrineBatch,
  postDoctrineDrain,
} from '../syncDoctrine';

function assertBareSyncPath(path: unknown): asserts path is string {
  expect(typeof path).toBe('string');
  const p = path as string;
  // Invariant B: bare path, no /api prefix, not an absolute URL.
  expect(p.startsWith('/sync/doctrine/')).toBe(true);
  expect(p.startsWith('/api')).toBe(false);
  expect(p).not.toMatch(/^https?:\/\//i);
}

describe('syncDoctrine API client — Invariant B conformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDoctrineState calls apiFetchJson with a bare /sync path + query', async () => {
    apiFetchJson.mockResolvedValue({ operational: true });
    await getDoctrineState(25);
    expect(apiFetchJson).toHaveBeenCalledTimes(1);
    const [path] = apiFetchJson.mock.calls[0];
    assertBareSyncPath(path);
    expect(path).toBe('/sync/doctrine/state?recentGateLimit=25');
  });

  it('getDoctrineState forwards the abort signal via init', async () => {
    apiFetchJson.mockResolvedValue({});
    const ctrl = new AbortController();
    await getDoctrineState(10, ctrl.signal);
    const [path, init] = apiFetchJson.mock.calls[0];
    expect(path).toBe('/sync/doctrine/state?recentGateLimit=10');
    expect(init).toMatchObject({ signal: ctrl.signal });
  });

  it('getDoctrineLanes uses the bare /sync/doctrine/lanes path', async () => {
    apiFetchJson.mockResolvedValue({ lanes: [] });
    await getDoctrineLanes();
    const [path] = apiFetchJson.mock.calls[0];
    assertBareSyncPath(path);
    expect(path).toBe('/sync/doctrine/lanes');
  });

  it('getDoctrineBatch encodes the id inside a bare /sync path', async () => {
    apiFetchJson.mockResolvedValue({});
    await getDoctrineBatch('batch 1/2');
    const [path] = apiFetchJson.mock.calls[0];
    assertBareSyncPath(path);
    expect(path).toBe('/sync/doctrine/batch/batch%201%2F2');
  });

  it('postDoctrineDrain posts to a bare /sync path and parses the envelope on HTTP 500', async () => {
    apiFetch.mockResolvedValue({
      status: 500,
      text: async () => JSON.stringify({ lane: 'parcel', status: 'Failed', batchIds: [] }),
    });
    const res = await postDoctrineDrain('parcel', { operatorName: 'operator' });
    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path, init] = apiFetch.mock.calls[0];
    assertBareSyncPath(path);
    expect(path).toBe('/sync/doctrine/drain/parcel');
    expect((init as RequestInit).method).toBe('POST');
    expect(res.status).toBe('Failed');
  });

  it('postDoctrineDrain returns the parsed envelope on HTTP 200 success', async () => {
    apiFetch.mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({ lane: 'sales', status: 'Succeeded', batchIds: ['b1'] }),
    });
    const res = await postDoctrineDrain('sales', {
      operatorName: 'operator',
      fullCorpus: false,
      topN: 200,
    });
    expect(res.status).toBe('Succeeded');
    expect(res.batchIds).toEqual(['b1']);
  });
});
