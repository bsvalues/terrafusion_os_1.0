import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SpatialAnomalyPanel } from '../../components/atlas/SpatialAnomalyPanel';
import { MemoryRouter } from 'react-router-dom';
import AtlasSuiteHome from '../../pages/suites/AtlasSuiteHome';
import PropertyAtlas from '../../pages/workbench/tabs/PropertyAtlas';

const state = vi.hoisted(() => ({ countyId: '11111111-1111-1111-1111-111111111111', authenticated: true, invoke: vi.fn() }));
vi.mock('../../auth/useAuthContext', async () => ({
  ...await vi.importActual<typeof import('../../auth/useAuthContext')>('../../auth/useAuthContext'),
  useAuthContextOptional: () => ({ isAuthenticated: state.authenticated, countyId: state.countyId }),
}));
vi.mock('../../api/pilotApi', () => ({ invokeTool: (...args: unknown[]) => state.invoke(...args) }));
vi.mock('../../hooks/useCountyStats', () => ({ useCountyStats: () => ({ stats: null, loading: false, error: null, source: null }) }));
vi.mock('../../hooks/useAtlasGis', () => ({
  useParcelGis: () => ({ boundary: { data: null, source: 'unavailable' }, layers: { data: null, source: 'unavailable' } }),
  useParcelBoundary: () => ({ data: null, source: 'unavailable', refetch: vi.fn() }),
  useParcelLayers: () => ({ data: null, source: 'unavailable', refetch: vi.fn() }),
}));
vi.mock('../../context/workbenchTabContext', () => ({ useWorkbenchTab: () => ({ parcelId: 'synthetic-parcel', propertyData: null }) }));

function result(countyId = state.countyId, status = 'OK') {
  return { success: true, correlationId: 'atlas-visible-cid', result: { output: {
    contract: 'atlas.spatial-anomaly', version: '1.0.0', status,
    reason: status === 'OK' ? 'CLUSTERS_FOUND' : 'FIT_SAMPLE_TOO_SMALL',
    request: { countyId, taxYear: 2026, geography: { kind: 'county', id: countyId }, metric: 'residual_cluster' },
    sample: { total: 6, used: 5, excluded: 1 }, hotspotCount: status === 'OK' ? 1 : 0,
    finding: status === 'OK' ? { type: 'RESIDUAL_CLUSTER', clusters: [{ clusterId: 'north', sampleSize: 3, supportCount: 2,
      direction: 'positive', confidence: { kind: 'EVIDENCE_SUPPORT_FRACTION', value: 2 / 3 } }] } : null,
    severity: status === 'OK' ? 'medium' : null, quality: { state: status === 'OK' ? 'SUFFICIENT' : 'INSUFFICIENT', unclusteredCount: 0, excludedCount: 1 },
    confidence: status === 'OK' ? { kind: 'EVIDENCE_SUPPORT_FRACTION', value: 2 / 3 } : null,
    affectedParcelIds: status === 'OK' ? ['synthetic-1', 'synthetic-2'] : [], affectedObservationIds: [],
    actionCategory: status === 'OK' ? 'REVIEW_SPATIAL_SOURCE' : 'COLLECT_DATA', sourceRefs: [],
    policy: { id: 'tf-residual-cluster-advisory-v1', interpretation: 'TERRAFUSION_ADVISORY_NOT_STATISTICAL',
      minimumFitSample: 5, minimumClusterSample: 3, absolutePercentResidual: 20, minimumSupportNumerator: 2, minimumSupportDenominator: 3 },
    canonicalProvenance: { sourceCommit: 'a'.repeat(40), moduleSha256: 'b'.repeat(64), specificationSha256: 'c'.repeat(64) },
    sourceEvidence: { endpoint: '/api/terraforge/regression', requestQuery: 'taxYear=2026', responseSha256: 'd'.repeat(64), responseBody: '{"syntheticSource":true}' },
  } } };
}
function run() {
  fireEvent.change(screen.getByLabelText('Assessment year'), { target: { value: '2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Run spatial review' }));
}

describe('canonical spatial anomaly panel', () => {
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });
  beforeEach(() => { sessionStorage.clear(); state.authenticated = true; state.countyId = '11111111-1111-1111-1111-111111111111'; state.invoke.mockReset(); });

  it('is reachable on the existing suite surface with explicit scope controls', () => {
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByLabelText('Assessment year')).toBeTruthy();
    expect(screen.getByTestId('atlas-spatial-anomaly-panel')).toBeTruthy();
  });

  it('is reachable in the existing parcel workbench with required neighborhood context', () => {
    render(<MemoryRouter><PropertyAtlas /></MemoryRouter>);
    expect(screen.getByLabelText('Neighborhood ID')).toBeTruthy();
    expect(screen.getByTestId('atlas-spatial-anomaly-panel')).toBeTruthy();
  });

  it('does not offer a source query without an authenticated county', () => {
    state.authenticated = false;
    render(<SpatialAnomalyPanel />);
    expect(screen.queryByRole('button', { name: 'Run spatial review' })).toBeNull();
    expect(state.invoke).not.toHaveBeenCalled();
    expect(screen.getByText(/authenticated county/i)).toBeTruthy();
  });

  it('requires explicit neighborhood scope for parcel work instead of inventing membership', async () => {
    state.invoke.mockResolvedValue({ success: false, correlationId: 'neighborhood-cid', error: { message: 'Source unavailable' } });
    render(<SpatialAnomalyPanel parcelId='synthetic-parcel' />);
    run();
    expect(state.invoke).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Neighborhood ID'), { target: { value: 'north' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run spatial review' }));
    await screen.findByText('neighborhood-cid');
    expect(state.invoke).toHaveBeenCalledWith(expect.objectContaining({ parcelId: 'synthetic-parcel', params: expect.objectContaining({ geographyType: 'neighborhood', geographyId: 'north' }) }));
  });

  it('rejects a result whose echoed scope differs from the requested year', async () => {
    const response = result(); response.result.output.request.taxYear = 2025;
    state.invoke.mockResolvedValue(response);
    render(<SpatialAnomalyPanel />); run();
    await screen.findByRole('alert');
    expect(screen.queryByText('CLUSTERS_FOUND')).toBeNull();
    expect(screen.getByText('atlas-visible-cid')).toBeTruthy();
  });

  it('submits authenticated selected scope and shows source, sample, support and full CID', async () => {
    state.invoke.mockResolvedValue(result());
    render(<SpatialAnomalyPanel />); run();
    await screen.findByText('CLUSTERS_FOUND');
    expect(state.invoke).toHaveBeenCalledWith(expect.objectContaining({ toolId: 'explain_spatial_anomaly', params: {
      county: state.countyId, taxYear: 2026, geographyType: 'county', geographyId: state.countyId, metric: 'residual_cluster',
    } }));
    expect(screen.getByText(/5 observations/)).toBeTruthy();
    expect(screen.getByText(/Evidence support/)).toBeTruthy();
    expect(screen.getByText('atlas-visible-cid')).toBeTruthy();
    fireEvent.click(screen.getByText('Inspect source observations'));
    expect(screen.getByText('{"syntheticSource":true}')).toBeTruthy();
  });

  it('sends explicit muse mode through the actual bearer API wire without a session mode default', async () => {
    const api = await vi.importActual<typeof import('../../api/pilotApi')>('../../api/pilotApi');
    localStorage.setItem('authToken', 'synthetic-unit-bearer');
    const requests: RequestInit[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      requests.push(init);
      return new Response(JSON.stringify({ ok: true, correlationId: 'atlas-visible-cid', result: result().result.output }),
        { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    state.invoke.mockImplementation(api.invokeTool);
    render(<SpatialAnomalyPanel />); run();
    await screen.findByText('CLUSTERS_FOUND');
    expect(requests).toHaveLength(1);
    expect(requests[0].headers).toEqual(expect.objectContaining({ Authorization: 'Bearer synthetic-unit-bearer' }));
    expect(requests[0].headers).not.toHaveProperty('x-mode');
    expect(JSON.parse(String(requests[0].body))).toEqual(expect.objectContaining({
      toolId: 'explain_spatial_anomaly', mode: 'muse', params: expect.objectContaining({ county: state.countyId }),
    }));
  });

  it('does not turn insufficient data or malformed output into a successful finding', async () => {
    state.invoke.mockResolvedValueOnce(result(state.countyId, 'INSUFFICIENT_DATA'))
      .mockResolvedValueOnce({ success: true, correlationId: 'malformed-cid', result: { output: 'not json' } });
    render(<SpatialAnomalyPanel />); run();
    await screen.findByText('FIT_SAMPLE_TOO_SMALL');
    expect(screen.queryByText('CLUSTERS_FOUND')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Run spatial review' }));
    await screen.findByRole('alert');
    expect(screen.queryByText('FIT_SAMPLE_TOO_SMALL')).toBeNull();
    expect(screen.getByText('malformed-cid')).toBeTruthy();
  });

  it('discards a late response after county switching', async () => {
    let finish: (value: unknown) => void = () => {};
    const oldResult = result();
    state.invoke.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = render(<SpatialAnomalyPanel />); run();
    state.countyId = '22222222-2222-2222-2222-222222222222';
    view.rerender(<SpatialAnomalyPanel />);
    await act(async () => finish(oldResult));
    expect(screen.queryByText('CLUSTERS_FOUND')).toBeNull();
    expect(screen.queryByText('atlas-visible-cid')).toBeNull();
    expect(screen.getByText(state.countyId)).toBeTruthy();
  });

  it('changing year clears old findings and reload never presents cached evidence', async () => {
    state.invoke.mockResolvedValue(result());
    const view = render(<SpatialAnomalyPanel />); run();
    await screen.findByText('CLUSTERS_FOUND');
    fireEvent.change(screen.getByLabelText('Assessment year'), { target: { value: '2025' } });
    expect(screen.queryByText('CLUSTERS_FOUND')).toBeNull();
    view.unmount(); render(<SpatialAnomalyPanel />);
    expect(screen.queryByText('CLUSTERS_FOUND')).toBeNull();
  });

  it('shows backing failure and exposes unsupported metrics as unavailable', async () => {
    state.invoke.mockResolvedValue({ success: false, correlationId: 'source-failed-cid', error: { message: 'Spatial observation source unavailable.' } });
    render(<SpatialAnomalyPanel />); run();
    await screen.findByRole('alert');
    expect(screen.getByText('source-failed-cid')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'PRD — unavailable' }).getAttribute('disabled')).not.toBeNull();
    expect(screen.queryByText('CLUSTERS_FOUND')).toBeNull();
  });
});
