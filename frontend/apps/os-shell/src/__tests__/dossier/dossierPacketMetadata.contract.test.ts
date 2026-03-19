/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 2
 * Dossier Packet Metadata Contract
 *
 * Verifies that packet metadata is created under dossier ownership,
 * contains required fields, and rejects incomplete metadata.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock writeLane to track enforcement
const mockAssertWriteLane = vi.fn();
vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: {},
}));

// Mock fetch
const fetchSpy = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
});
vi.stubGlobal('fetch', fetchSpy);

import {
  createPacketMetadata,
  validatePacketMetadata,
  type PacketMetadata,
} from '../../services/suites/packetComposition';

describe('Dossier Packet Metadata Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates packet metadata under dossier ownership', () => {
    const meta = createPacketMetadata({
      parcelId: 'P-100',
      packetType: 'defense',
      createdBy: 'jsmith',
    });

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dossier', 'document');
    expect(meta.parcelId).toBe('P-100');
    expect(meta.packetType).toBe('defense');
    expect(meta.createdBy).toBe('jsmith');
  });

  it('includes parcel identity, packet type, createdBy, createdAt, and status', () => {
    const meta = createPacketMetadata({
      parcelId: 'P-200',
      packetType: 'appeal-packet',
      createdBy: 'assessor1',
    });

    expect(meta).toMatchObject({
      parcelId: 'P-200',
      packetType: 'appeal-packet',
      createdBy: 'assessor1',
      status: 'draft',
    });
    expect(typeof meta.createdAt).toBe('string');
    expect(meta.createdAt.length).toBeGreaterThan(0);
  });

  it('rejects incomplete metadata for assembly-ready packets', () => {
    const incomplete: PacketMetadata = {
      parcelId: 'P-300',
      packetType: 'defense',
      createdBy: 'jsmith',
      createdAt: new Date().toISOString(),
      status: 'draft',
      title: '',
      sections: [],
    };

    const result = validatePacketMetadata(incomplete);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('title is required');
    expect(result.errors).toContain('at least one section is required');
  });

  it('accepts complete metadata as valid', () => {
    const complete: PacketMetadata = {
      parcelId: 'P-300',
      packetType: 'defense',
      createdBy: 'jsmith',
      createdAt: new Date().toISOString(),
      status: 'draft',
      title: 'Defense Packet for P-300',
      sections: [{ sectionType: 'documents', itemIds: ['DOC-001'] }],
    };

    const result = validatePacketMetadata(complete);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
