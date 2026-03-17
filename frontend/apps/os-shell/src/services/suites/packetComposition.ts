/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 2
 * Packet Composition Domain Logic
 *
 * Pure functions for packet metadata, deterministic section ordering,
 * readiness computation, and provenance types.
 *
 * Write-lane enforcement: createPacketMetadata calls assertWriteLane.
 * All other functions are pure — no side effects, no fetch calls.
 */

import { assertWriteLane } from '../writeLane';

// ============================================================================
// Types
// ============================================================================

export type SectionType = 'documents' | 'photos' | 'evidence' | 'narratives';

export interface PacketSection {
  sectionType: SectionType;
  itemIds: string[];
}

export interface PacketMetadata {
  parcelId: string;
  packetType: string;
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'ready' | 'finalized';
  title: string;
  sections: PacketSection[];
}

export interface ProvenanceEntry {
  itemId: string;
  itemType: 'document' | 'evidence' | 'photo' | 'narrative';
  description: string;
  sourceModule: string;
  addedAt: string;
  addedBy: string;
}

export interface PacketReadiness {
  status: 'draft' | 'ready';
  blockers: string[];
  exportModel?: ExportReadyModel;
}

export interface ExportReadyModel {
  parcelId: string;
  packetType: string;
  title: string;
  sectionCount: number;
  totalItems: number;
  preparedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// Canonical Section Order
// ============================================================================

export const SECTION_ORDER: SectionType[] = [
  'documents',
  'photos',
  'evidence',
  'narratives',
];

// ============================================================================
// Metadata
// ============================================================================

export function createPacketMetadata(input: {
  parcelId: string;
  packetType: string;
  createdBy: string;
}): PacketMetadata {
  assertWriteLane('dossier', 'document');

  return {
    parcelId: input.parcelId,
    packetType: input.packetType,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    status: 'draft',
    title: '',
    sections: [],
  };
}

export function validatePacketMetadata(meta: PacketMetadata): ValidationResult {
  const errors: string[] = [];

  if (!meta.title || meta.title.trim() === '') {
    errors.push('title is required');
  }
  if (!meta.sections || meta.sections.length === 0) {
    errors.push('at least one section is required');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Section Ordering
// ============================================================================

export function orderPacketSections(sections: PacketSection[]): PacketSection[] {
  // Merge duplicate section types
  const merged = new Map<SectionType, string[]>();

  for (const section of sections) {
    const existing = merged.get(section.sectionType);
    if (existing) {
      existing.push(...section.itemIds);
    } else {
      merged.set(section.sectionType, [...section.itemIds]);
    }
  }

  // Sort by canonical order
  const ordered: PacketSection[] = [];
  for (const sectionType of SECTION_ORDER) {
    const itemIds = merged.get(sectionType);
    if (itemIds) {
      ordered.push({ sectionType, itemIds });
    }
  }

  return ordered;
}

// ============================================================================
// Readiness
// ============================================================================

export function computePacketReadiness(meta: PacketMetadata): PacketReadiness {
  const validation = validatePacketMetadata(meta);

  if (!validation.valid) {
    return {
      status: 'draft',
      blockers: validation.errors,
    };
  }

  const totalItems = meta.sections.reduce((sum, s) => sum + s.itemIds.length, 0);

  return {
    status: 'ready',
    blockers: [],
    exportModel: {
      parcelId: meta.parcelId,
      packetType: meta.packetType,
      title: meta.title,
      sectionCount: meta.sections.length,
      totalItems,
      preparedAt: new Date().toISOString(),
    },
  };
}
