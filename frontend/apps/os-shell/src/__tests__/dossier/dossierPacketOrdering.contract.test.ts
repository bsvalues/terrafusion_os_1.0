/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 2
 * Dossier Packet Ordering Contract
 *
 * Verifies deterministic section ordering within a packet,
 * stability after add/remove, and duplicate handling.
 */

import { describe, it, expect } from 'vitest';

import {
  orderPacketSections,
  SECTION_ORDER,
  type PacketSection,
} from '../../services/suites/packetComposition';

describe('Dossier Packet Ordering Contract', () => {
  it('applies deterministic section ordering', () => {
    const unordered: PacketSection[] = [
      { sectionType: 'evidence', itemIds: ['EV-001'] },
      { sectionType: 'documents', itemIds: ['DOC-001'] },
      { sectionType: 'narratives', itemIds: ['NAR-001'] },
      { sectionType: 'photos', itemIds: ['PHO-001'] },
    ];

    const ordered = orderPacketSections(unordered);

    // Canonical order: documents → photos → evidence → narratives
    expect(ordered.map((s) => s.sectionType)).toEqual([
      'documents',
      'photos',
      'evidence',
      'narratives',
    ]);
  });

  it('preserves stable ordering after add/remove operations', () => {
    const initial: PacketSection[] = [
      { sectionType: 'evidence', itemIds: ['EV-001'] },
      { sectionType: 'documents', itemIds: ['DOC-001'] },
    ];

    const afterAdd: PacketSection[] = [
      ...initial,
      { sectionType: 'photos', itemIds: ['PHO-001'] },
    ];

    const afterRemove: PacketSection[] = afterAdd.filter(
      (s) => s.sectionType !== 'evidence'
    );

    const orderedAfterAdd = orderPacketSections(afterAdd);
    const orderedAfterRemove = orderPacketSections(afterRemove);

    // After add: documents → photos → evidence
    expect(orderedAfterAdd.map((s) => s.sectionType)).toEqual([
      'documents',
      'photos',
      'evidence',
    ]);

    // After remove: documents → photos (relative order preserved)
    expect(orderedAfterRemove.map((s) => s.sectionType)).toEqual([
      'documents',
      'photos',
    ]);
  });

  it('handles duplicate evidence rules predictably', () => {
    const withDupes: PacketSection[] = [
      { sectionType: 'documents', itemIds: ['DOC-001'] },
      { sectionType: 'documents', itemIds: ['DOC-002'] },
      { sectionType: 'evidence', itemIds: ['EV-001'] },
    ];

    const ordered = orderPacketSections(withDupes);

    // Duplicate sections of the same type are merged
    expect(ordered.filter((s) => s.sectionType === 'documents')).toHaveLength(1);
    expect(
      ordered.find((s) => s.sectionType === 'documents')!.itemIds
    ).toEqual(['DOC-001', 'DOC-002']);
  });

  it('exports a canonical SECTION_ORDER array', () => {
    expect(Array.isArray(SECTION_ORDER)).toBe(true);
    expect(SECTION_ORDER.length).toBeGreaterThanOrEqual(4);
    expect(SECTION_ORDER).toContain('documents');
    expect(SECTION_ORDER).toContain('photos');
    expect(SECTION_ORDER).toContain('evidence');
    expect(SECTION_ORDER).toContain('narratives');
  });
});
