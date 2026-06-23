import { waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePropertyStore } from '../propertyStore';

const providerMock = vi.hoisted(() => ({
  getParcel: vi.fn(),
  getAssessments: vi.fn(),
  getDocuments: vi.fn(),
  getAppeals: vi.fn(),
  getTaxStatements: vi.fn(),
  getRecordingHistory: vi.fn(),
  getAuditTrail: vi.fn(),
  getRecentOperations: vi.fn(),
}));

vi.mock('../../services/dataProvider', () => ({
  getDataProvider: () => providerMock,
}));

const parcel = {
  parcelId: 'P-SMOKE-001',
  address: '100 Smoke Test Ave',
  city: 'Prosser',
  ownerName: 'Smoke Tester',
  totalAssessedValue: 250000,
  propertyType: 'Residential',
  assessmentYear: 2025,
};

describe('propertyStore production smoke loading contract', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    usePropertyStore.setState({
      activeParcel: null,
      activeParcelLoading: false,
      activeParcelError: null,
      assessments: [],
      documents: [],
      appeals: [],
      taxStatements: [],
      recordings: [],
      auditTrail: [],
      operations: [],
      recentParcels: [],
    });

    providerMock.getParcel.mockResolvedValue(parcel);
    providerMock.getAssessments.mockReturnValue(new Promise(() => {}));
    providerMock.getDocuments.mockResolvedValue([]);
    providerMock.getAppeals.mockResolvedValue([]);
    providerMock.getTaxStatements.mockResolvedValue([]);
    providerMock.getRecordingHistory.mockResolvedValue([]);
    providerMock.getAuditTrail.mockResolvedValue([]);
    providerMock.getRecentOperations.mockResolvedValue([]);
  });

  it('clears the Workbench loading state after the primary parcel evidence loads', async () => {
    void usePropertyStore.getState().selectParcel('P-SMOKE-001');

    await waitFor(() => {
      expect(usePropertyStore.getState().activeParcel?.parcelId).toBe('P-SMOKE-001');
    });

    await waitFor(() => {
      expect(usePropertyStore.getState().activeParcelLoading).toBe(false);
    });

    expect(usePropertyStore.getState().activeParcelError).toBeNull();
  });

  it('shows an evidence blocker when the primary parcel evidence request stalls', async () => {
    vi.useFakeTimers();
    providerMock.getParcel.mockReturnValue(new Promise(() => {}));

    const load = usePropertyStore.getState().selectParcel('P-STALLED-001');
    await vi.advanceTimersByTimeAsync(20_000);
    await load;

    expect(usePropertyStore.getState().activeParcel).toBeNull();
    expect(usePropertyStore.getState().activeParcelLoading).toBe(false);
    expect(usePropertyStore.getState().activeParcelError?.message).toContain(
      'timed out',
    );
  });
});
