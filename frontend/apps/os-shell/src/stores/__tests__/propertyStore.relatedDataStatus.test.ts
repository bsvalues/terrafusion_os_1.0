/**
 * propertyStore.relatedDataStatus.test.ts
 *
 * WO-WB-PROV-002 — verifies the frontend-only relatedDataStatus provenance flag
 * that backs slice-aware Workbench honesty badges. The related-data bundle
 * (assessments/documents/appeals/taxStatements/recordings/auditTrail/operations)
 * loads all-or-nothing in selectParcel; relatedDataStatus records its lifecycle:
 *   idle -> loading (shell loaded, bundle in flight) -> loaded (bundle resolved)
 *   idle -> loading -> error (bundle rejected)
 *   idle after a not-found parcel (no bundle fired)
 */

import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  parcelId: 'P-PROV-001',
  address: '1 Provenance Way',
  city: 'Prosser',
  ownerName: 'Prov Tester',
  totalAssessedValue: 250000,
  propertyType: 'Residential',
  assessmentYear: 2025,
};

const resolveAllBundle = () => {
  providerMock.getAssessments.mockResolvedValue([]);
  providerMock.getDocuments.mockResolvedValue([]);
  providerMock.getAppeals.mockResolvedValue([]);
  providerMock.getTaxStatements.mockResolvedValue([]);
  providerMock.getRecordingHistory.mockResolvedValue([]);
  providerMock.getAuditTrail.mockResolvedValue([]);
  providerMock.getRecentOperations.mockResolvedValue([]);
};

describe('propertyStore relatedDataStatus provenance', () => {
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
      relatedDataStatus: 'idle',
      recentParcels: [],
    });
    providerMock.getParcel.mockResolvedValue(parcel);
    resolveAllBundle();
  });

  it('starts idle', () => {
    expect(usePropertyStore.getState().relatedDataStatus).toBe('idle');
  });

  it('transitions to "loaded" once the related-data bundle resolves', async () => {
    void usePropertyStore.getState().selectParcel('P-PROV-001');

    await waitFor(() => {
      expect(usePropertyStore.getState().activeParcel?.parcelId).toBe('P-PROV-001');
    });
    await waitFor(() => {
      expect(usePropertyStore.getState().relatedDataStatus).toBe('loaded');
    });
  });

  it('is "loading" (not "loaded") while the parcel shell is up but the bundle is in flight', async () => {
    // Hold one bundle slice pending so the Promise.all never settles.
    providerMock.getRecordingHistory.mockReturnValue(new Promise(() => {}));

    void usePropertyStore.getState().selectParcel('P-PROV-001');

    await waitFor(() => {
      expect(usePropertyStore.getState().activeParcel?.parcelId).toBe('P-PROV-001');
    });
    // Shell is up but the bundle has not resolved.
    expect(usePropertyStore.getState().activeParcelLoading).toBe(false);
    expect(usePropertyStore.getState().relatedDataStatus).toBe('loading');
  });

  it('transitions to "error" and clears slices when the bundle rejects', async () => {
    providerMock.getTaxStatements.mockRejectedValue(new Error('bundle boom'));

    void usePropertyStore.getState().selectParcel('P-PROV-001');

    await waitFor(() => {
      expect(usePropertyStore.getState().relatedDataStatus).toBe('error');
    });
    expect(usePropertyStore.getState().taxStatements).toEqual([]);
    expect(usePropertyStore.getState().recordings).toEqual([]);
    expect(usePropertyStore.getState().auditTrail).toEqual([]);
  });

  it('stays "idle" for a not-found parcel (no bundle fired)', async () => {
    providerMock.getParcel.mockResolvedValue(null);

    await usePropertyStore.getState().selectParcel('P-MISSING');

    expect(usePropertyStore.getState().relatedDataStatus).toBe('idle');
    expect(usePropertyStore.getState().activeParcelError?.status).toBe(404);
  });

  it('resets to "idle" on clearParcel', async () => {
    void usePropertyStore.getState().selectParcel('P-PROV-001');
    await waitFor(() => {
      expect(usePropertyStore.getState().relatedDataStatus).toBe('loaded');
    });

    usePropertyStore.getState().clearParcel();
    expect(usePropertyStore.getState().relatedDataStatus).toBe('idle');
  });
});
