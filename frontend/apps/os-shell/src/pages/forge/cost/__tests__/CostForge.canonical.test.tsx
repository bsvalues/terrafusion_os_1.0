import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCalcRCNLD } from '@/hooks/useCostForgeHooks';

const runtime = vi.hoisted(() => ({ fetch: vi.fn(), session: { userId: 'staff', countyId: 'benton', parcelId: 'SYNTHETIC-001' } }));
vi.mock('@/lib/apiBase', () => ({ apiFetch: runtime.fetch }));
vi.mock('@/auth/session', () => ({ getSession: () => runtime.session }));

const input = { lrsn: null, pin: 'SYNTHETIC-001', county_id: 'benton', imprv_det_type_cd: null,
  yr_built: 2000, area_sqft: 1000, condition_code: null, construction_class_raw: null,
  use_code: null, section_id: null, occupancy_code: null, is_residential: true, revalArea: 'Reval Area 1' };
const parcelResolution = { requestedReference: 'SYNTHETIC-001', parcelId: 'SYNTHETIC-001', parcelNumber: 'NUMBER-001', countyId: 'benton' };
const response = { parcelResolution, canonical: { schemaVersion: '1.0.0', parcelId: 'SYNTHETIC-001', rcnld: 95040, replacementCost: 132000,
  rcnPerSqft: 132, rcndPerSqft: 105.6, adjustedCostPerSqft: 95.04, physicalDepreciation: 26400, conditionAdjustment: -10560,
  landValue: 25000, totalValue: 120040 }, provenance: { countyId: 'benton', parcelId: 'SYNTHETIC-001',
  sourceCommit: 'a'.repeat(40), executableSha256: 'b'.repeat(64), inputHash: 'c'.repeat(64),
  stdoutSha256: 'd'.repeat(64), auditEventId: 'event', requestId: 'request' } };

describe('canonical Cost production action', () => {
  beforeEach(() => { runtime.fetch.mockReset(); runtime.session = { userId: 'staff', countyId: 'benton', parcelId: 'SYNTHETIC-001' }; });
  it.each(['SYNTHETIC-001', 'NUMBER-001'])('accepts a uniquely resolved reference %s when ID and number differ', async reference => {
    runtime.fetch.mockResolvedValue({ ok: true, json: async () => ({ ...response,
      parcelResolution: { ...parcelResolution, requestedReference: reference } }) });
    const { result } = renderHook(() => useCalcRCNLD());
    await act(async () => result.current.calculate({ ...input, pin: reference }));
    expect(result.current.error).toBeNull();
    expect(result.current.result?.provenance?.parcelId).toBe('SYNTHETIC-001');
    expect(result.current.result?.rcnld).toBe(95040);
  });
  it.each([undefined, { ...parcelResolution, requestedReference: 'OTHER' },
    { ...parcelResolution, parcelId: 'OTHER' }, { ...parcelResolution, countyId: 'OTHER' },
    { ...parcelResolution, requestedReference: 'NUMBER-001', parcelNumber: 'OTHER' }])
  ('rejects absent or inconsistent requested-to-resolved proof %j', async resolution => {
    runtime.fetch.mockResolvedValue({ ok: true, json: async () => ({ ...response, parcelResolution: resolution }) });
    const { result } = renderHook(() => useCalcRCNLD());
    await act(async () => result.current.calculate({ ...input, pin: resolution?.requestedReference === 'NUMBER-001' ? 'NUMBER-001' : input.pin }));
    expect(result.current.result).toBeNull();
    expect(result.current.error).toContain('provenance');
  });
  it('rejects canonical/provenance disagreement despite a valid number resolution', async () => {
    runtime.fetch.mockResolvedValue({ ok: true, json: async () => ({ ...response,
      parcelResolution: { ...parcelResolution, requestedReference: 'NUMBER-001' },
      provenance: { ...response.provenance, parcelId: 'OTHER' } }) });
    const { result } = renderHook(() => useCalcRCNLD());
    await act(async () => result.current.calculate({ ...input, pin: 'NUMBER-001' }));
    expect(result.current.result).toBeNull();
  });
  it('retains the actual response CID for a header-only failure and clears it on reset', async () => {
    runtime.fetch.mockResolvedValue({ ok: false, status: 503,
      headers: new Headers({ 'X-Correlation-ID': 'tf-real-failure' }), json: async () => ({ code: 'CANONICAL_RUNTIME_UNAVAILABLE' }) });
    const { result } = renderHook(() => useCalcRCNLD());
    await act(async () => result.current.calculate(input));
    expect(result.current.errorCorrelationId).toBe('tf-real-failure');
    expect(result.current.result).toBeNull();
    act(() => result.current.reset());
    expect(result.current.errorCorrelationId).toBeNull();
  });
  it('sends the actual backend request shape and uses canonical result numbers', async () => {
    runtime.fetch.mockResolvedValue({ ok: true, json: async () => response });
    const { result } = renderHook(() => useCalcRCNLD());
    await act(async () => result.current.calculate(input));
    expect(JSON.parse(runtime.fetch.mock.calls[0][1].body)).toMatchObject({
      parcelNumber: 'SYNTHETIC-001', countyCode: 'benton', squareFeet: 1000, yearBuilt: 2000, region: 'Reval Area 1' });
    expect(result.current.result?.rcnld).toBe(95040);
  });
  it('reset invalidates an outstanding request even if it completes after abort', async () => {
    let finish!: (value: unknown) => void;
    runtime.fetch.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const { result } = renderHook(() => useCalcRCNLD());
    let pending!: Promise<void>;
    act(() => { pending = result.current.calculate(input); });
    act(() => result.current.reset());
    await act(async () => { finish({ ok: true, json: async () => response }); await pending; });
    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
  it('context changes and server failures clear an earlier canonical result', async () => {
    runtime.fetch.mockResolvedValueOnce({ ok: true, json: async () => response });
    const { result, rerender } = renderHook(() => useCalcRCNLD());
    await act(async () => result.current.calculate(input));
    runtime.session = { ...runtime.session, countyId: 'other' }; rerender();
    await waitFor(() => expect(result.current.result).toBeNull());
    runtime.fetch.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ code: 'CANONICAL_RUNTIME_UNAVAILABLE' }) });
    await act(async () => result.current.calculate({ ...input, county_id: 'other' }));
    expect(result.current.result).toBeNull();
    expect(result.current.error).toContain('CANONICAL_RUNTIME_UNAVAILABLE');
  });
  it.each(['rcnPerSqft', 'rcndPerSqft', 'adjustedCostPerSqft', 'replacementCost',
    'physicalDepreciation', 'conditionAdjustment', 'landValue', 'totalValue'])('rejects missing canonical %s instead of displaying a partial value', async field => {
    runtime.fetch.mockResolvedValue({ ok: true, json: async () => ({ ...response,
      canonical: { ...response.canonical, [field]: null } }) });
    const { result } = renderHook(() => useCalcRCNLD());
    await act(async () => result.current.calculate(input));
    expect(result.current.result).toBeNull();
    expect(result.current.error).toContain('provenance');
  });
  it.each([{ countyId: 'other-county' }, { stdoutSha256: 'missing' }, { auditEventId: '' }])('rejects mismatched or incomplete execution context %j', async invalid => {
    runtime.fetch.mockResolvedValue({ ok: true, json: async () => ({ ...response,
      provenance: { ...response.provenance, ...invalid } }) });
    const { result } = renderHook(() => useCalcRCNLD());
    await act(async () => result.current.calculate(input));
    expect(result.current.result).toBeNull();
    expect(result.current.error).toContain('provenance');
  });
});
