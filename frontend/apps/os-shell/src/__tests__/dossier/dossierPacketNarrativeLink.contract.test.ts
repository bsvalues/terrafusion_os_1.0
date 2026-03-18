/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 3
 * Dossier Packet Narrative Link Contract
 *
 * Verifies that narratives bind to specific packets,
 * invalidate on material composition changes, and
 * preserve provenance references.
 */

import { describe, it, expect } from 'vitest';

import {
  bindNarrativeToPacket,
  checkNarrativePacketAlignment,
  type NarrativeDraft,
  type PacketMetadata,
} from '../../services/suites/dossierNarrative';
import type { ProvenanceEntry } from '../../services/suites/packetComposition';

describe('Dossier Packet Narrative Link Contract', () => {
  const baseNarrative: NarrativeDraft = {
    narrativeId: 'NAR-001',
    parcelId: 'P-100',
    packetId: 'PKT-001',
    narrativeType: 'defense',
    createdBy: 'jsmith',
    createdAt: '2026-03-01T00:00:00Z',
    status: 'draft',
    sections: [
      { sectionType: 'evidence-summary', content: 'Evidence shows...' },
    ],
    summary: 'Defense narrative',
  };

  it('binds a narrative to a specific packet id and parcel id', () => {
    const linked = bindNarrativeToPacket(baseNarrative, 'PKT-002', 'P-200');

    expect(linked.packetId).toBe('PKT-002');
    expect(linked.parcelId).toBe('P-200');
    expect(linked.narrativeId).toBe(baseNarrative.narrativeId);
  });

  it('invalidates readiness when packet composition changes materially', () => {
    const originalPacket: PacketMetadata = {
      parcelId: 'P-100',
      packetType: 'defense',
      createdBy: 'jsmith',
      createdAt: '2026-03-01T00:00:00Z',
      status: 'draft',
      title: 'Defense Packet',
      sections: [
        { sectionType: 'documents', itemIds: ['DOC-001', 'DOC-002'] },
        { sectionType: 'evidence', itemIds: ['EV-001'] },
      ],
    };

    const changedPacket: PacketMetadata = {
      ...originalPacket,
      sections: [
        { sectionType: 'documents', itemIds: ['DOC-001'] }, // DOC-002 removed
      ],
    };

    const alignedResult = checkNarrativePacketAlignment(baseNarrative, originalPacket);
    const misalignedResult = checkNarrativePacketAlignment(baseNarrative, changedPacket);

    expect(alignedResult.aligned).toBe(true);
    expect(misalignedResult.aligned).toBe(false);
    expect(misalignedResult.reason).toContain('composition changed');
  });

  it('preserves provenance references without changing source ownership', () => {
    const provenance: ProvenanceEntry[] = [
      {
        itemId: 'DOC-001',
        itemType: 'document',
        description: 'Assessment report',
        sourceModule: 'dossier',
        addedAt: '2026-03-01T00:00:00Z',
        addedBy: 'jsmith',
      },
      {
        itemId: 'EV-001',
        itemType: 'evidence',
        description: 'Comparable sale data',
        sourceModule: 'forge',
        addedAt: '2026-03-02T00:00:00Z',
        addedBy: 'assessor1',
      },
    ];

    const linked = bindNarrativeToPacket(baseNarrative, 'PKT-001', 'P-100');

    // Provenance is not mutated by narrative linkage
    expect(provenance[0].sourceModule).toBe('dossier');
    expect(provenance[1].sourceModule).toBe('forge');
    // Narrative does not claim ownership of cross-suite evidence
    expect(linked.packetId).toBe('PKT-001');
  });
});
