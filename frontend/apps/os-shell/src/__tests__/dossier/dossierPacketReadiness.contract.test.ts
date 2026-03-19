/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 2
 * Dossier Packet Readiness Contract
 *
 * Verifies draft vs ready status computation, blocking omission
 * identification, and export-ready model shape.
 */

import { describe, it, expect } from 'vitest';

import {
  computePacketReadiness,
  type PacketMetadata,
  type PacketReadiness,
} from '../../services/suites/packetComposition';

describe('Dossier Packet Readiness Contract', () => {
  it('computes draft vs ready status from packet completeness', () => {
    const draft: PacketMetadata = {
      parcelId: 'P-100',
      packetType: 'defense',
      createdBy: 'jsmith',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      title: '',
      sections: [],
    };

    const ready: PacketMetadata = {
      parcelId: 'P-100',
      packetType: 'defense',
      createdBy: 'jsmith',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      title: 'Defense Packet for P-100',
      sections: [
        { sectionType: 'documents', itemIds: ['DOC-001'] },
        { sectionType: 'evidence', itemIds: ['EV-001'] },
      ],
    };

    const draftResult = computePacketReadiness(draft);
    const readyResult = computePacketReadiness(ready);

    expect(draftResult.status).toBe('draft');
    expect(readyResult.status).toBe('ready');
  });

  it('identifies blocking omissions explicitly', () => {
    const missingTitle: PacketMetadata = {
      parcelId: 'P-200',
      packetType: 'defense',
      createdBy: 'jsmith',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      title: '',
      sections: [{ sectionType: 'documents', itemIds: ['DOC-001'] }],
    };

    const missingSections: PacketMetadata = {
      parcelId: 'P-200',
      packetType: 'defense',
      createdBy: 'jsmith',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      title: 'Defense Packet',
      sections: [],
    };

    const titleResult = computePacketReadiness(missingTitle);
    const sectionResult = computePacketReadiness(missingSections);

    expect(titleResult.blockers).toContain('title is required');
    expect(sectionResult.blockers).toContain('at least one section is required');
  });

  it('returns export-ready model shape without executing export', () => {
    const complete: PacketMetadata = {
      parcelId: 'P-300',
      packetType: 'appeal-packet',
      createdBy: 'assessor1',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      title: 'Appeal Packet for P-300',
      sections: [
        { sectionType: 'documents', itemIds: ['DOC-001', 'DOC-002'] },
        { sectionType: 'evidence', itemIds: ['EV-001'] },
        { sectionType: 'narratives', itemIds: ['NAR-001'] },
      ],
    };

    const readiness = computePacketReadiness(complete);

    expect(readiness.status).toBe('ready');
    expect(readiness.blockers).toHaveLength(0);

    // Export-ready model shape
    expect(readiness.exportModel).toBeDefined();
    expect(readiness.exportModel!.parcelId).toBe('P-300');
    expect(readiness.exportModel!.packetType).toBe('appeal-packet');
    expect(readiness.exportModel!.title).toBe('Appeal Packet for P-300');
    expect(readiness.exportModel!.sectionCount).toBe(3);
    expect(readiness.exportModel!.totalItems).toBe(4);
    expect(typeof readiness.exportModel!.preparedAt).toBe('string');
  });

  it('does not produce export model for non-ready packets', () => {
    const incomplete: PacketMetadata = {
      parcelId: 'P-400',
      packetType: 'defense',
      createdBy: 'jsmith',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      title: '',
      sections: [],
    };

    const result = computePacketReadiness(incomplete);

    expect(result.status).toBe('draft');
    expect(result.exportModel).toBeUndefined();
  });
});
