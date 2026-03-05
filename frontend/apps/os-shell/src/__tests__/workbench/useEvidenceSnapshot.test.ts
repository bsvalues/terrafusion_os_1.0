/**
 * useEvidenceSnapshot.test.ts — CX-26 Evidence Snapshot Hook
 *
 * Tests:
 * 1. Initial state (no data, not loading)
 * 2. Loading state during fetch
 * 3. Success state with snapshot + headerCorrelationId
 * 4. Error state with message and HTTP status extraction
 * 5. Network error (no HTTP status)
 * 6. Re-fetch replaces previous snapshot
 */

import { act, renderHook } from '@testing-library/react';
import { useEvidenceSnapshot } from '../../hooks/useEvidenceSnapshot';
import { dossierService } from '../../services/dossierService';
import type { EvidenceSnapshotResult, EvidenceSnapshot } from '../../services/dossierService';

jest.mock('../../services/dossierService');

const mockGetEvidenceSnapshot = dossierService.getEvidenceSnapshot as jest.MockedFunction<
  typeof dossierService.getEvidenceSnapshot
>;

const MOCK_SNAPSHOT: EvidenceSnapshot = {
  parcelId: 'P-12345',
  countyId: 'benton-001',
  snapshotTimestamp: '2026-02-20T10:30:00.000Z',
  correlationId: 'corr-evidence-abc123',
  contentHash: 'sha256-mock-hash',
  property: {
    propertyId: 'prop-001',
    parcelNumber: '12345-001',
    address: '123 Main St',
    propertyType: 'Residential',
    assessedValue: 250000,
    landValue: 80000,
    improvementValue: 170000,
    marketValue: 265000,
    taxYear: 2024,
    assessmentDate: '2024-01-02',
  },
  valuation: { totalValue: 250000, categoryCount: 3 },
  levies: { totalCount: 5, includedCount: 4, totalLevyAmount: 3200 },
  notes: { totalCount: 2, includedCount: 2, noteTypes: ['inspection'] },
  links: {
    self: '/api/dossier/parcels/12345-001/evidence',
    summary: '/api/dossier/parcels/12345-001/summary',
    details: '/api/dossier/parcels/12345-001/details',
    notes: '/api/dossier/parcels/12345-001/notes',
    casefile: '/api/dossier/parcels/12345-001/casefile',
  },
};

const MOCK_RESULT: EvidenceSnapshotResult = {
  snapshot: MOCK_SNAPSHOT,
  headerCorrelationId: 'header-corr-xyz',
};

describe('useEvidenceSnapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with idle state (no data, not loading)', () => {
    const { result } = renderHook(() => useEvidenceSnapshot('12345-001'));

    expect(result.current.snapshot).toBeNull();
    expect(result.current.headerCorrelationId).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.httpStatus).toBeNull();
  });

  it('transitions to loading on fetch', async () => {
    let resolvePromise: (val: EvidenceSnapshotResult) => void;
    mockGetEvidenceSnapshot.mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve; }),
    );

    const { result } = renderHook(() => useEvidenceSnapshot('12345-001'));

    // Start fetch — captures loading
    act(() => { result.current.fetch(); });
    expect(result.current.loading).toBe(true);

    // Resolve
    await act(async () => { resolvePromise!(MOCK_RESULT); });
    expect(result.current.loading).toBe(false);
  });

  it('returns snapshot and headerCorrelationId on success', async () => {
    mockGetEvidenceSnapshot.mockResolvedValue(MOCK_RESULT);

    const { result } = renderHook(() => useEvidenceSnapshot('12345-001'));

    await act(async () => { await result.current.fetch(); });

    expect(result.current.snapshot).toEqual(MOCK_SNAPSHOT);
    expect(result.current.headerCorrelationId).toBe('header-corr-xyz');
    expect(result.current.error).toBeNull();
    expect(result.current.httpStatus).toBeNull();
  });

  it('extracts HTTP status from error message', async () => {
    mockGetEvidenceSnapshot.mockRejectedValue(
      new Error('Dossier API error: 404 Not Found'),
    );

    const { result } = renderHook(() => useEvidenceSnapshot('12345-001'));

    await act(async () => { await result.current.fetch(); });

    expect(result.current.snapshot).toBeNull();
    expect(result.current.error).toBe('Dossier API error: 404 Not Found');
    expect(result.current.httpStatus).toBe(404);
  });

  it('handles network errors (no HTTP status)', async () => {
    mockGetEvidenceSnapshot.mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useEvidenceSnapshot('12345-001'));

    await act(async () => { await result.current.fetch(); });

    expect(result.current.snapshot).toBeNull();
    expect(result.current.error).toBe('Failed to fetch');
    expect(result.current.httpStatus).toBeNull();
  });

  it('replaces previous snapshot on re-fetch', async () => {
    const snapshot2: EvidenceSnapshot = {
      ...MOCK_SNAPSHOT,
      correlationId: 'corr-evidence-second',
      contentHash: 'sha256-different-hash',
    };
    mockGetEvidenceSnapshot
      .mockResolvedValueOnce(MOCK_RESULT)
      .mockResolvedValueOnce({ snapshot: snapshot2, headerCorrelationId: 'header-2' });

    const { result } = renderHook(() => useEvidenceSnapshot('12345-001'));

    await act(async () => { await result.current.fetch(); });
    expect(result.current.snapshot?.correlationId).toBe('corr-evidence-abc123');

    await act(async () => { await result.current.fetch(); });
    expect(result.current.snapshot?.correlationId).toBe('corr-evidence-second');
    expect(result.current.headerCorrelationId).toBe('header-2');
  });

  it('calls service with correct parcelId', async () => {
    mockGetEvidenceSnapshot.mockResolvedValue(MOCK_RESULT);

    const { result } = renderHook(() => useEvidenceSnapshot('PARCEL-XYZ'));

    await act(async () => { await result.current.fetch(); });

    expect(mockGetEvidenceSnapshot).toHaveBeenCalledWith('PARCEL-XYZ');
  });
});
