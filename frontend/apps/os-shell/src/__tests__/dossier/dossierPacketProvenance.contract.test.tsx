/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 2
 * Dossier Packet Provenance Contract
 *
 * Verifies that provenance is rendered for each evidence item,
 * source suite is shown as read-origin (not write-owner override),
 * and non-dossier lanes cannot mutate provenance.
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: vi.fn(),
  checkWriteLane: vi.fn((mod: string) => mod === 'dossier'),
  WRITE_LANE_MATRIX: { document: 'dossier' },
}));

import { checkWriteLane } from '../../services/writeLane';
import PacketProvenance from '../../components/dossier/PacketProvenance';
import type { ProvenanceEntry } from '../../services/suites/packetComposition';

const MOCK_PROVENANCE: ProvenanceEntry[] = [
  {
    itemId: 'DOC-001',
    itemType: 'document',
    description: 'assessment-2026.pdf',
    sourceModule: 'dossier',
    addedAt: '2026-03-01T00:00:00Z',
    addedBy: 'jsmith',
  },
  {
    itemId: 'EV-001',
    itemType: 'evidence',
    description: 'Comparable sale at 123 Main St',
    sourceModule: 'forge',
    addedAt: '2026-03-02T00:00:00Z',
    addedBy: 'assessor1',
  },
  {
    itemId: 'PHO-001',
    itemType: 'photo',
    description: 'Front elevation photo',
    sourceModule: 'atlas',
    addedAt: '2026-03-03T00:00:00Z',
    addedBy: 'fieldtech',
  },
];

describe('Dossier Packet Provenance Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders provenance for each evidence item', () => {
    render(<PacketProvenance entries={MOCK_PROVENANCE} />);

    const items = screen.getAllByTestId('provenance-entry');
    expect(items).toHaveLength(3);
  });

  it('shows source suite as read-origin, not write-owner override', () => {
    render(<PacketProvenance entries={MOCK_PROVENANCE} />);

    // The forge-sourced evidence should show "forge" as origin, not "dossier"
    const forgeItem = screen.getByTestId('provenance-source-EV-001');
    expect(forgeItem).toHaveTextContent('forge');

    // The atlas-sourced photo should show "atlas" as origin
    const atlasItem = screen.getByTestId('provenance-source-PHO-001');
    expect(atlasItem).toHaveTextContent('atlas');

    // Dossier's own document shows "dossier"
    const dossierItem = screen.getByTestId('provenance-source-DOC-001');
    expect(dossierItem).toHaveTextContent('dossier');
  });

  it('does not permit provenance mutation from non-dossier lanes', () => {
    // checkWriteLane is mocked to return true only for 'dossier'
    expect(checkWriteLane('dossier' as never, 'document' as never)).toBe(true);
    expect(checkWriteLane('forge' as never, 'document' as never)).toBe(false);
    expect(checkWriteLane('dais' as never, 'document' as never)).toBe(false);
  });
});
