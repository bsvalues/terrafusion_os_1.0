/**
 * useDossierDetails.test.ts
 *
 * CX-25: Unit tests for the dossier details hook.
 * Verifies: loading, data fetch, error handling, nullable sections,
 * correlationId exposure, and refetch.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useDossierDetails } from '../../hooks/useDossierDetails';
import type { DossierDetailsResponse } from '../../contracts/dossierDetails';

// ============================================================================
// Mock dossierService.getDetails
// ============================================================================

const mockGetDetails = jest.fn<
  Promise<{ data: DossierDetailsResponse; correlationId: string }>,
  [string, any?]
>();

jest.mock('../../services/dossierService', () => ({
  dossierService: {
    getDetails: (...args: any[]) => mockGetDetails(...args),
  },
}));

// ============================================================================
// Fixtures
// ============================================================================

const FULL_RESPONSE: DossierDetailsResponse = {
  parcelId: 'P-001',
  countyId: 'county-abc',
  generatedAt: '2026-03-04T12:00:00Z',
  piiRedacted: true,
  correlationId: 'dossier-server-12345',
  links: {
    self: '/api/dossier/parcels/P-001/details',
    summary: '/api/dossier/parcels/P-001/summary',
    details: '/api/dossier/parcels/P-001/details',
    notes: '/api/dossier/parcels/P-001/notes',
    casefile: '/api/dossier/parcels/P-001/casefile',
  },
  property: {
    propertyId: 'prop-1',
    parcelNumber: 'P-001',
    address: '123 Main St',
    propertyType: 'Residential',
    yearBuilt: 1998,
    assessedValue: 250000,
    landValue: 80000,
    improvementValue: 170000,
    marketValue: 275000,
    taxYear: 2024,
    assessmentDate: '2024-01-02T00:00:00Z',
    classCode: null,
    useCode: null,
    neighborhood: null,
  },
  valuation: {
    totalValue: 250000,
    categoryCount: 2,
    categories: [
      { name: 'Land', amount: 80000, percentage: 32.0 },
      { name: 'Improvements', amount: 170000, percentage: 68.0 },
    ],
  },
  levies: {
    levyCountTotal: 5,
    levyCountReturned: 2,
    recent: [
      {
        taxLevyId: 'levy-1',
        taxingDistrict: 'City of Richland',
        taxRate: 0.0123,
        levyAmount: 3075.0,
        taxYear: 2024,
        purpose: 'General Fund',
        effectiveDate: '2024-01-01T00:00:00Z',
      },
    ],
  },
  notes: {
    noteCountTotal: 3,
    noteCountReturned: 2,
    items: [
      {
        noteId: 'note-1',
        noteType: 'inspection',
        createdAt: '2024-06-15T10:00:00Z',
        authorKind: 'staff',
      },
    ],
  },
};

const PARTIAL_RESPONSE: DossierDetailsResponse = {
  ...FULL_RESPONSE,
  valuation: null,
  levies: null,
  notes: null,
};

// ============================================================================
// Tests
// ============================================================================

describe('useDossierDetails', () => {
  beforeEach(() => {
    mockGetDetails.mockReset();
  });

  it('stays idle when parcelId is null', () => {
    const { result } = renderHook(() => useDossierDetails(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.correlationId).toBeNull();
  });

  it('fetches data when parcelId is provided', async () => {
    mockGetDetails.mockResolvedValueOnce({
      data: FULL_RESPONSE,
      correlationId: 'dossier-server-12345',
    });

    const { result } = renderHook(() => useDossierDetails('P-001'));

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(FULL_RESPONSE);
    expect(result.current.error).toBeNull();
    expect(result.current.correlationId).toBe('dossier-server-12345');
    expect(mockGetDetails).toHaveBeenCalledWith('P-001', undefined);
  });

  it('handles API errors gracefully', async () => {
    mockGetDetails.mockRejectedValueOnce(new Error('Dossier API error: 500 Internal Server Error'));

    const { result } = renderHook(() => useDossierDetails('P-002'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error!.message).toContain('500');
    expect(result.current.error!.code).toBe('FETCH_ERROR');
  });

  it('returns null for filtered sections (selective includes)', async () => {
    mockGetDetails.mockResolvedValueOnce({
      data: PARTIAL_RESPONSE,
      correlationId: 'dossier-partial-99',
    });

    const { result } = renderHook(() =>
      useDossierDetails('P-001', { include: 'property' }),
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data!.property).not.toBeNull();
    expect(result.current.data!.valuation).toBeNull();
    expect(result.current.data!.levies).toBeNull();
    expect(result.current.data!.notes).toBeNull();
  });

  it('exposes correlationId from response body', async () => {
    mockGetDetails.mockResolvedValueOnce({
      data: FULL_RESPONSE,
      correlationId: 'tf-header-corr',
    });

    const { result } = renderHook(() => useDossierDetails('P-001'));

    await waitFor(() => {
      expect(result.current.correlationId).not.toBeNull();
    });

    // Prefers body correlationId over header
    expect(result.current.correlationId).toBe('dossier-server-12345');
  });

  it('refetch triggers a new request', async () => {
    mockGetDetails
      .mockResolvedValueOnce({
        data: FULL_RESPONSE,
        correlationId: 'first-call',
      })
      .mockResolvedValueOnce({
        data: { ...FULL_RESPONSE, correlationId: 'dossier-refresh-2' },
        correlationId: 'second-call',
      });

    const { result } = renderHook(() => useDossierDetails('P-001'));

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(mockGetDetails).toHaveBeenCalledTimes(1);

    // Trigger refetch
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(mockGetDetails).toHaveBeenCalledTimes(2);
    });
  });

  it('passes options to getDetails', async () => {
    mockGetDetails.mockResolvedValueOnce({
      data: FULL_RESPONSE,
      correlationId: 'options-test',
    });

    renderHook(() =>
      useDossierDetails('P-001', { include: 'property,levies', levyLimit: 5, noteLimit: 10 }),
    );

    await waitFor(() => {
      expect(mockGetDetails).toHaveBeenCalledTimes(1);
    });

    expect(mockGetDetails).toHaveBeenCalledWith('P-001', {
      include: 'property,levies',
      levyLimit: 5,
      noteLimit: 10,
    });
  });

  it('handles 404 with NOT_FOUND error code', async () => {
    mockGetDetails.mockRejectedValueOnce(new Error('Dossier API error: 404 Not Found'));

    const { result } = renderHook(() => useDossierDetails('NONEXISTENT'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error!.code).toBe('NOT_FOUND');
  });
});
