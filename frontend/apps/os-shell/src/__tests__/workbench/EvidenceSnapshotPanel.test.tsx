/**
 * EvidenceSnapshotPanel.test.tsx — CX-26 Evidence Snapshot UI
 *
 * Tests:
 * 1. Renders all sections with full data
 * 2. Nullable valuation shows fallback text
 * 3. CorrelationId copy button present
 * 4. Hash warning text present (snapshot-time-bound)
 * 5. Resource links rendered
 * 6. Note types rendered as tags
 * 7. Header correlationId shown when different from body
 */

import { vi, describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EvidenceSnapshotPanel } from '../../components/workbench/EvidenceSnapshotPanel';
import type { EvidenceSnapshot } from '../../services/dossierService';

// ── Fixtures ──────────────────────────────────────────────────────

const FULL_SNAPSHOT: EvidenceSnapshot = {
  parcelId: 'P-12345',
  countyId: 'benton-001',
  snapshotTimestamp: '2026-02-20T10:30:00.000Z',
  correlationId: 'corr-evidence-abc123',
  contentHash: 'sha256-abc123def456abc123def456abc123def456abc123def456abc123def456aabb',
  property: {
    propertyId: 'prop-001',
    parcelNumber: '12345-001',
    address: '123 Main St, Kennewick, WA',
    propertyType: 'Residential',
    assessedValue: 250000,
    landValue: 80000,
    improvementValue: 170000,
    marketValue: 265000,
    taxYear: 2024,
    assessmentDate: '2024-01-02',
  },
  valuation: {
    totalValue: 250000,
    categoryCount: 3,
  },
  levies: {
    totalCount: 5,
    includedCount: 4,
    totalLevyAmount: 3200,
  },
  notes: {
    totalCount: 3,
    includedCount: 2,
    noteTypes: ['inspection', 'adjustment', 'appeal'],
  },
  links: {
    self: '/api/dossier/parcels/12345-001/evidence',
    summary: '/api/dossier/parcels/12345-001/summary',
    details: '/api/dossier/parcels/12345-001/details',
    notes: '/api/dossier/parcels/12345-001/notes',
    casefile: '/api/dossier/parcels/12345-001/casefile',
  },
};

const NULL_VALUATION_SNAPSHOT: EvidenceSnapshot = {
  ...FULL_SNAPSHOT,
  valuation: null,
};

// ── Tests ─────────────────────────────────────────────────────────

describe('EvidenceSnapshotPanel', () => {
  describe('Full data rendering', () => {
    it('renders the panel root', () => {
      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      expect(screen.getByTestId('evidence-snapshot-panel')).toBeInTheDocument();
    });

    it('renders property summary fields', () => {
      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      expect(screen.getByText('12345-001')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, Kennewick, WA')).toBeInTheDocument();
      expect(screen.getByText('Residential')).toBeInTheDocument();
    });

    it('renders valuation data when present', () => {
      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      expect(screen.getByText('3')).toBeInTheDocument(); // categoryCount
      expect(screen.queryByTestId('valuation-unavailable')).not.toBeInTheDocument();
    });

    it('renders levy summary', () => {
      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      expect(screen.getByText('$3,200')).toBeInTheDocument();
    });

    it('renders note type tags', () => {
      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      expect(screen.getByText('inspection')).toBeInTheDocument();
      expect(screen.getByText('adjustment')).toBeInTheDocument();
      expect(screen.getByText('appeal')).toBeInTheDocument();
    });
  });

  describe('Nullable valuation', () => {
    it('shows fallback text when valuation is null', () => {
      render(
        <EvidenceSnapshotPanel snapshot={NULL_VALUATION_SNAPSHOT} headerCorrelationId={null} />,
      );
      expect(screen.getByTestId('valuation-unavailable')).toBeInTheDocument();
      expect(screen.getByText(/Valuation data not available/i)).toBeInTheDocument();
    });
  });

  describe('Correlation ID', () => {
    it('renders correlationId with copy button', () => {
      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      expect(screen.getByTestId('correlation-id-display')).toBeInTheDocument();
      expect(screen.getByTestId('correlation-id-copy')).toBeInTheDocument();
      expect(screen.getByText('corr-evidence-abc123')).toBeInTheDocument();
    });

    it('shows header correlationId when different from body', () => {
      render(
        <EvidenceSnapshotPanel
          snapshot={FULL_SNAPSHOT}
          headerCorrelationId="header-corr-xyz789"
        />,
      );
      // Should show both
      expect(screen.getByText('corr-evidence-abc123')).toBeInTheDocument();
      expect(screen.getByText('header-corr-xyz789')).toBeInTheDocument();
    });

    it('does not show header correlationId when same as body', () => {
      render(
        <EvidenceSnapshotPanel
          snapshot={FULL_SNAPSHOT}
          headerCorrelationId="corr-evidence-abc123"
        />,
      );
      // Only one instance
      const displays = screen.getAllByTestId('correlation-id-display');
      expect(displays).toHaveLength(1);
    });

    it('copies to clipboard on click', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      fireEvent.click(screen.getByTestId('correlation-id-copy'));

      expect(writeText).toHaveBeenCalledWith('corr-evidence-abc123');
    });
  });

  describe('Hash contract warning', () => {
    it('renders content hash section', () => {
      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      expect(screen.getByTestId('content-hash-section')).toBeInTheDocument();
    });

    it('displays snapshot-time-bound warning text', () => {
      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      expect(
        screen.getByText(/Snapshot hash — includes timestamp/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Not a content-only digest/i)).toBeInTheDocument();
    });

    it('renders the full hash value', () => {
      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      expect(
        screen.getByText(FULL_SNAPSHOT.contentHash),
      ).toBeInTheDocument();
    });
  });

  describe('Resource links', () => {
    it('renders resource link paths', () => {
      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      expect(screen.getByText(FULL_SNAPSHOT.links.self)).toBeInTheDocument();
      expect(screen.getByText(FULL_SNAPSHOT.links.notes)).toBeInTheDocument();
      expect(screen.getByText(FULL_SNAPSHOT.links.casefile)).toBeInTheDocument();
    });

    it('renders optional links when present', () => {
      render(<EvidenceSnapshotPanel snapshot={FULL_SNAPSHOT} headerCorrelationId={null} />);
      expect(screen.getByText(FULL_SNAPSHOT.links.summary!)).toBeInTheDocument();
      expect(screen.getByText(FULL_SNAPSHOT.links.details!)).toBeInTheDocument();
    });
  });

  describe('Empty notes', () => {
    it('shows "No notes recorded" when note types empty', () => {
      const noNotes: EvidenceSnapshot = {
        ...FULL_SNAPSHOT,
        notes: { totalCount: 0, includedCount: 0, noteTypes: [] },
      };
      render(<EvidenceSnapshotPanel snapshot={noNotes} headerCorrelationId={null} />);
      expect(screen.getByText(/No notes recorded/i)).toBeInTheDocument();
    });
  });
});
