/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 1
 * Dossier Service Write-Lane Guard Contract
 *
 * Verifies that every write function in suites/dossierService.ts
 * calls assertWriteLane('dossier', 'document') before hitting the API.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// Track assertWriteLane calls via vi.mock
const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: {},
}));

// Mock fetch globally to prevent real network calls
const fetchSpy = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
  blob: () => Promise.resolve(new Blob()),
});
vi.stubGlobal('fetch', fetchSpy);

import {
  uploadDocument,
  deleteDocument,
  assemblePacket,
  finalizePacket,
  attachEvidence,
} from '../../services/suites/dossierService';

describe('Dossier Service Write-Lane Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploadDocument calls assertWriteLane before fetch', async () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    await uploadDocument('PARCEL-001', file, 'assessment');

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dossier', 'document');
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('deleteDocument calls assertWriteLane before fetch', async () => {
    await deleteDocument('DOC-001');

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dossier', 'document');
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('assemblePacket calls assertWriteLane before fetch', async () => {
    await assemblePacket('PARCEL-001', ['DOC-001', 'DOC-002']);

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dossier', 'document');
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('finalizePacket calls assertWriteLane before fetch', async () => {
    await finalizePacket('PKT-001');

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dossier', 'document');
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('attachEvidence calls assertWriteLane before fetch', async () => {
    await attachEvidence('PARCEL-001', {
      parcelId: 'PARCEL-001',
      type: 'photo',
      description: 'Front of property',
    });

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dossier', 'document');
    expect(fetchSpy).toHaveBeenCalled();
  });
});
